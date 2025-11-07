'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RotateCw, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { pwaService, PWAUtils } from '@/utils/pwa';
import { useToast } from '@/hooks/use-toast';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(pwaService.isAppOnline());
  const [canInstall, setCanInstall] = useState(pwaService.canInstall());
  const [isStandalone, setIsStandalone] = useState(pwaService.isStandalone());
  const [isInstalling, setIsInstalling] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Network status listeners
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "🌐 Back Online",
        description: "Connection restored. Syncing latest data...",
        variant: "default",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "📱 Offline Mode",
        description: "Working with cached data. Changes will sync when connected.",
        variant: "destructive",
      });
    };

    const handleUpdateAvailable = () => {
      setUpdateAvailable(true);
      toast({
        title: "🔄 App Update Available",
        description: "A new version is ready. Refresh to update.",
        variant: "default",
      });
    };

    // Add event listeners
    document.addEventListener('app:online', handleOnline);
    document.addEventListener('app:offline', handleOffline);
    window.addEventListener('pwa:update-available', handleUpdateAvailable);

    // Check install prompt periodically
    const checkInstallPrompt = setInterval(() => {
      setCanInstall(pwaService.canInstall());
    }, 5000);

    return () => {
      document.removeEventListener('app:online', handleOnline);
      document.removeEventListener('app:offline', handleOffline);
      window.removeEventListener('pwa:update-available', handleUpdateAvailable);
      clearInterval(checkInstallPrompt);
    };
  }, [toast]);

  const handleInstallApp = async () => {
    setIsInstalling(true);
    try {
      const installed = await pwaService.install();
      if (installed) {
        setCanInstall(false);
        setIsStandalone(true);
        toast({
          title: "📱 App Installed!",
          description: "FieldShare is now available on your home screen.",
          variant: "default",
        });
      }
    } catch (error) {
      toast({
        title: "Installation Failed",
        description: "Could not install the app. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsInstalling(false);
    }
  };

  const handleRefreshApp = async () => {
    try {
      await pwaService.updateServiceWorker();
      window.location.reload();
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Could not update the app. Please refresh manually.",
        variant: "destructive",
      });
    }
  };

  // Don't show anything if already installed as standalone app
  if (isStandalone) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Badge variant={isOnline ? "secondary" : "destructive"} className="flex items-center gap-2">
          {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {isOnline ? "Online" : "Offline"}
        </Badge>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {/* Network Status */}
      <Badge variant={isOnline ? "secondary" : "destructive"} className="flex items-center gap-2">
        {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
        {isOnline ? "Online" : "Offline"}
      </Badge>

      {/* Update Available */}
      {updateAvailable && (
        <Card className="w-80">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <RotateCw className="h-4 w-4" />
              Update Available
            </CardTitle>
            <CardDescription>
              A new version of FieldShare is ready to install.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button onClick={handleRefreshApp} size="sm" className="w-full">
              Update Now
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Install Prompt */}
      {canInstall && !isStandalone && (
        <Card className="w-80">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Install FieldShare
            </CardTitle>
            <CardDescription>
              Add to home screen for faster access and offline support.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button 
              onClick={handleInstallApp} 
              disabled={isInstalling}
              size="sm" 
              className="w-full"
              data-testid="button-install-pwa"
            >
              {isInstalling ? (
                <RotateCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {isInstalling ? "Installing..." : "Install App"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function PWAStatus() {
  const [cacheInfo, setCacheInfo] = useState<{ quota: number; usage: number; available: number } | null>(null);
  const [displayMode, setDisplayMode] = useState<string>('browser');

  useEffect(() => {
    const loadCacheInfo = async () => {
      const info = await pwaService.getCacheInfo();
      setCacheInfo(info);
      setDisplayMode(PWAUtils.getDisplayMode());
    };

    loadCacheInfo();
  }, []);

  if (!PWAUtils.isPWASupported()) {
    return (
      <div className="text-sm text-muted-foreground p-4 border rounded-lg">
        PWA features not supported in this browser
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">PWA Status</CardTitle>
        <CardDescription>
          Progressive Web App features and storage information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium">Display Mode</div>
            <Badge variant="outline">{displayMode}</Badge>
          </div>
          <div>
            <div className="text-sm font-medium">Platform</div>
            <Badge variant="outline">
              {PWAUtils.isIOS() ? 'iOS' : PWAUtils.isAndroid() ? 'Android' : 'Desktop'}
            </Badge>
          </div>
        </div>

        {cacheInfo && (
          <div>
            <div className="text-sm font-medium mb-2">Storage Usage</div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Used: {(cacheInfo.usage / 1024 / 1024).toFixed(1)} MB</div>
              <div>Available: {(cacheInfo.available / 1024 / 1024).toFixed(1)} MB</div>
              <div>Quota: {(cacheInfo.quota / 1024 / 1024).toFixed(1)} MB</div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${(cacheInfo.usage / cacheInfo.quota) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground">
            FieldShare works offline and syncs when you're back online.
            Perfect for remote farming locations with poor connectivity.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}