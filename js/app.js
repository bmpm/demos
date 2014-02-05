document.querySelector('#btn-prox-back').addEventListener ('click', function () {
  document.querySelector('#proximity').className = 'right';
  document.querySelector('[data-position="current"]').className = 'current';
});

document.querySelector('#btn-disc-back').addEventListener ('click', function () {
  document.querySelector('#dev-discovery').className = 'right';
  document.querySelector('[data-position="current"]').className = 'current';
  if (document.querySelector('#btn-stop-disc').innerHTML != "START")
    deviceScanOff();
  rebuildDevList(); 
});

document.querySelector('#btn-stop-disc').addEventListener ('click', function () {
  if (this.innerHTML == "STOP") {
    deviceScanOff();
    this.innerHTML = "START";
  } else {
    deviceScanOn();
    this.innerHTML = "STOP";
  }
});

document.querySelector('#dev-search').addEventListener ('click', function () {
  createDiscList();

  document.querySelector('#dev-discovery').className = 'current';
  document.querySelector('[data-position="current"]').className = 'left';
  deviceScanOn();
});

//confirm
document.querySelector('#confirm').addEventListener ('click', function () {
  this.className = 'fade-out';
});



