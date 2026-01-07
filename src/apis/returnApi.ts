import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { parseJson } from '../utils/parseJson';
import { ReturnCardsResponse } from '../types/deck';
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
 * Returns specific cards to the main deck.
 * @param deckId Unique identifier of the deck
 * @param cards Array of card codes to return (e.g. ['AS', '2H'])
 * @returns Response containing deckId and remaining card count
 */
export function returnCardsToDeck(deckId: string, cards: string[]): ReturnCardsResponse {
    let result!: ReturnCardsResponse;
    const groupName = 'Return specific cards to deck';

    group(groupName, () => {
        const cardsParam = cards.join(',');
        const res = http.get(`${BASE_URL}/${deckId}/return/?cards=${cardsParam}`);

        check(res, {
            [`${groupName} | status is 200`]: (r) => r.status === 200,
        });

        result = parseJson<ReturnCardsResponse>(res, groupName);
    });

    check(result, {
        [`${groupName} | success is true`]: (d) => d.success === true,
    });

    return result;
}

/**
 * Returns all cards from all piles back to the main deck.
 * @param deckId Unique identifier of the deck
 * @returns Response containing deckId and remaining card count
 */
export function returnAllCardsToDeck(deckId: string): ReturnCardsResponse {
    let result!: ReturnCardsResponse;
    const groupName = 'Return all cards to deck';

    group(groupName, () => {
        const res = http.get(`${BASE_URL}/${deckId}/return/`);

        check(res, {
            [`${groupName} | status is 200`]: (r) => r.status === 200,
        });

        result = parseJson<ReturnCardsResponse>(res, groupName);

        check(result, {
            [`${groupName} | success is true`]: (d) => d.success === true,
        });
    });

    return result;
}

/**
 * Returns specific cards from a pile back to the main deck.
 * @param deckId Unique identifier of the deck
 * @param pileName Name of the pile containing the cards
 * @param cards Array of card codes to return (e.g. ['AS', '2H'])
 * @returns Response containing deckId and remaining card count
 */
export function returnFromPileToDeck(deckId: string, pileName: string, cards: string[]): ReturnCardsResponse {
    let result!: ReturnCardsResponse;
    const groupName = 'Return cards from pile to deck';

    group(groupName, () => {
        const cardsParam = cards.join(',');
        const res = http.get(`${BASE_URL}/${deckId}/pile/${pileName}/return/?cards=${cardsParam}`);

        check(res, {
            [`${groupName} | status is 200`]: (r) => r.status === 200,
        });

        result = parseJson<ReturnCardsResponse>(res, groupName);

        check(result, {
            [`${groupName} | success is true`]: (d) => d.success === true,
        });

    });

    return result;
}

/**
 * Moves specific cards from one pile to another pile.
 * @param deckId Unique identifier of the deck
 * @param sourcePile Name of the pile cards are moved from
 * @param targetPile Name of the pile cards are moved to
 * @param cards Array of card codes to move (e.g. ['AS', '2H'])
 * @returns Response containing deckId and remaining card count
 */
export function returnFromPileToPile(deckId: string, sourcePile: string, targetPile: string, cards: string[]): ReturnCardsResponse {
    let result!: ReturnCardsResponse;
    const groupName = 'Move cards from pile to pile';

    group(groupName, () => {
        const cardsParam = cards.join(',');
        const res = http.get(
            `${BASE_URL}/${deckId}/pile/${sourcePile}/return/?cards=${cardsParam}&to=${targetPile}`
        );

        check(res, {
            [`${groupName} | status is 200`]: (r) => r.status === 200,
        });

        result = parseJson<ReturnCardsResponse>(res, groupName);

        check(result, {
            [`${groupName} | success is true`]: (d) => d.success === true,
        });
    });

    return result;
}