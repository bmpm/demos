document.querySelector('#btn-prox-back').addEventListener ('click', function () {
  document.querySelector('#proximity').className = 'right';
  document.querySelector('[data-position="current"]').className = 'current';
});

document.querySelector('#btn-disc-back').addEventListener ('click', function () {
  document.querySelector('#dev-discovery').className = 'right';
  document.querySelector('[data-position="current"]').className = 'current';
  deviceScanOff();  
});

document.querySelector('#btn-stop-disc').addEventListener ('click', function () {
  if (this.innerHTML === "STOP") {
    deviceScanOff();
    this.innerHTML = "START";
  } else {
    deviceScanOn();
    this.innerHTML = "STOP";
  }
});

document.querySelector('#dev-search').addEventListener ('click', function () {
  clearAllList("dev-disc-list");
  addHeaderList("Devices Found", "dev-disc-list", "dev-disc-list-ul");
  document.querySelector('#btn-stop-disc').innerHTML = "STOP";

  document.querySelector('#dev-discovery').className = 'current';
  document.querySelector('[data-position="current"]').className = 'left';
  deviceScanOn();
});

//confirm
document.querySelector('#confirm').addEventListener ('click', function () {
  this.className = 'fade-out';
});



