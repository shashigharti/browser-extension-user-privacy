import { actionAndUpdate, generatePolicies, clientPreferences } from './common'
import { META_DATA } from './data/'
import { track } from './useractivity'
const id = 6 // Example Id
const API_ENDPOINT = '127.0.0.1:8082'
const url = 'ws://' + API_ENDPOINT + '/fl-server/' + META_DATA[id].model_name

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
  gradWeights,
  new_reward,
  interval,
  endOfCycle = false

let client_preferences = clientPreferences(
  noOfClients,
  probIdx,
  META_DATA[id].change_prob_idxs,
  META_DATA[id].change_probs
)
let userActionPromiseResolve = undefined,
  userActionPromise = null
// User options : 24 types of options
const dim = META_DATA[id].dim,
  stopAfter = 100,
  policies = generatePolicies(noOfClients, dim, client_preferences)

function trackingCallback(collection, properties, callback) {
  if (collection === 'clicks') {
    if (endOfCycle) return

    let elem = document.getElementById('root')
    new_reward = parseInt(elem.getAttribute('data-reward'))
    endOfCycle = true
    handleUserAction()
  }
}

// Resolve after user action
const handleUserAction = () => {
  console.log('[Content Script ML]Action Resolved')
  userActionPromiseResolve(true)
}
// Inject Noise
const injectNoise = (user_privacy_preference_level) => {
  let random_number = Math.random()
  console.log(
    '[Content Script ML - Socket]Math.random:user_privacy_preference_level',
    random_number,
    ':',
    user_privacy_preference_level / 100
  )
  return random_number < user_privacy_preference_level / 100 ? 1 : 0
}

// Get reward and update weights
const setRewardAndUpdateWeights = async () => {
  let alphas,
    betas,
    clicked = false
  userActionPromise = new Promise((resolve) => {
    userActionPromiseResolve = resolve
  })
  if (cycle >= stopAfter) {
    clearInterval(interval)
    return
  }

  // Raise the useraction event to trigger user action in website
  let webelem = document.getElementById('root')
  let isWaiting = parseInt(webelem.getAttribute('data-waiting')) // Signals website is waiting for 'useraction' event.
  console.log(
    '[Content Script ML - Socket]Website is waiting for event',
    isWaiting,
    isWaiting === 1
  )

  if (!endOfCycle && isWaiting === 0) return

  // Read selected option from the website
  selectedOption = webelem.getAttribute('data-option')
  console.log('[Content Script ML - Socket]Selected Option in Website', selectedOption)
  webelem.dispatchEvent(new CustomEvent('useraction'))
  console.log("[Content Script ML - Socket]Trigger 'useraction' Event", cycle)

  console.log(
    '[Content Script ML - Socket]Waiting for user action..................................'
  )
  clicked = await userActionPromise

  if (clicked === true) {
    if (new_reward === 1) {
      console.log('[Content Script ML - Socket]Clicked', clicked)
    } else {
      console.log('[Content Script ML - Socket]Rejected')
    }
    console.log('[Content Script ML - Socket]New Reward selected', new_reward)

    // Calculate new gradients
    let params = actionAndUpdate(alphasArray, betasArray, selectedOption, new_reward)
    console.log('[Content Script ML - Socket]Grad Weights', params)
    gradWeights = params[0]
    alphas = gradWeights[0].dataSync()
    betas = gradWeights[1].dataSync()

    // Check if random is true and read the user preference level value to add noise
    if (random === true) {
      let addNoise = injectNoise(user_privacy_preference_level)
      console.log(
        '[Content Script ML - Socket]Bernoulli Sampling Result(Toss Result -> Add Noise):',
        addNoise
      )
      if (addNoise) {
        alphas = Object.assign({}, Array(alphasArray.length).fill(0))
        betas = Object.assign({}, Array(alphasArray.length).fill(0))
        console.log('[Content Script ML - Socket]alphas;betas:', alphas, betas)
      }
    }
    console.log('[Content Script ML - Socket]Diff: alphas and betas', alphas, betas)
    // Send data to the server
    console.log('[Content Script ML - Socket]Sending New Gradients to the Server')
    endOfCycle = false
    socket.send(
      JSON.stringify({
        event: 'update', // 0 ->  event
        alphas: alphas, // 1 ->  alphas
        betas: betas, // 2 -> betas
        client_id: clientId,
        model_name: 'example_' + id,
      })
    )
  }
}

