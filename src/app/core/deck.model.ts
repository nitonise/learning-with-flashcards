export interface Flashcard {
  id: string;
  front: string;
  back: string;
  createdAt: string;
  updatedAt: string;
}

export interface Deck {
  id: string;
  name: string;
  description: string;
  cards: Flashcard[];
  createdAt: string;
  updatedAt: string;
}
