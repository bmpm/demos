document.querySelector('#btn-prox-back').addEventListener ('click', function () {
  document.querySelector('#proximity').className = 'right';
  document.querySelector('[data-position="current"]').className = 'current';
});

document.querySelector('#btn-disc-back').addEventListener ('click', function () {
  document.querySelector('#dev-discovery').className = 'right';
  document.querySelector('[data-position="current"]').className = 'current';
  deviceScanOff();  
});

document.querySelector('#dev-search').addEventListener ('click', function () {
  document.querySelector('#dev-discovery').className = 'current';
  document.querySelector('[data-position="current"]').className = 'left';
  deviceScanOn();
});

//confirm
document.querySelector('#confirm').addEventListener ('click', function () {
  this.className = 'fade-out';
});



