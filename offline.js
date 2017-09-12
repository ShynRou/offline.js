self.addEventListener('install', function (event) {
  event['waitUntil'](
    caches.open(/*[version]*/).then(function (cache) {
      return cache.addAll([
        /*[static_files]*/
      ]);
    })
  );
});

self.addEventListener('activate', function(event) {

  var cacheWhitelist = [/*[version]*/];

  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(caches.match(event.request));
});