import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { parseJson } from '../utils/parseJson';
import { PileAddResponse, PileListResponse, PileDrawResponse } from '../types/deck';
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
 * Add cards to a named pile
 * @param deckId
 * @param pileName
 * @param cards Array of card codes e.g. ['AS','2H']
 */
export function addToPile(deckId: string, pileName: string, cards: string[]): PileAddResponse {
    let result!: PileAddResponse;
    const groupName = 'Add to pile';

    group(groupName, () => {
        const cardsParam = cards.join(',');

        const res = http.get(`${BASE_URL}/${deckId}/pile/${pileName}/add/?cards=${cardsParam}`);

        check(res, {
            [`${groupName} | status is 200`]: (r) => r.status === 200,
        });

        result = parseJson<PileAddResponse>(res, groupName);

        check(result, {
            [`${groupName} | success is true`]: (d) => d.success === true,
        });

    });

    return result;
}

/**
 * Shuffles all cards within a specified pile.
 * @param deckId Unique identifier of the deck
 * @param pileName Name of the pile to shuffle
 * @returns Response containing deckId and remaining card count
 */
export function shufflePile(deckId: string, pileName: string): PileAddResponse {
    let result!: PileAddResponse;
    const groupName = 'Shuffle pile';

    group(groupName, () => {
        const res = http.get(`${BASE_URL}/${deckId}/pile/${pileName}/shuffle/`);

        check(res, {
            [`${groupName} | status is 200`]: (r) => r.status === 200,
        });

        result = parseJson<PileAddResponse>(res, groupName);
    });

    check(result, {
        [`${groupName} | success is true`]: (d) => d.success === true,
    });

    return result;
}

/**
 * Lists all cards currently contained in a specified pile.
 * @param deckId Unique identifier of the deck
 * @param pileName Name of the pile to list
 * @returns Response containing pile contents and remaining card count
 */
export function listPile(deckId: string, pileName: string): PileListResponse {
    let result!: PileListResponse;
    const groupName = 'List pile';

    group(groupName, () => {
        const res = http.get(`${BASE_URL}/${deckId}/pile/${pileName}/list/`);

        check(res, {
            [`${groupName} | status is 200`]: (r) => r.status === 200,
        });

        result = parseJson<PileListResponse>(res, groupName);

        check(result, {
            [`${groupName} | success is true`]: (d) => d.success === true,
        });
    });

    

    return result;
}

/**
 * Draws a specified number of cards from a pile.
 * @param deckId Unique identifier of the deck
 * @param pileName Name of the pile to draw cards from
 * @param count Number of cards to draw
 * @returns Response containing drawn cards and remaining card count
 */
export function drawFromPile(deckId: string, pileName: string, count: number): PileDrawResponse {
    let result!: PileDrawResponse;
    const groupName = 'Draw from pile';

    group(groupName, () => {
        const res = http.get(`${BASE_URL}/${deckId}/pile/${pileName}/draw/?count=${count}`);

        const cards = res.json('cards');
        check(res, {
            [`${groupName} | status is 200`]: (r) => r.status === 200,
        });

        result = parseJson<PileDrawResponse>(res, groupName);

        check(result, {
            [`${groupName} | ${count} cards returned`]: () => result.cards.length === count,
        });
    });

    return result;
}
