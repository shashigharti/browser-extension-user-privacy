import {
  argMax,
  simulate,
  actionAndUpdate,
  generatePolicies,
  clientPreferences,
} from "./common";
import {
  META_DATA
} from "../data";

export function getMLScript() {
    console.log(argMax);
  return "(" + function() {
     console.log("Inside ML Script first");
      const {
          jStat, default: jstat
      } = require("jstat");
      const id = 2;
      const API_ENDPOINT = "127.0.0.1:8082";
      const url = "ws://" + API_ENDPOINT + "/fl-server/" + META_DATA[id].model_name;
      
      console.log("Inside ML Script second");
      // Features/parameters that determine the users action
      let alphasArray = [],
          betasArray = [],
          policy = [],
          betaDistribution = [],
          clientId = null,
          selectedOption = 0,
          cycle = 0,
          socket = null,
          simulation = false,
          user_privacy_preference_level = 0,
          random = true,
          noOfClients = META_DATA[id].no_of_clients,
          probIdx = 0; // It increases by 1 unit if the policy change is set to true

      let client_preferences = clientPreferences(
          noOfClients,
          probIdx,
          META_DATA[id].change_prob_idxs,
          META_DATA[id].change_probs
      );

      // User options : 24 types of options
      const dim = META_DATA[id].dim,
          stopAfter = 100,
          policies = generatePolicies(noOfClients, dim, client_preferences),
          elem = document.getElementsByTagName("BODY")[0];

      let userActionPromiseResolve = null,
          userActionPromise = null; // stores the reference to resolve function for user action

      // When the user clicks the button...
      const submitPositiveResult = (e) => {
          console.log("[Content Script - Socket]User clicked");
          userActionPromiseResolve(true);
      };

      // When the user doesn't click the button...
      const submitNegativeResult = (e) => {
          console.log("[Socket]User didnot Click");
          userActionPromiseResolve(false);
      };

      window.addEventListener("beforeunload", submitNegativeResult);
      document.addEventListener("keyup", (e) => {
          if (e.code === "KeyX") submitNegativeResult();
      });

      const injectNoise = (user_privacy_preference_level) => {
          let random_number = Math.random();
          console.log(
              "[Content Script - Socket]Math.random:user_privacy_preference_level",
              random_number,
              ":",
              user_privacy_preference_level / 100
          );
          return random_number < user_privacy_preference_level / 100 ? 1 : 0;
      };

      console.log("[Content Script - Socket]Click event listener");
      const btn = document.querySelector("BUTTON");
      btn.addEventListener("click", submitPositiveResult);



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
          console.log("[Content Script - Socket]Beta distribution", betaDistribution);
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
      const rewardAndUpdateWeights = async () => {
          // If simulation is true, simulate the user action
          if (cycle <= stopAfter) {
              let gradWeights, new_reward, alphas, betas;
              if (simulation) {
                  console.log("[Content Script - Socket]Simulate");
                  new_reward = simulate(policy, selectedOption);
              } else {
                  console.log("[Content Script - Socket]Wait for user action");

                  // When the user clicks the button...
                  // Wait on user input...
                  const clicked = await userActionPromise;
                  console.log("[Content Script - Socket]Clicked", clicked);

                  // If they clicked, set the reward value for this option to be a 1, otherwise it's a 0
                  new_reward = clicked ? 1 : 0;
                  console.log("[Content Script - Socket]New Reward", new_reward);
              }

              // Calculate new gradients
              let params = actionAndUpdate(
                  alphasArray,
                  betasArray,
                  selectedOption,
                  new_reward
              );
              gradWeights = params[0];
              alphas = gradWeights[0].dataSync();
              betas = gradWeights[1].dataSync();

              // Check if random is true and read the user preference level value to add noise
              if (random === true) {
                  let addNoise = injectNoise(user_privacy_preference_level);
                  console.log(
                      "[Content Script - Socket]Bernoulli Sampling Result(Toss Result -> Add Noise):",
                      addNoise
                  );
                  if (addNoise) {
                      alphas = Object.assign({}, Array(alphasArray.length).fill(0));
                      betas = Object.assign({}, Array(alphasArray.length).fill(0));
                      console.log("[Content Script - Socket]alphas;betas:", alphas, betas);
                  }
              }
              console.log(
                  "[Content Script - Socket]Diff: alphas and betas",
                  alphas,
                  betas
              );
              // Send data to the server
              console.log("[Content Script - Socket]Sending new gradients to the server");
              socket.send(
                  JSON.stringify({
                      event: "update", // 0 ->  event
                      alphas: alphas, // 1 ->  alphas
                      betas: betas, // 2 -> betas
                      client_id: clientId,
                      model_name: "example_" + id,
                  })
              );
          }
      };

      /**
       * Initialize and start the training process
       */
      const initialize = (clientId) => {
          console.log("[Content Script - Socket]Onopen event registered");
          // Connect to the server & Get params from server
          socket.onopen = (message) => {
              console.log("[Content Script - Socket]Connecton established");
              console.log("[Content Script - Socket]Received Message", message);
              socket.send(
                  JSON.stringify({
                      event: "connected",
                      client_id: clientId,
                      model_name: "example_" + id,
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
          elem.addEventListener("initevent", function(event) {
              console.log(
                  "[Content Script - Socket]INIT - Received Alphas Betas",
                  alphasArray,
                  betasArray
              );

              // Select a sample
              selectSample();
          });

          // Event listener for newweightsreceived
          elem.addEventListener("newweightsreceived", function(event) {
              cycle += 1;
              console.log(
                  "[Content Script - Socket]New Weights Received",
                  alphasArray,
                  betasArray
              );
              console.log(
                  "===========================================================[Content Script - Socket]New Cycle",
                  cycle,
                  "========================================================================="
              );
              userActionPromise = new Promise((resolve) => {
                  userActionPromiseResolve = resolve;
              });

              // Select a sample
              selectSample();

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
      console.log(
          "================================[Content Script - Socket]Socket initialize===================================="
      );
      // ML - Initialize the listeners for socket events
      socket = new WebSocket(url);
      clientId = Math.floor(Math.random() * noOfClients);
      policy = policies[clientId];
      console.log("[Content Script - Socket]Selected Policy:", policy);
      console.log("[Content Script - Socket]Client ID:", clientId);
      initialize(clientId);

      // // Listener for the messages sent from background script.
      // browser.runtime.onMessage.addListener((data, sender) => {
      //   console.log(
      //     "[Content Script - Socket]Message from the background script, sender",
      //     data,
      //     sender
      //   );
      //   console.log(
      //     "[Content Script - Socket]data - mtype:value",
      //     data["_mtype"],
      //     ":",
      //     data["_message"]
      //   );
      //   user_privacy_preference_level = data["_message"];

      //   return Promise.resolve({ status: "success" });
      // });
  } + "());";
}