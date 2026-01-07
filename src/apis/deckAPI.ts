import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { parseJson } from '../utils/parseJson';
import { Deck, DrawCards } from '../types/deck';
import { ENV } from '../config/env';

export const options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = `${ENV.BASE_URL}${ENV.API_PREFIX}`;

export default function (): void {

}

/**
 * creates and shuffles a number of decks.
 * @param deckCount Number of decks to shuffle
 * @returns deckId
 */
 export function createShuffleDeck(deckCount: number): string {
  let deckId = '';
  const groupName = 'Create & Shuffle Deck';

  group(groupName, () => {
    const res = http.get(`${BASE_URL}/new/shuffle/?deck_count=${deckCount}`);

    check(res, {
      [`${groupName} | status is 200`]: (r) => r.status === 200,
    });

    const newDeck = parseJson<Deck>(res, groupName);

    check(newDeck, {
      [`${groupName} | deck created successfully`]: (d) => d.success === true,
      [`${groupName} | deck_id exists`]: (d) => !!d.deck_id,
    });

    deckId = newDeck.deck_id;
  });

  return deckId;
}

/**
 * Draws a specified number of cards from a deck.
 * @param deckId The deck_id to draw from. 'new' can be used to create new deck
 * @param count Number of cards to draw
 * @returns DrawCards containing the drawn cards
 */
export function drawCards(deckId: string, count: number): DrawCards {
  let result!: DrawCards;
  const groupName = 'Draw Cards';

  group(groupName, () => {
    const res = http.get(`${BASE_URL}/${deckId}/draw/?count=${count}`);

    check(res, {
      [`${groupName} | status is 200`]: (r) => r.status === 200,
    });

    result = parseJson<DrawCards>(res, groupName);

    check(result, {
      [`${groupName} | ${count} cards returned`]: (r) => r.cards.length === count,
    });
  });

  return result;
}

/**
 * Shuffles the given deck.
 * @param deckId The deck_id to shuffle
 * @param remaining set to true if you want to shuffle remaining cards only
 * @returns Deck containing the shuffled deck info
 */
export function shuffleDeck(deckId: string, remaining: boolean): Deck {
  let result!: Deck;
  const groupName = 'Shuffle Deck';

  group(groupName, () => {
    const res = http.get(`${BASE_URL}/${deckId}/shuffle/?remaining=${remaining}`);

    check(res, {
      [`${groupName} | status is 200`]: (r) => r.status === 200,
    });

    result = parseJson<Deck>(res, groupName);

    check(result, {
      [`${groupName} | success is true`]: () => result.success === true,
      [`${groupName} | deck_id exists`]: () => Boolean(result.deck_id),
      [`${groupName} | deck shuffled`]: () => result.shuffled === true,
    });
  });

  return result;
}

/**
 * opens brand new deck of cards
 * @param JokersEnabled include jokers in the deck when set to true
 * @returns deckId
 */
export function openNewDeck(JokersEnabled: boolean): string {
  let deckId = '';
  const groupName = 'Open New Deck';

  group(groupName, () => {
    const res = http.get(`${BASE_URL}/new/?jokers_enabled=${JokersEnabled}`);

    check(res, {
      [`${groupName} | status is 200`]: (r) => r.status === 200,
    });

    const newDeck = parseJson<Deck>(res, groupName);

    check(newDeck, {
      [`${groupName} | deck created successfully`]: (d) => d.success === true,
      [`${groupName} | deck_id exists`]: (d) => !!d.deck_id,
    });

    deckId = newDeck.deck_id;
  });

  return deckId;
}


/**
 * Creates a new deck with only the specified cards.
 * @param cards Array of card codes (e.g. ['AS', '2H', '3D'])
 * @returns Deck containing the new partial deck
 */
export function createPartialDeck(cards: string[]): Deck {
  if (!cards || cards.length === 0) {
    throw new Error('cards array must contain at least one card code');
  }

  let result!: Deck;
  const groupName = 'Create Partial Deck';

  group(groupName, () => {
    const cardsParam = cards.join(',');
    const res = http.get(`${BASE_URL}/new/shuffle/?cards=${cardsParam}`);

    check(res, {
      [`${groupName} | status is 200`]: (r) => r.status === 200,
    });

    result = parseJson<Deck>(res, groupName);

    check(result, {
      [`${groupName} | deck created successfully`]: (d) => d.success === true,
      [`${groupName} | deck_id exists`]: (d) => !!d.deck_id,
    });
  });

  return result;
}



