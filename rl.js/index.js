import {
    argMax,
    simulate,
    actionAndUpdate,
    generatePolicies,
    clientPreferences,
} from "./common";
import {
    META_DATA
} from "./data/";
import {
    track
} from "./useractivity"

const {
    jStat
} = require("jstat");
const id = 7;
const API_ENDPOINT = "127.0.0.1:8082";
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
    simulation = false,
    user_privacy_preference_level = 0,
    random = true,
    noOfClients = META_DATA[id].no_of_clients,
    probIdx = 0, // It increases by 1 unit if the policy change is set to true
    gradWeights, new_reward;

let client_preferences = clientPreferences(
    noOfClients,
    probIdx,
    META_DATA[id].change_prob_idxs,
    META_DATA[id].change_probs
);
let userActionPromiseResolve = null,
    userActionPromise = null; // stores the reference to resolve function for user action

// User options : 24 types of options
const dim = META_DATA[id].dim,
    stopAfter = 100,
    policies = generatePolicies(noOfClients, dim, client_preferences),
    elem = document.getElementsByTagName("BODY")[0];

console.log("[Content Script ML]ID", id);
console.log("[Content Script ML]API_ENDPOINT", API_ENDPOINT);
console.log("[Content Script ML]URL", url);
console.log("[Content Script ML]Simulate", simulation);
console.log("[Content Script ML]stopAfter", stopAfter);

// When the user acts....
const handleUserAction = () => {
    console.log("[Content Script ML - Socket]User Action Completed");
    userActionPromiseResolve(true);
};

const injectNoise = (user_privacy_preference_level) => {
    let random_number = Math.random();
    console.log(
        "[Content Script ML - Socket]Math.random:user_privacy_preference_level",
        random_number,
        ":",
        user_privacy_preference_level / 100
    );
    return random_number < user_privacy_preference_level / 100 ? 1 : 0;
};

console.log("[Content Script ML - Socket]Start Event Tracking");
function trackingCallback(collection, properties, callback) {
    console.log("[Content Script Tracking - Callback]collection, properties, callback", collection, properties, callback);
    if (collection === "clicks") {
        let elem = document.getElementsByClassName(properties.element.class);
        console.log("elem", elem);
        console.log("class", properties.element.class)
        if (properties.element.class === 'rejectbtn'){            
            console.log("[Content Script Tracking - Callback]Reject button was clicked!");           
        }
    }
}
track(trackingCallback);

// Initialize
socket = new WebSocket(url);
clientId = Math.floor(Math.random() * noOfClients);
policy = policies[clientId];
console.log("[Content Script ML - Socket]Selected Policy:", policy);

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
    console.log("[Content Script ML - Socket]Beta distribution", betaDistribution);
    console.log("[Content Script ML - Socket]Policy", policy);

    if (betaDistribution.length > 0) {
        // Random selection of option from available ones
        selectedOption = argMax(betaDistribution);
        console.log(
            "[Content Script ML - Socket]New option selected:",
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
        let alphas, betas;

        // Wait for user action
        const clicked = await userActionPromise;
        console.log("[Content Script ML - Socket]Clicked", clicked);

        //     // If they clicked, set the reward value for this option to be a 1, otherwise it's a 0
        //     new_reward = clicked ? 1 : 0;
        //     console.log("[Content Script ML - Socket]New Reward selected", new_reward);
        // }

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
                "[Content Script ML - Socket]Bernoulli Sampling Result(Toss Result -> Add Noise):",
                addNoise
            );
            if (addNoise) {
                alphas = Object.assign({}, Array(alphasArray.length).fill(0));
                betas = Object.assign({}, Array(alphasArray.length).fill(0));
                console.log("[Content Script ML - Socket]alphas;betas:", alphas, betas);
            }
        }
        console.log(
            "[Content Script ML - Socket]Diff: alphas and betas",
            alphas,
            betas
        );
        // Send data to the server
        console.log("[Content Script ML - Socket]Sending new gradients to the server");
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
    console.log("[Content Script ML - Socket]Onopen event registered");
    // Connect to the server & Get params from server
    socket.onopen = (message) => {
        console.log("[Content Script ML - Socket]Connecton established");
        console.log("[Content Script ML - Socket]Received Message", message);
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
    console.log("[Content Script ML - Socket]Onmessage event registered");
    socket.onmessage = (event) => {
        if (cycle > stopAfter) return;

        const message_from_server = JSON.parse(event.data);
        let dim_from_server = null;
        console.log(
            "[Content Script ML - Socket]Message Received",
            message_from_server
        );
        // Sets params with the value received from the server
        if (message_from_server["type"] === "init-params") {
            dim_from_server = message_from_server.params["dim"];
            // Set the values
            if (dim_from_server !== dim) {
                console.log("[Content Script ML - Socket]Dimension does not match. ");
                return;
            }
            alphasArray = message_from_server.params["al"];
            betasArray = message_from_server.params["bt"];
            console.log(
                "[Content Script ML - Socket]Params received alphas and betas",
                alphasArray,
                betasArray
            );
            elem.dispatchEvent(new CustomEvent("initevent"));
        } else if (message_from_server["type"] === "new_weights") {
            alphasArray = message_from_server.params["al"];
            betasArray = message_from_server.params["bt"];
            cycle = cycle + 1;            
            // Raise an event -newweightsreceived
            elem.dispatchEvent(new CustomEvent("newweightsreceived"));
        }
    };

    // Event listener for initevent
    elem.addEventListener("initevent", function(event) {
        console.log(
            "[Content Script ML - Socket]INIT - Received Alphas Betas",
            alphasArray,
            betasArray
        );

        // Select a sample
        selectSample();
    });

    // Event listener for newweightsreceived
    elem.addEventListener("newweightsreceived", function(event) {        
        if (cycle > stopAfter) return;
        console.log(
            "[Content Script ML - Socket]New Weights Received",
            alphasArray,
            betasArray
        );
        console.log(
            "[Content Script ML - Socket]New Cycle", cycle,
        );    
        console.log("[Content Script ML - Socket]New reward selected", new_reward);
        // Select a sample
        selectSample();
        let params = actionAndUpdate(
            alphasArray,
            betasArray,
            selectedOption,
            new_reward
        );
        console.log("[Content Script ML - Socket]Params", params);
        if (params) {
            gradWeights = params[0];
            console.log(
                "[Content Script ML - Socket]Diff: alphas and betas",
                gradWeights[0].dataSync(),
                gradWeights[1].dataSync()
            );
            // Send data to the server
            console.log(
                "[Content Script ML - Socket]Sending new gradients to the server"
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
    });
};

console.log(
    "================================[Content Script ML - Socket]Socket initialize===================================="
);
socket = new WebSocket(url);
console.log("[Content Script ML - Socket]Client ID:", clientId);

// Initialize the listeners for socket events
initialize(clientId);

// Listener for the messages sent from background script.
browser.runtime.onMessage.addListener((data, sender) => {
    console.log(
        "[Content Script ML - Socket]Message from the background script, sender",
        data,
        sender
    );
    console.log(
        "[Content Script ML - Socket]data - mtype:value",
        data["_mtype"],
        ":",
        data["_message"]
    );
    user_privacy_preference_level = data["_message"];

    return Promise.resolve({
        status: "success"
    });
});