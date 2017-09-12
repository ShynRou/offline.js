
if (navigator && navigator.serviceWorker) {
  navigator.serviceWorker.register('offline.js')
    .then(function (reg) {
      console.log('offlinejs registered', reg);
    })
    .catch(function (err) {
      console.log('offlinejs not available', err);
    });
}
