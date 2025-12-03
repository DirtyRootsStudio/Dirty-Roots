// pwa/app/sw.js  
const CACHE_NAME = 'dirty-roots-v1';  
const urlsToCache = [  
  '/community/herbarium',  
  '/community/questions',   
  '/community/profile',  
  '/manifest.json'  
];  
  
self.addEventListener('install', (event) => {  
  event.waitUntil(  
    caches.open(CACHE_NAME)  
      .then((cache) => cache.addAll(urlsToCache))  
  );  
});  
  
self.addEventListener('fetch', (event) => {  
  event.respondWith(  
    caches.match(event.request)  
      .then((response) => response || fetch(event.request))  
  );  
});