// FieldShare Service Worker - PWA Offline Support
// Version bumped to clear auth route caches
const CACHE_NAME = 'fieldshare-v2.1.0';
const STATIC_CACHE = 'fieldshare-static-v2.1';
const DYNAMIC_CACHE = 'fieldshare-dynamic-v2.1';

// Essential files to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// API endpoints to cache for offline access
const CACHE_API_PATTERNS = [
  '/api/fields',
  '/api/weather',
  '/api/user',
  '/api/adjacent-fields'
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('🚜 FieldShare SW: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('🚜 FieldShare SW: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('🚜 FieldShare SW: Static assets cached successfully');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('🚜 FieldShare SW: Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚜 FieldShare SW: Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => 
            cacheName !== STATIC_CACHE && 
            cacheName !== DYNAMIC_CACHE
          )
          .map((cacheName) => {
            console.log('🚜 FieldShare SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
    .then(() => {
      console.log('🚜 FieldShare SW: Activated and claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and external URLs
  if (request.method !== 'GET' || !url.origin.includes(self.location.origin)) {
    return;
  }

  // CRITICAL: Never cache authentication routes, admin routes, or user dashboard routes
  // These must always hit the server to check fresh session/permissions
  if (isAuthRoute(request) || isAdminRoute(request) || isUserRoute(request)) {
    console.log('🚜 SW: Bypassing cache for protected route:', request.url);
    event.respondWith(fetch(request));
    return;
  }

  // Different strategies for different content types
  if (isStaticAsset(request)) {
    // Cache First strategy for static assets
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
  } else if (isAPIRequest(request)) {
    // Network First strategy for API calls with offline fallback
    event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
  } else {
    // Stale While Revalidate for HTML pages
    event.respondWith(staleWhileRevalidateStrategy(request, DYNAMIC_CACHE));
  }
});

// Cache First Strategy - for static assets
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('🚜 SW: Serving from cache:', request.url);
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('🚜 SW: Cache first failed:', error);
    return new Response('Offline - Asset not available', { status: 503 });
  }
}

// Network First Strategy - for API calls
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      // Cache API responses for offline access
      cache.put(request, networkResponse.clone());
      console.log('🚜 SW: API response cached:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('🚜 SW: Network failed, trying cache for:', request.url);
    
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('🚜 SW: Serving cached API response:', request.url);
      return cachedResponse;
    }
    
    // Return offline response for API calls
    return new Response(
      JSON.stringify({
        offline: true,
        message: 'You are offline. Data may not be current.',
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Stale While Revalidate Strategy - for HTML pages
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Fetch from network in background to update cache
  const fetchPromise = fetch(request).then((networkResponse) => {
    // CRITICAL: Never cache redirects (they contain auth state)
    if (networkResponse.status === 200 && !networkResponse.redirected) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });
  
  // Return cached version immediately if available, otherwise wait for network
  if (cachedResponse) {
    console.log('🚜 SW: Serving stale content, updating in background:', request.url);
    return cachedResponse;
  }
  
  return fetchPromise;
}

// Background Sync for field updates when back online
self.addEventListener('sync', (event) => {
  console.log('🚜 SW: Background sync triggered:', event.tag);
  
  if (event.tag === 'field-updates') {
    event.waitUntil(syncFieldUpdates());
  } else if (event.tag === 'weather-sync') {
    event.waitUntil(syncWeatherData());
  }
});

// Sync field updates when connectivity returns
async function syncFieldUpdates() {
  try {
    console.log('🚜 SW: Syncing field updates...');
    
    // Get pending field updates from IndexedDB or cache
    const pendingUpdates = await getPendingFieldUpdates();
    
    for (const update of pendingUpdates) {
      try {
        await fetch('/api/fields', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update)
        });
        console.log('🚜 SW: Field update synced successfully');
      } catch (error) {
        console.error('🚜 SW: Failed to sync field update:', error);
      }
    }
  } catch (error) {
    console.error('🚜 SW: Background sync failed:', error);
  }
}

// Sync weather data for offline viewing
async function syncWeatherData() {
  try {
    console.log('🚜 SW: Syncing weather data...');
    
    // Fetch latest weather for user's fields
    const fieldsResponse = await fetch('/api/fields');
    if (fieldsResponse.ok) {
      const fields = await fieldsResponse.json();
      const cache = await caches.open(DYNAMIC_CACHE);
      
      // Cache weather data for each field
      for (const field of fields.slice(0, 5)) { // Limit to 5 most recent fields
        try {
          const weatherResponse = await fetch(`/api/fields/${field.id}/weather`);
          if (weatherResponse.ok) {
            cache.put(`/api/fields/${field.id}/weather`, weatherResponse.clone());
          }
        } catch (error) {
          console.error('🚜 SW: Failed to cache weather for field:', field.id);
        }
      }
    }
  } catch (error) {
    console.error('🚜 SW: Weather sync failed:', error);
  }
}

// Push notifications for weather alerts and access requests
self.addEventListener('push', (event) => {
  console.log('🚜 SW: Push notification received');
  
  const options = {
    body: 'You have new agricultural updates',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/icons/icon-96x96.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/icon-96x96.png'
      }
    ]
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      options.body = payload.message || options.body;
      options.data = { ...options.data, ...payload };
    } catch (error) {
      console.error('🚜 SW: Failed to parse push payload:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification('FieldShare', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🚜 SW: Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Utility functions
function isStaticAsset(request) {
  return request.url.includes('/icons/') || 
         request.url.includes('/manifest.json') ||
         request.url.includes('.css') ||
         request.url.includes('.js') ||
         request.url.includes('.png') ||
         request.url.includes('.jpg') ||
         request.url.includes('.svg');
}

function isAPIRequest(request) {
  return request.url.includes('/api/');
}

// CRITICAL: Check if request is an authentication route
function isAuthRoute(request) {
  const url = new URL(request.url);
  const authPaths = [
    '/login',
    '/signup',
    '/admin/login',
    '/admin/signup',
    '/api/auth/login',
    '/api/auth/logout',
    '/api/auth/signup',
    '/api/auth/me'
  ];
  return authPaths.some(path => url.pathname === path || url.pathname.startsWith(path));
}

// CRITICAL: Check if request is an admin route
function isAdminRoute(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/admin') && 
         url.pathname !== '/admin/login' && 
         url.pathname !== '/admin/signup';
}

// CRITICAL: Check if request is a user dashboard route
function isUserRoute(request) {
  const url = new URL(request.url);
  const userPaths = ['/dashboard', '/fields', '/adjacent-fields', '/profile', '/subscription'];
  return userPaths.some(path => url.pathname === path || url.pathname.startsWith(path));
}

async function getPendingFieldUpdates() {
  // In a real implementation, this would read from IndexedDB
  // For now, return empty array
  return [];
}

// Message handling for communication with main app
self.addEventListener('message', (event) => {
  console.log('🚜 SW: Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});