export interface Card {
  code: string;
  image: string;
  images: {
    svg: string;
    png: string;
  };
  value: string;
  suit: string;
}

export interface Deck {
  success: boolean;
  deck_id: string;
  shuffled: boolean;
  remaining: number;
}

export interface DrawCards {
  success: boolean;
  deck_id: string;
  cards: Card[];
  remaining: number;
}

export interface PileAddResponse {
  success: boolean;
  deck_id: string;
  remaining: number;
}

export interface PileListResponse {
  success: boolean;
  deck_id: string;
  remaining: number;
  piles: Record<
    string,
    {
      remaining: number;
      cards: Card[];
    }
  >;
}

export interface PileDrawResponse {
  success: boolean;
  deck_id: string;
  cards: Card[];
  remaining: number;
}

export interface ReturnCardsResponse {
  success: boolean;
  deck_id: string;
  remaining: number;
}


