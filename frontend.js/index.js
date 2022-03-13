import { argMax, simulate, actionAndUpdate } from "./common";
import { ADS, META_DATA, ALL_UIOPTIONS } from "./data/";

const { jStat } = require("jstat");

const id = 7;
const API_ENDPOINT = "127.0.0.1:8000";
const url = "ws://" + API_ENDPOINT + "/fl-server/" + META_DATA[id].model_name;

// Features/parameters that determine the users action
let alphasArray = [],
  betasArray = [],
  policy = [],
  betaDistribution = [],
  clientId = null,
  selectedOption = 0,
  cycle = 0,
  socket = null,
  simulation = true;

// User options : 3 types of options
const dim = 3,
  noOfClients = META_DATA[id].no_of_clients,
  stopAfter = 400,
  policies = [
    [0.8, 0.1, 0.1],
    [0.1, 0.8, 0.1],
    [0.2, 0.2, 0.6],
  ],
  // options = 0,
  imgSrc = "",
  elem = document.getElementsByTagName("BODY")[0],
  allSelectedOptions = {};

// Initialize
// options = Object.keys(books).length;
socket = new WebSocket(url);
clientId = Math.floor(Math.random() * noOfClients);
policy = policies[clientId];
console.log("[Content Script - Socket]Selected Policy:", policy);

/**
 * Choose the best option(with highest reward probability) among other various options;
 * random probability using beta distribution
 */
const selectSample = () => {
  // For each option find the probability using beta distribution
  for (let opt = 0; opt < alphasArray.length; opt++) {
    // Get a beta distribution for all alpha and beta pair
    betaDistribution[opt] = jStat.beta.sample(
      alphasArray[opt],
      betasArray[opt]
    );
  }
  console.log("[Content Script - Socket]Beta Distribution", betaDistribution);
  console.log("[Content Script - Socket]Policy", policy);

  if (betaDistribution.length > 0) {
    // Random selection of option from available ones
    selectedOption = argMax(betaDistribution);
    console.log(
      "[Content Script - Socket]New option selected:",
      selectedOption
    );

    rewardAndUpdateWeights();
  }
};

/**
 * Simulate the user action and update the reward
 */
const rewardAndUpdateWeights = () => {
  // If simulation is true, simulate the user action
  if (simulation && cycle <= stopAfter) {
    console.log("[Content Script - Socket]Simulate");

    let new_reward = simulate(policy, selectedOption);
    let params = actionAndUpdate(
      alphasArray,
      betasArray,
      selectedOption,
      new_reward
    );

    if (params) {
      let gradWeights = params[0];

      console.log(
        "[Content Script - Socket]Diff: alphas and betas",
        gradWeights[0].dataSync(),
        gradWeights[1].dataSync()
      );

      // Send data to the server
      console.log(
        "[Content Script - Socket]Sending new gradients to the server"
      );

      socket.send(
        JSON.stringify({
          event: "update", // 0 ->  event
          alphas: gradWeights[0].dataSync(), // 1 ->  alphas
          betas: gradWeights[1].dataSync(), // 2 -> betas
          client_id: clientId,
          model_name: "example_" + id,
        })
      );
    }
  }
};

/**
 * Initialize and start the training process
 */
const initialize = (clientId) => {
  console.log("[Content Script - Socket]Onopen event registered");
  // Connect to the server & Get params from server
  socket.onopen = (message) => {
    console.log("[Content Script - Socket]Connecton Established");
    console.log("[Content Script - Socket]Received Message", message);
    socket.send(
      JSON.stringify({
        event: "connected",
        client_id: clientId,
      })
    );
  };

  // Add socket listeners
  // Handle message received from server
  console.log("[Content Script - Socket]Onmessage event registered");
  socket.onmessage = (event) => {
    const message_from_server = JSON.parse(event.data);
    let dim_from_server = null;
    console.log(
      "[Content Script - Socket]Message Received",
      message_from_server
    );

    // Sets params with the value received from the server
    if (message_from_server["type"] === "init-params") {
      dim_from_server = message_from_server.params["dim"];

      // Set the values
      if (dim_from_server === dim) {
        alphasArray = message_from_server.params["al"];
        betasArray = message_from_server.params["bt"];
        console.log(
          "[Content Script - Socket]Params received alphas and betas",
          alphasArray,
          betasArray
        );

        // Create the event -initevent
        let event = new CustomEvent("initevent");

        // Raise the event
        elem.dispatchEvent(event);
      } else {
        console.log("[Content Script - Socket]Dimension does not match. ");
      }
    } else if (message_from_server["type"] === "new_weights") {
      alphasArray = message_from_server.params["al"];
      betasArray = message_from_server.params["bt"];
      cycle = cycle + 1;

      // Raise an event -newweightsreceived
      // Create the event
      let event = new CustomEvent("newweightsreceived");

      // Raise the event
      elem.dispatchEvent(event);
    }
  };

  // Event listener for initevent
  elem.addEventListener("initevent", function (event) {
    console.log(
      "[Content Script - Socket]INIT - Received Alphas Betas",
      alphasArray,
      betasArray
    );

    // Select a sample
    selectSample();
  });

  // Event listener for newweightsreceived
  elem.addEventListener("newweightsreceived", function (event) {
    cycle += 1;
    console.log(
      "[Content Script - Socket]New Weights Received",
      alphasArray,
      betasArray
    );
    console.log("[Content Script - Socket]New Cycle", cycle);

    // Select a sample
    selectSample();

    // Change user display
    // setConfig(uiOptions[selectedOption]);

    if (allSelectedOptions[selectedOption] == "undefined") {
      allSelectedOptions[selectedOption] = 0;
    }

    allSelectedOptions[selectedOption] += 1;
    console.log(
      "[Content Script - Socket]All Selected Options",
      allSelectedOptions
    );

    // If simulation is true, simulate the user action
    if (simulation && cycle <= stopAfter) {
      console.log("[Content Script - Socket]Simulate");

      let new_reward = simulate(policy, selectedOption);
      console.log("[Content Script - Socket]New Reward", new_reward);

      let params = actionAndUpdate(
        alphasArray,
        betasArray,
        selectedOption,
        new_reward
      );
      console.log("[Content Script - Socket]Params", params);

      if (params) {
        let gradWeights = params[0];

        console.log(
          "[Content Script - Socket]Diff: alphas and betas",
          gradWeights[0].dataSync(),
          gradWeights[1].dataSync()
        );

        // Send data to the server
        console.log(
          "[Content Script - Socket]Sending new gradients to the server"
        );

        socket.send(
          JSON.stringify({
            event: "update", // 0 ->  event
            alphas: gradWeights[0].dataSync(), // 1 ->  alphas
            betas: gradWeights[1].dataSync(), // 2 -> betas
            client_id: clientId,
            model_name: "example_" + id,
          })
        );
      }
    }
  });
};

console.log("[Content Script - Socket]Socket Initialize");
socket = new WebSocket(url);
console.log("[Content Script - Socket]Client ID:", clientId);
// Initialize the listeners for socket events
// initialize(clientId);

// Listener for the messages sent from background script.
browser.runtime.onMessage.addListener((data, sender) => {
  console.log(
    "[Content Script - Socket]Message from the background script, sender",
    data,
    sender
  );
  // return Promise.resolve({ status: "success" });

  console.log("[Content Script - Socket]Initialize");
  console.log(socket);
});
