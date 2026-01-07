import { Options } from 'k6/options';

export type ScenarioPresetName = 'smoke' | 'load' | 'endurance';

export interface ScenarioPreset {
  name: ScenarioPresetName;
  options: Options;
}

/**
 * Threshold keys must exactly match your static group() names.
 */
const thresholds: NonNullable<Options['thresholds']> = {
  http_req_failed: ['rate<0.01'],

  // Deck API
  'group_duration{group:::Create & Shuffle Deck}': ['p(90)<500'],
  'group_duration{group:::Shuffle Deck}': ['p(90)<500'],
  'group_duration{group:::Draw Cards}': ['p(90)<500'],
  'group_duration{group:::Create Partial Deck}': ['p(90)<500'],
  'group_duration{group:::Open New Deck}': ['p(90)<500'],

  // Pile API
  'group_duration{group:::Add to pile}': ['p(90)<500'],
  'group_duration{group:::Shuffle pile}': ['p(90)<500'],
  'group_duration{group:::List pile}': ['p(90)<500'],
  'group_duration{group:::Draw from pile}': ['p(90)<500'],

  // Return API
  'group_duration{group:::Move cards from pile to pile}': ['p(90)<500'],
  'group_duration{group:::Return cards from pile to deck}': ['p(90)<500'],
  'group_duration{group:::Return specific cards to deck}': ['p(90)<500'],
  'group_duration{group:::Return all cards to deck}': ['p(90)<500'],
};

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    name: 'smoke', // quick test to verify basic functionality
    options: {
      insecureSkipTLSVerify: true,
      tags: {
        testid: 'DeckOfCards_SmokeTest',
      },
      scenarios: {
        deck_api: { executor: 'per-vu-iterations', vus: 1, iterations: 5,  exec: 'deckScenario' },
        pile_api: { executor: 'per-vu-iterations', vus: 1, iterations: 5, exec: 'pileScenario' },
        return_api: { executor: 'per-vu-iterations', vus: 1, iterations: 5, exec: 'returnScenario' },
      },
      thresholds,
    },
  },
  {
    name: 'load', // simulate load test
    options: {
      insecureSkipTLSVerify: true,
      tags: {
        testid: 'DeckOfCards_LoadTest',
      },
      scenarios: {
        deck_api: { executor: 'ramping-arrival-rate', startRate: 0, timeUnit: '60m', preAllocatedVUs: 5, maxVUs: 10,exec: 'deckScenario', stages: [ 
            { duration: '10m', target: 1000 }, 
            { duration: '60m', target: 1000 }, 
            { duration: '10m', target: 0 } ] },
        pile_api: { executor: 'ramping-arrival-rate', startRate: 0, timeUnit: '60m', preAllocatedVUs: 5, maxVUs: 10,exec: 'pileScenario', stages: [ 
            { duration: '10m', target: 1000 }, 
            { duration: '60m', target: 1000 }, 
            { duration: '10m', target: 0 } ]  },
        return_api: { executor: 'ramping-arrival-rate', startRate: 0, timeUnit: '60m', preAllocatedVUs: 5, maxVUs: 10,exec: 'returnScenario', stages: [ 
            { duration: '10m', target: 1000 }, 
            { duration: '60m', target: 1000 }, 
            { duration: '10m', target: 0 } ]  },
      },
      thresholds,
    },
  },
  {
    name: 'endurance',  // Long duration test to check for memory leaks or performance degradation
    options: {
      insecureSkipTLSVerify: true,
      tags: {
        testid: 'DeckOfCards_EnduranceTest',
      },
      scenarios: {
        deck_api: { executor: 'ramping-arrival-rate', startRate: 0, timeUnit: '60m', preAllocatedVUs: 5, maxVUs: 10,exec: 'deckScenario', stages: [ 
            { duration: '10m', target: 800 }, 
            { duration: '480m', target: 800 }, 
            { duration: '10m', target: 0 } ] },
        pile_api: { executor: 'ramping-arrival-rate', startRate: 0, timeUnit: '60m', preAllocatedVUs: 5, maxVUs: 10,exec: 'pileScenario', stages: [ 
            { duration: '10m', target: 800 }, 
            { duration: '480m', target: 800 }, 
            { duration: '10m', target: 0 } ]  },
        return_api: { executor: 'ramping-arrival-rate', startRate: 0, timeUnit: '60m', preAllocatedVUs: 5, maxVUs: 10,exec: 'returnScenario', stages: [ 
            { duration: '10m', target: 800 }, 
            { duration: '480m', target: 800 }, 
            { duration: '10m', target: 0 } ]  },
      },
      thresholds,
    },
  },
];
