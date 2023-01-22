import * as tf from "@tensorflow/tfjs";

const binomial_sample = (accept_rate) => (Math.random() < accept_rate ? 1 : 0);
class Simulator {
  constructor(rates) {
    this.rates = rates;
    this.action_space = Array(rates.length);
  }
  simulate(idx) {
    console.log("[Content Script ML - Socket]Rates", this.rates);
    console.log("[Content Script ML - Socket]Rate", this.rates[idx]);
    let choice = binomial_sample(this.rates[idx]);
    return choice;
  }
}

/**
 * Get maximum value
 */
const argMax = (d) =>
  Object.entries(d).filter(
    (el) => el[1] === Math.max(...Object.values(d))
  )[0][0];

/**
 * Update alphas and betas - Thompson Sampling
 * @param {Tensor1D} rewards
 * @param {Tensor1D} samples
 * @param {Tensor1D} alphas
 * @param {Tensor1D} betas
 * @returns {Array}
 */
const banditThompson = (rewards, samples, alphas, betas) => {
  console.log("[Content Script ML - Socket]banditThompson");
  const prev_alpha = alphas;
  const prev_beta = betas;

  alphas = prev_alpha.add(rewards);
  betas = prev_beta.add(samples.sub(rewards));
  return [alphas, betas];
};

/**
 * Calculate gradients
 * @param {Tensor1D} alphas
 * @param {Tensor1D} betas
 * @param {Tensor1D} n_alphas
 * @param {Tensor1D} n_betas
 * @returns {Array}
 */
const calcGradient = (alphas, betas, n_alphas, n_betas) => {
  let d_alphas, d_betas;
  d_alphas = n_alphas.sub(alphas);
  d_betas = n_betas.sub(betas);
  return [d_alphas, d_betas];
};

/**
 * Simulate user action
 * @param {Array} preferences
 * @param {number} option_id
 * @returns {number}
 */
const simulate = (simulated_rates, selectedOption) => {
  const env = new Simulator(simulated_rates);
  return env.simulate(selectedOption);
};

const actionAndUpdate = (alphasArray, betasArray, selectedOption, reward) => {
  let alphas_betas;
  let rewardVector = Array(alphasArray.length).fill(0);
  let sampledVector = Array(alphasArray.length).fill(0);
  console.log(
    "[Content Script ML - Socket]Update Selected Option",
    selectedOption
  );
  console.log(
    "[Content Script ML - Socket]Reward",
    reward
  );
  console.log(
    "[Content Script ML - Socket]Alphas, Betas",
    alphasArray,
    betasArray
  );

  console.log(
    "[Content Script ML - Socket]alphasArray.length == 0 ||   betasArray.length == 0 ||   betasArray.length != alphasArray.length",
    alphasArray.length === 0 ||
      betasArray.length === 0 ||
      betasArray.length !== alphasArray.length
  );
  if (
    alphasArray.length === 0 ||
    betasArray.length === 0 ||
    betasArray.length !== alphasArray.length
  )
    return false;

  rewardVector[selectedOption] = reward; // reward
  sampledVector[selectedOption] = 1;
  console.log(
    "[Content Script ML - Socket]Reward Vector, Sampled Vector",
    rewardVector,
    sampledVector
  );
  console.log(
    "[Content Script ML - Socket]tf.tensor(rewardVector)",
    tf.tensor(rewardVector)
  );

  alphas_betas = banditThompson(
    tf.tensor(rewardVector),
    tf.tensor(sampledVector),
    tf.tensor(alphasArray),
    tf.tensor(betasArray)
  );
  console.log("[Content Script ML - Socket]alphas_betas", alphas_betas);
  let gradWeights = calcGradient(
    tf.tensor(alphasArray),
    tf.tensor(betasArray),
    alphas_betas[0],
    alphas_betas[1]
  );

  console.log("[Content Script ML - Socket]gradWeights", gradWeights);
  return [gradWeights, alphas_betas];
};

/**
 * Generate probabilities of size given by dimension. The probabilities sums up to 1
 * @param {number} dim
 * @returns {Array}
 */
const generateProbabilities = (dim, preference) => {
  let probabilities = [];
  console.log("[Content Script ML - Socket]Preference", preference);

  let prob_for_remaining = (1 - preference[0]) / dim;
  for (let i = 0; i < dim; i++) {
    if (i === preference[1]) {
      probabilities.push(preference[0]);
    } else {
      probabilities.push(prob_for_remaining);
    }
  }
  return probabilities;
};

/**
 * Generate policies dynamically for given number of clients.
 * @param {number} no_of_clients
 * @returns {Array}
 */
const generatePolicies = (no_of_clients, dim = 24, client_preferences) => {
  let policies = [];
  for (let i = 0; i < no_of_clients; i++) {
    let policy = generateProbabilities(dim, client_preferences[i]);
    policies.push(policy);
  }
  return policies;
};

/**
 * Generate client preferences
 * @param {number} no_of_clients
 * @returns
 */
 let clientPreferences = (
  no_of_clients,
  index,
  change_prob_idxs,
  change_probs
) => {
  return Array(no_of_clients)
    .fill()
    .map(
      function (x, i) {
        return [this.probs[i][this.idx], this.probIdxs[i][this.idx]];
      },
      {
        probIdxs: change_prob_idxs,
        probs: change_probs,
        idx: index,
      }
    );
};

export {
  clientPreferences,
  generatePolicies,
  generateProbabilities,
  argMax,
  banditThompson,
  calcGradient,
  simulate,
  actionAndUpdate,
};
