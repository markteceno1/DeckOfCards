import { sleep } from 'k6';
import { Options } from 'k6/options';
import { createShuffleDeck, createPartialDeck, shuffleDeck, drawCards, openNewDeck } from '../apis/deckAPI';
import { addToPile, shufflePile, listPile, drawFromPile, } from '../apis/pileApi';
import { returnCardsToDeck, returnAllCardsToDeck, returnFromPileToDeck, returnFromPileToPile, } from '../apis/returnApi';
import { SCENARIO_PRESETS, ScenarioPresetName } from './testScenarios';
import { ENV } from '../config/env';

// choose which preset to run
const scenarioName = (__ENV.TEST_TYPE as ScenarioPresetName) || 'smoke';

const selected = SCENARIO_PRESETS.find((s) => s.name === scenarioName);
if (!selected) {
  throw new Error(`Unknown TEST_TYPE '${__ENV.TEST_TYPE}'. Valid: ${SCENARIO_PRESETS.map(s => s.name).join(', ')}`);
}

export const options: Options = selected.options;

export function deckScenario() {
  const deckId = createShuffleDeck(1);
  
  shuffleDeck(deckId, false);

  drawCards(deckId, 5);

  createPartialDeck(['AS', 'KS', 'QS', 'JS', '10S']);

  openNewDeck(false);

  sleep(1);
}

export function pileScenario() {
  const deckId = createShuffleDeck(1);

  const draw = drawCards(deckId, 6);
  const cardCodes = draw.cards.map((c) => c.code);

  addToPile(deckId, 'pileA', cardCodes);

  shufflePile(deckId, 'pileA');

  listPile(deckId, 'pileA');

  drawFromPile(deckId, 'pileA', 3);

  sleep(1);
}

export function returnScenario() {
  const deckId = createShuffleDeck(1);

  const draw = drawCards(deckId, 6);
  const cardCodes = draw.cards.map((c) => c.code);

  addToPile(deckId, 'pileA', cardCodes);
  addToPile(deckId, 'pileB', []);

  const pileDraw = drawFromPile(deckId, 'pileA', 3);
  const pileCardCodes = pileDraw.cards.map((c) => c.code);

  returnFromPileToPile(deckId, 'pileA', 'pileB', pileCardCodes);

  returnFromPileToDeck(deckId, 'pileB', pileCardCodes);

  returnCardsToDeck(deckId, cardCodes);

  returnAllCardsToDeck(deckId);

  sleep(1);
}
