var iasAlertLevelChr = null;
var llsAlertLevelChr = null;
var adapterPath = null;

var bus = null;

cloudeebus.log = function(msg) {
  console.log("XXX: " + msg);
};

function customConfirm(title, msg, type) {
  document.getElementById("conf-title").innerHTML = title;
  document.getElementById("conf-name-disc").innerHTML = msg;
  document.getElementById("conf-button").className = type;

  document.querySelector('#confirm').className = 'fade-in';
}

function propertiesChanged(iface, changed, invalidated) {
  if (iface != "org.bluez.Device1")
    return;

  cloudeebus.log("signal 'PropertiesChanged': " + iface);

  if (changed["Connected"] == null)
    return;
  cloudeebus.log("Connected == " + changed["Connected"] + "name: " + this.Alias);

  if (changed["Connected"] == 0) {
     customConfirm("WARNING", "Device " + this.Alias + " disconnected", "danger");
     document.getElementById("dev-name").innerHTML = this.Alias + "(disconnected)";
     setEnabledItem(this.objectPath, "true");
  } else {
     document.getElementById("dev-name").innerHTML = this.Alias;
     setEnabledItem(this.objectPath, "false");
  }
}

function interfacesAdded(path, interfaces) {
  console.log("Interface added: " + path);

  if (interfaces == null)
    return;

  var properties = interfaces["org.bluez.Device1"];

  if (properties == null)
    return;

  console.log("[ " + properties["Address"] + " ]");
  addItemList(properties, "dev-disc-list", path)
}

function interfacesRemoved(path, interfaces) {
  console.log("Interface removed: " + path);
  
  if (document.querySelector('#dev-discovery').className == 'current') {
      delItemList("discovery" + path);
  } else {
      delItemList(path);
  }
}

function setEnabledItem(id, value) {
  var item = document.getElementById(id);

  if (item == null)
    return;
  item.setAttribute("aria-disabled", value);
}

function delItemList(item) {
  var node = document.getElementById(item);

  if (node == null)
    return;

  node.parentNode.removeChild(node);
}

function clearAllList(list) {
  listView = document.getElementById(list);

  while (listView.hasChildNodes()) {
      listView.removeChild(listView.lastChild);
  }
}

function errorCB(error) {
  cloudeebus.log("error: " + error + "\n");
}

function errorICB(error) {
  console.log("ICB error: " + error + "\n");
}

function errorPCCB(error) {
  console.log("PC error: " + error + "\n");
}

function connectInterface(proxy) {
  console.log("connect Interface ADD/REM");
  proxy.connectToSignal("org.freedesktop.DBus.ObjectManager", "InterfacesAdded", interfacesAdded, errorICB);
  proxy.connectToSignal("org.freedesktop.DBus.ObjectManager", "InterfacesRemoved", interfacesRemoved, errorICB);
}

function connectSuccess() {
  bus = cloudeebus.SystemBus();

  bus.getObject("org.bluez", "/", getManagedObjects, errorCB);
}

function connect() {
  cloudeebus.connect("ws://localhost:9000", null, connectSuccess, errorCB);
}

function getManagedObjects(proxy) {
  connectInterface(proxy);
  proxy.GetManagedObjects().then(getDevices, errorCB);
}

function serviceName(uuid) {
  if (uuid == "00001802-0000-1000-8000-00805f9b34fb")
       return "Immediate Alert Service";
  if (uuid == "00001803-0000-1000-8000-00805f9b34fb")
       return "Link Loss Service";
  return "";
}

function charName(uuid) {
  if (uuid == "00002a06-0000-1000-8000-00805f9b34fb")
       return "Alert Level Characteristic";

  return "";
}

function getService(objs, pathDevice, uuid) {
      var service = null;

      for (o in objs) {
        if (objs[o]["org.bluez.Service1"] == null)
          continue;

        if (objs[o]["org.bluez.Service1"]["UUID"] == uuid) {

	  if (o.indexOf(pathDevice) == 0) {
                cloudeebus.log("Found " + serviceName(uuid) + " " + o);
                service = o;
	        break;
          }
        }
      }

      if (service == null)
        cloudeebus.log(serviceName(uuid) + " service not found");

      return service;
}

function getChar(objs, pathService, uuid) {
      var alertLevelChr = null;

      for (o in objs) {
        if (objs[o]["org.bluez.Characteristic1"] == null)
          continue;

        if (objs[o]["org.bluez.Characteristic1"]["UUID"] == uuid) {

	  if (o.indexOf(pathService) == 0) {
                cloudeebus.log("Found " + charName(uuid) + " " + o);
                alertLevelChr = o;
	        break;
          }
        }
      }

      if (alertLevelChr == null)
        cloudeebus.log(charName(uuid) + " for " + svc[uuid] + " not found");

      return alertLevelChr;
}

