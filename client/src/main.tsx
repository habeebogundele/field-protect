import { createRoot } from "react-dom/client";
import { pwaService } from "@/utils/pwa";
import App from "./App";
import "./index.css";

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

// Start the app
createRoot(document.getElementById("root")!).render(<App />);

// Initialize PWA features after app starts
initializePWA().catch(console.error);
