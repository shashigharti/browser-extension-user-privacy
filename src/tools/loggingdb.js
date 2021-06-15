let crawlID = null;
let visitID = null;
let debugging = false;
let storageController = null;
let logAggregator = null;

export let open = async function(storageControllerAddress, logAddress, curr_crawlID) {
    if (storageControllerAddress == null && logAddress == null && curr_crawlID === 0) {
        console.log("Debugging, everything will output to console");
        debugging = true;
        return;
    }
};

export let close = function() {
    if (storageController != null) {
        storageController.close();
    }
    if (logAggregator != null) {
        logAggregator.close();
    }
};

export let logInfo = function(msg) {
    // Always log to browser console
    console.log(msg);

    if (debugging) {
        return;
    }
};

export let logDebug = function(msg) {
    // Always log to browser console
    console.log(msg);

    if (debugging) {
        return;
    }
};

export let logWarn = function(msg) {
    // Always log to browser console
    console.warn(msg);

    if (debugging) {
        return;
    }
};

export let logError = function(msg) {
    // Always log to browser console
    console.error(msg);

    if (debugging) {
        return;
    }
};

export let logCritical = function(msg) {
    // Always log to browser console
    console.error(msg);

    if (debugging) {
        return;
    }
};

export let dataReceiver = {
    saveRecord(a, b) {
        console.log(b);
    },
};

export let saveRecord = function(instrument, record) {
    record["visit_id"] = visitID;

    if (!visitID && !debugging) {
        // Navigations to about:blank can be triggered by OpenWPM. We drop those.
        if(instrument === 'navigations' && record['url'] === 'about:blank') {
            logDebug('Extension-' + crawlID + ' : Dropping navigation to about:blank in intermediate period');
            return;
        }
        logWarn(`Extension-${crawlID} : visitID is null while attempting to insert into table ${instrument}\n` +
                    JSON.stringify(record));
        record["visit_id"] = -1;
        
    }

    // send to console if debugging
    if (debugging) {
      console.log("EXTENSION", instrument, record);
      return;
    }
};

// Stub for now
export let saveContent = async function(content, contentHash) {
  // Send page content to the data aggregator
  // deduplicated by contentHash in a levelDB database
  if (debugging) {
    console.log("LDB contentHash:",contentHash,"with length",content.length);
    return;
  }
};