function cleanRadioButtons() {
  document.getElementById("ias-none").checked = false;
  document.getElementById("ias-mild").checked = false;
  document.getElementById("ias-high").checked = false;

  document.getElementById("lls-none").checked = false;
  document.getElementById("lls-mild").checked = false;
  document.getElementById("lls-high").checked = false;
}

function callProximity(objs, o) {
  var pathIasService = getService(objs, o, "00001802-0000-1000-8000-00805f9b34fb");
  if (pathIasService)
    iasAlertLevelChr = getChar(objs, pathIasService, "00002a06-0000-1000-8000-00805f9b34fb");

  var pathLlsService = getService(objs, o, "00001803-0000-1000-8000-00805f9b34fb");
  if (pathLlsService)
    llsAlertLevelChr = getChar(objs, pathLlsService, "00002a06-0000-1000-8000-00805f9b34fb");

  cleanRadioButtons();
  document.querySelector('#proximity').className = 'current';
  document.querySelector('[data-position="current"]').className = 'left';
}

function immAlert(value) {
  if (iasAlertLevelChr == null)
      return;

  function successCB() {
      cloudeebus.log("Set IAS alert level to " + value);
  }

  /* FIXME: add support for D-Bus byte array (e.g. converted from Uint8Array())
   * so the methods with "ay" signature can use the automatic introspection. */
  var obj = bus.getObject("org.bluez", iasAlertLevelChr, null, errorCB);
  obj.callMethod("org.freedesktop.DBus.Properties", "Set",
      ["org.bluez.Characteristic1", "Value", [value]], "ssv").then(successCB, errorCB);
}

function llsAlert(value) {
  if (llsAlertLevelChr == null)
      return;

  function successCB() {
      cloudeebus.log("Set LLS alert level to " + value);
  }

  /* FIXME: add support for D-Bus byte array (e.g. converted from Uint8Array())
   * so the methods with "ay" signature can use the automatic introspection. */
  var obj = bus.getObject("org.bluez", llsAlertLevelChr, null, errorCB);
  obj.callMethod("org.freedesktop.DBus.Properties", "Set",
      ["org.bluez.Characteristic1", "Value", [value]], "ssv").then(successCB, errorCB);
}

function connectSignal(proxy) {
      proxy.connectToSignal("org.freedesktop.DBus.Properties", "PropertiesChanged", propertiesChanged, errorPCCB);
}

function stopScan(proxy) {
  proxy.StopDiscovery();
}

function deviceScanOff() {
  console.log("Stop scanning ...");
  document.getElementById("spin-dev-disc").style.visibility = "hidden";
  bus.getObject("org.bluez", adapterPath, stopScan, errorCB);
}

function startScan(proxy) {
  proxy.StartDiscovery();
}

function deviceScanOn() {
  console.log("Start scanning ...");
  document.getElementById("spin-dev-disc").style.visibility = "visible";
  bus.getObject("org.bluez", adapterPath, startScan, errorCB);
}

function addHeaderList(header, spin, list, ulId) {
  var memoListContainer = document.getElementById(list);
  var item = document.createElement("header");

  item.appendChild(document.createTextNode(header));
  if (spin != null) {
    var spinItem = document.createElement("progress");
    spinItem.id = spin;
    spinItem.style.marginLeft = "15px";
    spinItem.style.marginBottom = "10px";
    item.appendChild(spinItem);
  }
  memoListContainer.appendChild(item);

  var memoList = document.createElement("ul");
  memoList.id = ulId;
  memoListContainer.appendChild(memoList);

  return memoList;
}

function errorPairCB(error, msg) {
  console.log(msg + " error: " + error);
  customConfirm("WARNING", msg, "danger");
}

function rebuildDevList() {
  bus.getObject("org.bluez", "/",
    function (proxy) { proxy.GetManagedObjects().then(getDevices, errorCB); },
    function (error) { console.log("Device list: " + error); });
}

function successPairCB(path, msg) {
  console.log(msg);
  delItemList("discovery" + path);
  customConfirm("Result", msg, "");
}

function callPairDevice(path, alias, paired) {
  console.log("Pair device: " + path + ", paired: " + paired);

  var obj = bus.getObject("org.bluez", path, null, errorCB);

  if (paired == 0) {
    console.log("Attempting to pair with " + alias);
    obj.callMethod("org.bluez.Device1", "Pair", []).then(function () { successPairCB(path, "Device " + alias + " : " + "Pairing successful"); },
       function (error) { errorPairCB(error, "Failed to pair: " + alias); });
  }
  else {
    console.log("Already paired, attempting to connect with " + alias);
    obj.callMethod("org.bluez.Device1", "Connect", []).then(function () { successPairCB(path, "Device " + alias + " : " + "Connection successful"); },
      function (error) { errorPairCB(error, "Failed to connect: " + alias); });
  }
}

