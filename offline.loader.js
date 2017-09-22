
if (navigator && navigator.serviceWorker) {
  navigator.serviceWorker.register('offline.js')
    .then(function (reg) {
      console.log('offlinejs registered');
    })
    .catch(function (err) {
      console.log('offlinejs failed to register', err);
    });
}
else {
  console.log('offlinejs not available');
}
