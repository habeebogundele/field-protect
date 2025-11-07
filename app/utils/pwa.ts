// PWA Service Worker Registration and Utilities

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

class PWAService {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private swRegistration: ServiceWorkerRegistration | null = null;
  private isOnline: boolean = navigator.onLine;
  private onlineCallbacks: Array<() => void> = [];
  private offlineCallbacks: Array<() => void> = [];

  constructor() {
    this.setupNetworkListeners();
    this.setupInstallPrompt();
  }

  /**
   * Register service worker for PWA functionality
   */
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.warn('🚜 PWA: Service Worker not supported');
      return null;
    }

    try {
      console.log('🚜 PWA: Registering service worker...');
      
      this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('🚜 PWA: Service Worker registered successfully');

      // Listen for service worker updates
      this.swRegistration.addEventListener('updatefound', () => {
        const newWorker = this.swRegistration?.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🚜 PWA: New service worker available');
              this.showUpdateNotification();
            }
          });
        }
      });

      // Handle service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('🚜 PWA: Message from service worker:', event.data);
      });

      return this.swRegistration;
    } catch (error) {
      console.error('🚜 PWA: Service Worker registration failed:', error);
      return null;
    }
  }

  /**
   * Check if app can be installed as PWA
   */
  canInstall(): boolean {
    return this.deferredPrompt !== null;
  }

  /**
   * Trigger PWA installation prompt
   */
  async install(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.warn('🚜 PWA: Install prompt not available');
      return false;
    }

    try {
      // Show the install prompt
      await this.deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await this.deferredPrompt.userChoice;
      
      console.log('🚜 PWA: Install prompt result:', outcome);
      
      // Clear the deferred prompt
      this.deferredPrompt = null;
      
      return outcome === 'accepted';
    } catch (error) {
      console.error('🚜 PWA: Install prompt failed:', error);
      return false;
    }
  }

  /**
   * Check if app is running in standalone mode
   */
  isStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  /**
   * Check network connectivity
   */
  isAppOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Register callback for when app comes online
   */
  onOnline(callback: () => void): void {
    this.onlineCallbacks.push(callback);
  }

  /**
   * Register callback for when app goes offline
   */
  onOffline(callback: () => void): void {
    this.offlineCallbacks.push(callback);
  }

  /**
   * Request background sync for field updates
   */
  async requestBackgroundSync(tag: string): Promise<void> {
    if (!this.swRegistration) {
      console.warn('🚜 PWA: Service Worker not registered, cannot sync');
      return;
    }

    try {
      // Type guard for background sync API
      const registration = this.swRegistration as any;
      if ('sync' in registration) {
        await registration.sync.register(tag);
        console.log('🚜 PWA: Background sync registered:', tag);
      } else {
        console.warn('🚜 PWA: Background sync not supported in this browser');
      }
    } catch (error) {
      console.error('🚜 PWA: Background sync registration failed:', error);
    }
  }

  /**
   * Update service worker to latest version
   */
  async updateServiceWorker(): Promise<void> {
    if (!this.swRegistration) {
      console.warn('🚜 PWA: No service worker to update');
      return;
    }

    try {
      await this.swRegistration.update();
      console.log('🚜 PWA: Service worker update check completed');
    } catch (error) {
      console.error('🚜 PWA: Service worker update failed:', error);
    }
  }

  /**
   * Get cache usage information
   */
  async getCacheInfo(): Promise<{ quota: number; usage: number; available: number } | null> {
    if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
      return null;
    }

    try {
      const estimate = await navigator.storage.estimate();
      return {
        quota: estimate.quota || 0,
        usage: estimate.usage || 0,
        available: (estimate.quota || 0) - (estimate.usage || 0)
      };
    } catch (error) {
      console.error('🚜 PWA: Failed to get cache info:', error);
      return null;
    }
  }

  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      console.log('🚜 PWA: App is online');
      this.isOnline = true;
      this.onlineCallbacks.forEach(callback => callback());
      
      // Request background sync when coming back online
      this.requestBackgroundSync('field-updates');
      this.requestBackgroundSync('weather-sync');
    });

    window.addEventListener('offline', () => {
      console.log('🚜 PWA: App is offline');
      this.isOnline = false;
      this.offlineCallbacks.forEach(callback => callback());
    });
  }

  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      console.log('🚜 PWA: Install prompt available');
      
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      
      // Stash the event so it can be triggered later
      this.deferredPrompt = e as BeforeInstallPromptEvent;
    });

    window.addEventListener('appinstalled', () => {
      console.log('🚜 PWA: App installed successfully');
      this.deferredPrompt = null;
    });
  }

  private showUpdateNotification(): void {
    // In a real app, this would show a notification to the user
    console.log('🚜 PWA: App update available - please refresh');
    
    // You could dispatch a custom event or call a callback here
    window.dispatchEvent(new CustomEvent('pwa:update-available'));
  }
}

// Export singleton instance
export const pwaService = new PWAService();

// Types for external use
export type { BeforeInstallPromptEvent };

// Utility functions
export const PWAUtils = {
  /**
   * Check if device supports PWA features
   */
  isPWASupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  },

  /**
   * Detect if app is running on iOS
   */
  isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  },

  /**
   * Detect if app is running on Android
   */
  isAndroid(): boolean {
    return /Android/.test(navigator.userAgent);
  },

  /**
   * Get PWA display mode
   */
  getDisplayMode(): string {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return 'standalone';
    }
    if (window.matchMedia('(display-mode: minimal-ui)').matches) {
      return 'minimal-ui';
    }
    if (window.matchMedia('(display-mode: fullscreen)').matches) {
      return 'fullscreen';
    }
    return 'browser';
  }
};