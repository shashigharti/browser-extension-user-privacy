import {
    actionAndUpdate,
    generatePolicies,
    clientPreferences,
} from "./common";
import {
    META_DATA
} from "./data/";
import {
    track
} from "./useractivity";
const id = 6; // Example Id
const API_ENDPOINT = "127.0.0.1:8082";
const url = "ws://" + API_ENDPOINT + "/fl-server/" + META_DATA[id].model_name;

// Features/parameters that determine the users action
let alphasArray = [],
    betasArray = [],
    policy = [],
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
let userActionPromiseResolve = undefined,
    userActionPromise = null;
// User options : 24 types of options
const dim = META_DATA[id].dim,
    stopAfter = 100,
    policies = generatePolicies(noOfClients, dim, client_preferences);

function trackingCallback(collection, properties, callback) {    
    console.log("[Content Script ML - Socket]Start Event Tracking");
    if (collection === "clicks") {
        // console.log("[Content Script Tracking - Callback]collection, properties, callback", collection, properties, callback);
        let elem = document.getElementsByClassName(properties.element.class),
        classes = properties.element.class.split(" ");

        if (properties.element.class === 'rejectbtn'){   
            console.log("elem", elem);
            new_reward = 0;            
            handleUserAction()
        }
        else if(classes[0]=== 'acceptbtn'){
            console.log("elem", elem)
            new_reward = 1;
            handleUserAction()
        }
    }
}

// Resolve after user action
const handleUserAction = () => {
    console.log("[Content Script ML]Action Resolved");
    userActionPromiseResolve(true);
};
// Inject Noise
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

// Get reward and update weights
const setRewardAndUpdateWeights = async () => {
    let alphas, betas;
    userActionPromise = new Promise((resolve) => {
        userActionPromiseResolve = resolve;
      }); // Promise


    if (cycle >= stopAfter) return;

    
    // Update the id of the root element of the website to sync the cycle of 
    // webextension and website
    cycle = cycle + 1;  
    let webelem = document.getElementById("root");
    webelem.setAttribute("data-value", cycle); // Sync with website   
    webelem.dispatchEvent(new CustomEvent('useraction', {'detail': {'cycle': cycle}}));
    console.log("[Content Script ML - Socket]Update cycle: {} and trigger useraction event", cycle);      

    // Wait for user action
    console.log("[Content Script ML - Socket]Waiting for user action..................................");
    console.log("[Content Script ML]Cycle", cycle);  
    const clicked = await userActionPromise;     
    if (clicked === true)   {
        if (new_reward === 1){
            console.log("[Content Script ML - Socket]Clicked", clicked);
            console.log("[Content Script ML - Socket]New Reward selected", new_reward);
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

// Initializes socket events
const initialize = (clientId) => {
    console.log("[Content Script ML - Socket]Onopen event registered");
    // Connect to the server & Get params from server
    socket.onopen = (message) => {
        console.log("[Content Script ML - Socket]Connecton established");
        console.log("[Content Script ML - Socket]Message Received", message);
        socket.send(
            JSON.stringify({
                event: "connected",
                client_id: clientId,
                model_name: "example_" + id,
            })
        );
    };

    
    console.log("[Content Script ML - Socket]Onmessage event registered");
    // Events to receive message from server
    socket.onmessage = (event) => {
        const message_from_server = JSON.parse(event.data);
        // console.log("[Content Script ML - Socket]Message Received", message_from_server);        

        if (cycle > stopAfter) return;
        
        let dim_from_server = null;
        console.log(
            "[Content Script ML - Socket]Message Received",
            message_from_server
        );
        console.log(
            "[Content Script ML - Socket]Type",
            message_from_server["type"] 
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
            setRewardAndUpdateWeights();
        } else if (message_from_server["type"] === "new_weights") {
            alphasArray = message_from_server.params["al"];
            betasArray = message_from_server.params["bt"];
            userActionPromiseResolve = undefined;
            let webelem = document.getElementById("root");
            webelem.dispatchEvent(new CustomEvent('newcycle'));
            console.log("[Content Script ML - Socket]Trigger newcycle event", cycle);    
            setRewardAndUpdateWeights();
        }           
    };
};

// Initialization
socket = new WebSocket(url);
clientId = 0;//Math.floor(Math.random() * noOfClients);
policy = policies[clientId];

// Display Params
console.log("[Content Script ML]Example ID", id);
console.log("[Content Script ML]Client ID:", clientId);
console.log("[Content Script ML]noOfClients", noOfClients);
console.log("[Content Script ML]API_ENDPOINT", API_ENDPOINT);
console.log("[Content Script ML]URL", url);
console.log("[Content Script ML]Simulate", simulation);
console.log("[Content Script ML]Cycle", cycle);
console.log("[Content Script ML]stopAfter", stopAfter);
console.log("[Content Script ML - Socket]Selected Policy:", policy);


// Initialize the listeners for socket events
initialize(clientId);
track(trackingCallback);

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