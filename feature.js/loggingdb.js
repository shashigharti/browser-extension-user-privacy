import { startFLTraining } from "./syft.js";

let visitID = null;
function Data() {
    this.count = 0;
    this.userDataType = [];
    this.userData = [];
    this.update = function(type, message) {
        this.userDataType.push(type);
        this.userData.push(message);
        this.count = (this.userData.length);

        if(this.count == 500){
            this.userDataType = [];
            this.userData = [];
            this.count = 0;
            startFL();
        }
    };
}

function sendMessageToBrowser(mtype, message) {
    browser.runtime.sendMessage({
        type: mtype,
        data: message
    });
}

let dataObject = null;
export let open = function() {
    dataObject = new Data();
};

export let close = function() {
    dataObject = null;
    return;
};

export let getData = function() {
    return dataObject;
};

export let logInfo = function(msg) {
    dataObject.update('info', msg);
    return;
};

export let logDebug = function(msg) {
    dataObject.update('debug', msg);
    return;
};

export let logWarn = function(msg) {
    dataObject.update('warn', msg);
    return;
};

export let logError = function(msg) {
    dataObject.update('error', msg);
    return;
};

export let logCritical = function(msg) {
    dataObject.update('critical', msg);
    return;
};

export let saveRecord = function(instrument, record) {
    record["visit_id"] = visitID;
    dataObject.update("EXTENSION:" + instrument, record);    
    sendMessageToBrowser("EXTENSION:" + instrument, record);    
    return;
};
