'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { queryClient } from './lib/queryClient';
import { useEffect } from 'react';
import { pwaService } from './utils/pwa';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize PWA features
    async function initializePWA() {
      console.log('🚜 Initializing PWA features...');
      
      // Register service worker
      await pwaService.registerServiceWorker();
      
      // Log PWA capabilities
      console.log('🚜 PWA Status:', {
        isStandalone: pwaService.isStandalone(),
        canInstall: pwaService.canInstall(),
        isOnline: pwaService.isAppOnline()
      });
      
      // Setup network change handlers
      pwaService.onOnline(() => {
        console.log('🚜 App came back online - syncing data...');
        document.dispatchEvent(new CustomEvent('app:online'));
      });
      
      pwaService.onOffline(() => {
        console.log('🚜 App went offline - using cached data');
        document.dispatchEvent(new CustomEvent('app:offline'));
      });
    }

    initializePWA().catch(console.error);
  }, []);

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </SessionProvider>
  );
}
