// import * as loggingDB from "./loggingdb";

// function getCookie(url, name) {
//   browser.cookies
//     .get({
//       url: url,
//       name: name,
//     })
//     .then((cookie) => {
//       if (cookie) {
//         console.log("[Background Script] Sending Cookies to Content Script");
//         loggingDB.sendMessageToBrowser(cookie.name, cookie.value);
//         console.log(
//           "[Background Script]url:cookiename:value =>",
//           url,
//           ":",
//           cookie.name,
//           ":",
//           cookie.value
//         );
//       }
//     });
// }
// function readCookies(url, names) {
//   for (let i in names) {
//     getCookie(url, names[i]);
//   }
// }

// function getActiveURL(activeInfo) {
//   return new Promise((resolve) => {
//     let url;
//     browser.tabs.get(activeInfo.tabId, function (tab) {
//       url = tab.url;
//       resolve(url);
//     });
//   });
// }

// // Runs when tabs are activated
// browser.tabs.onActivated.addListener(function (activeInfo) {
//   getActiveURL(activeInfo).then((activeURL) => {
//     readCookies(activeURL, ["udata", "mode", "user_privacy_preference_level"]);
//   });
// });
// // Runs when tabs are updated
// browser.tabs.onUpdated.addListener(function (tabID, changeInfo, tab) {
//   readCookies(tab.url, ["udata", "mode", "user_privacy_preference_level"]);
// });
// browser.tabs.onCreated.addListener(function (tab) {
//   readCookies(tab.url, ["udata", "mode", "user_privacy_preference_level"]);
// });

// This should be uncommented to start user data tracking
// function StartTracking(response, sender) {
//   console.log("[Background Script]Sender =>", sender);
//   console.log(
//     "[Background Script]Message Received from Content Script =>",
//     response.message
//   );
//   if (response.message === "start") {
//     console.log("[Background Script]Message", response.message);
//   }
// }
// browser.runtime.onMessage.addListener(StartTracking);