// Initializes socket events
const initialize = (clientId) => {
  console.log('[Content Script ML - Socket]Onopen event registered')
  // Connect to the server & Get params from server
  socket.onopen = (message) => {
    console.log('[Content Script ML - Socket]Connecton established')
    console.log('[Content Script ML - Socket]Message Received', message)
    socket.send(
      JSON.stringify({
        event: 'connected',
        client_id: clientId,
        model_name: 'example_' + id,
      })
    )
  }

  console.log('[Content Script ML - Socket]Onmessage event registered')
  // Events to receive message from server
  socket.onmessage = (event) => {
    const message_from_server = JSON.parse(event.data)
    // console.log("[Content Script ML - Socket]Message Received", message_from_server);

    if (cycle > stopAfter) return

    let dim_from_server = null
    console.log('[Content Script ML - Socket]Message Received', message_from_server)
    console.log('[Content Script ML - Socket]Type', message_from_server['type'])
    // Sets params with the value received from the server
    if (message_from_server['type'] === 'init-params') {
      dim_from_server = message_from_server.params['dim']
      // Set the values
      if (dim_from_server !== dim) {
        console.log('[Content Script ML - Socket]Dimension Doesnot Match. ')
        return
      }
      alphasArray = message_from_server.params['al']
      betasArray = message_from_server.params['bt']
      console.log(
        '[Content Script ML - Socket]Params Received Alphas and Betas',
        alphasArray,
        betasArray
      )
      // setRewardAndUpdateWeights();
    } else if (message_from_server['type'] === 'new_weights') {
      alphasArray = message_from_server.params['al']
      betasArray = message_from_server.params['bt']
      userActionPromiseResolve = undefined
      // Sync with website: Update the id of the root element of the website to
      // trigger start of new cycle.
      cycle = cycle + 1
      let webelem = document.getElementById('root')
      webelem.setAttribute('data-cycle', cycle) // Update cycle to website
      webelem.dispatchEvent(new CustomEvent('newcycle', { detail: { cycle: cycle } }))
      console.log('[Content Script ML - Socket]Trigger Newcycle Event, Cycle =>', cycle)
      // setRewardAndUpdateWeights();
    }
  }
  // Set timer to run reward and update
  interval = setInterval(setRewardAndUpdateWeights, 1000)
}

// Initialization
socket = new WebSocket(url)
clientId = 0 //Math.floor(Math.random() * noOfClients);
policy = policies[clientId]

// Display Params
console.log('[Content Script ML]Example ID', id)
console.log('[Content Script ML]Client ID:', clientId)
console.log('[Content Script ML]noOfClients', noOfClients)
console.log('[Content Script ML]API_ENDPOINT', API_ENDPOINT)
console.log('[Content Script ML]URL', url)
console.log('[Content Script ML]Simulate', simulation)
console.log('[Content Script ML]Cycle', cycle)
console.log('[Content Script ML]stopAfter', stopAfter)
console.log('[Content Script ML - Socket]Selected Policy:', policy)

// Initialize the listeners for socket events
initialize(clientId)
track(trackingCallback)

// Listener for the messages sent from background script.
browser.runtime.onMessage.addListener((data, sender) => {
  console.log(
    '[Content Script ML - Socket]Message from the background script, sender',
    data,
    sender
  )
  console.log(
    '[Content Script ML - Socket]data - mtype:value',
    data['_mtype'],
    ':',
    data['_message']
  )
  user_privacy_preference_level = data['_message']

  return Promise.resolve({
    status: 'success',
  })
})
