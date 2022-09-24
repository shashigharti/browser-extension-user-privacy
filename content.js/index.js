import {getPageScript} from "./lib/useractivity"
import {getMLScript} from "./lib/ml"
console.log(
  "[Content Script - Insert User Activity Tracking Code"
);

function insertScript(text, data) {
  var parent = document.documentElement,
      script = document.createElement('script');

  script.text = text;
  script.async = false;

  for (var key in data) {
      script.setAttribute('data-' + key.replace('_', '-'), data[key]);
  }

  parent.insertBefore(script, parent.firstChild);
  parent.removeChild(script);
}

// Tracking - Tracking code to track user activities
insertScript(getPageScript(), {
  event_id: Math.random()
});

// console.log(
//   "[Content Script - Insert ML Code]"
// );
// // ML -  Machine Learning Code(RL)
// insertScript(getMLScript(), {
//   event_id: Math.random()
// });