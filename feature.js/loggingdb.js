import { type } from "os";

let visitID = null;
function Data() {
  this.count = 0;
  this.userDataType = [];
  this.userData = [];
  this.update = function (type, message) {
    this.userDataType.push(type);
    this.userData.push(message);
    this.count = this.userData.length;
  };
}

function sendMessageToBrowser(mtype, message) {
  browser.tabs.query(
    {
      currentWindow: true,
      active: true,
    },
    function (tabs) {
      console.log("mtype, message", mtype, message);
      for (let tab of tabs) {
        console.log("Sending Message to tab =>", tab.id);
        browser.tabs
          .sendMessage(tab.id, { _mtype: mtype, _message: message })
          .then((response) => {
            // console.log("Response from the browser", response.status);
            // console.log(response);
          });
      }
    }
  );
}

let dataObject = null;
export let open = function () {
  dataObject = new Data();
};

export let close = function () {
  dataObject = null;
  return;
};

export let getData = function () {
  return dataObject;
};

export let logInfo = function (msg) {
  dataObject.update("info", msg);
  return;
};

export let logDebug = function (msg) {
  dataObject.update("debug", msg);
  return;
};

export let logWarn = function (msg) {
  dataObject.update("warn", msg);
  return;
};

export let logError = function (msg) {
  dataObject.update("error", msg);
  return;
};

export let logCritical = function (msg) {
  dataObject.update("critical", msg);
  return;
};

export let saveRecord = function (instrument, record) {
  record["visit_id"] = visitID;
  dataObject.update("EXTENSION:" + instrument, record);
  sendMessageToBrowser("EXTENSION:" + instrument, record);
  return;
};