function addItemList(properties, list, path) {
  var memoList = document.getElementById(list);
  var memoItem = document.createElement("li");

  memoItem.setAttribute("data-name", properties["Alias"]);
  memoItem.id = "discovery" + path;
  
  memoItem.addEventListener("click", function (e) {
    console.log("Pair to device (clicked): " + this.getAttribute("data-name"));

    callPairDevice(path, this.getAttribute("data-name"), properties["Paired"]);
  });

  var memoA = document.createElement("a");
  var memoP = document.createElement("p");
  var memoTitle = document.createTextNode(properties["Alias"]);

  memoP.appendChild(memoTitle);
  memoA.appendChild(memoP);
  memoItem.appendChild(memoA);
  memoList.appendChild(memoItem);
}

function getTMPDevices(objs) {
  for (o in objs) {
    if (objs[o]["org.bluez.Device1"] == null)
      continue;

    console.log(o + objs[o]["org.bluez.Device1"]);
    // Get temporary devices and not connect devices (already paired)
    if (objs[o]["org.bluez.Device1"]["Connected"] == 1)
      continue;

    console.log("Device discovery:" + objs[o]["org.bluez.Device1"]["Alias"]);
    addItemList(objs[o]["org.bluez.Device1"], "dev-disc-list", o);
  }
}

function createRemList() {

  var memoList = document.getElementById("rem-dev-list");
  var memoItem = document.createElement("li");
  memoItem.setAttribute("data-name", alias);
  memoItem.id = "remove" + path;

  var checkLabel = document.createElement("label");
  checkLabel.className = "pack-radio danger";

  var input = document.createElement("input");
  input.type = "radio";

  var span = document.createElement("span");
  
  checkLabel.appendChild(input);
  checkLabel.appendChild(span);
  
  memoItem.addEventListener("click", function (e) {
    console.log("Remove device: " + this.getAttribute("data-name"));

    callRemoveDevice(this.id);
  });

  var memoA = document.createElement("a");
  var memoP = document.createElement("p");
  var memoTitle = document.createTextNode(properties["Alias"]);

  memoP.appendChild(memoTitle);
  memoA.appendChild(memoP);
  memoItem.appendChild(checkLabel);
  memoItem.appendChild(memoA);
  memoList.appendChild(memoItem);
}

function createDiscList() {
  // Create device discovery list
  clearAllList("dev-disc-list");
  addHeaderList("Devices Found", "spin-dev-disc", "dev-disc-list", "dev-disc-list-ul");
  document.querySelector('#btn-stop-disc').innerHTML = "STOP";

  bus.getObject("org.bluez", "/",
    function (proxy) { proxy.GetManagedObjects().then(getTMPDevices, errorCB); },
    function (error) { console.log("Device discovery list: " + error); });
}

function getDevices(objs) {
  // Create device list
  clearAllList("dev-list");

  var memoList = addHeaderList("Available Devices (Paired)", null, "dev-list", "dev-list-ul");

  for (o in objs) {

    if (adapterPath ==null && objs[o]["org.bluez.Adapter1"] != null) {
      console.log("Adapter: " + o);
      adapterPath = o;
    }

    if (objs[o]["org.bluez.Device1"] == null)
      continue;

       // Ignore temporary devices
       if (objs[o]["org.bluez.Device1"]["Paired"] == 0)
         continue;

       cloudeebus.log("Device paired:" + objs[o]["org.bluez.Device1"]["Alias"]);
       bus.getObject("org.bluez", o, connectSignal, errorCB);

        var memoItem = document.createElement("li");
	memoItem.setAttribute("data-name", objs[o]["org.bluez.Device1"]["Alias"]);
        memoItem.id = o;
        if (objs[o]["org.bluez.Device1"]["Connected"] == 0)
          memoItem.setAttribute("aria-disabled", "true");
        memoItem.addEventListener("click", function (e) {
            console.log("clicked device: " + this.getAttribute("data-name"));

            document.getElementById("dev-name").innerHTML = this.getAttribute("data-name");
	    callProximity(objs, this.id);
        });

        var memoA = document.createElement("a");
        var memoP = document.createElement("p");
        var memoTitle = document.createTextNode(objs[o]["org.bluez.Device1"]["Alias"]);

        memoP.appendChild(memoTitle);
	memoA.appendChild(memoP);
        memoItem.appendChild(memoA);
        memoList.appendChild(memoItem);
    } 
}
