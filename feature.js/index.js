// Code Reference: https://github.com/mozilla/OpenWPM/tree/master/openwpm/Extension/firefox
import {
  CookieInstrument,
  DnsInstrument,
  HttpInstrument,
  JavascriptInstrument,
  NavigationInstrument,
} from "openwpm-webext-instrumentation";
import * as loggingDB from "./loggingdb";

function getCookie(url, name) {
  browser.cookies
    .get({
      url: url,
      name: name,
    })
    .then((cookie) => {
      if (cookie) {
        console.log(
          "[Background Script]url:cookiename:value =>",
          url,
          ":",
          cookie.name,
          ":",
          cookie.value
        );
      }
    });
}
function readCookies(url, names) {
  for (let i in names) {
    getCookie(url, names[i]);
  }
}

function getActiveURL(activeInfo) {
  return new Promise((resolve) => {
    let url;
    browser.tabs.get(activeInfo.tabId, function (tab) {
      url = tab.url;
      resolve(url);
    });
  });
}

// Runs when tabs are activated
browser.tabs.onActivated.addListener(function (activeInfo) {
  getActiveURL(activeInfo).then((activeURL) => {
    readCookies(activeURL, ["udata", "mode"]);
  });
});
// Runs when tabs are updated
browser.tabs.onUpdated.addListener(function (tabID, changeInfo, tab) {
  readCookies(tab.url, ["udata", "mode"]);
});

function StartTracking(response, sender) {
  console.log("[Background Script]Sender =>", sender);
  console.log(
    "[Background Script]Message Received from Content Script =>",
    response.message
  );
  if (response.message === "start") {
    console.log("[Background Script]Get All Cookies");

    // console.log("Start Tracking");
    // main();
  }
}
browser.runtime.onMessage.addListener(StartTracking);

async function main() {
  let config = {
    navigation_instrument: true,
    cookie_instrument: true,
    js_instrument: true,
    cleaned_js_instrument_settings: [
      {
        object: `window.CanvasRenderingContext2D.prototype`,
        instrumentedName: "CanvasRenderingContext2D",
        logSettings: {
          propertiesToInstrument: [],
          nonExistingPropertiesToInstrument: [],
          excludedProperties: [],
          logCallStack: false,
          logFunctionsAsStrings: false,
          logFunctionGets: false,
          preventSets: false,
          recursive: false,
          depth: 5,
        },
      },
    ],
    http_instrument: true,
    callstack_instrument: true,
    save_content: false,
    testing: true,
    browser_id: 0,
  };

  loggingDB.open();
  if (config["navigation_instrument"]) {
    loggingDB.logDebug("Navigation instrumentation enabled");
    let navigationInstrument = new NavigationInstrument(loggingDB);
    navigationInstrument.run(config["browser_id"]);
  }

  if (config["cookie_instrument"]) {
    loggingDB.logDebug("Cookie instrumentation enabled");
    let cookieInstrument = new CookieInstrument(loggingDB);
    cookieInstrument.run(config["browser_id"]);
  }

  if (config["js_instrument"]) {
    loggingDB.logDebug("Javascript instrumentation enabled");
    let jsInstrument = new JavascriptInstrument(loggingDB);
    jsInstrument.run(config["browser_id"]);
    await jsInstrument.registerContentScript(
      config["testing"],
      config["cleaned_js_instrument_settings"]
    );
  }

  if (config["http_instrument"]) {
    loggingDB.logDebug("HTTP Instrumentation enabled");
    let httpInstrument = new HttpInstrument(loggingDB);
    httpInstrument.run(config["browser_id"], config["save_content"]);
  }

  if (config["dns_instrument"]) {
    loggingDB.logDebug("DNS instrumentation enabled");
    let dnsInstrument = new DnsInstrument(loggingDB);
    dnsInstrument.run(config["browser_id"]);
  }

  // await browser.profileDirIO.writeFile("OPENWPM_STARTUP_SUCCESS.txt", "");
}
