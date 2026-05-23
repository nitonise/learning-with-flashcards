import type { Flashcard } from './flashcard';

export interface Deck {
  id: string;
  name: string;
  description: string;
  cards: Flashcard[];
  createdAt: string;
  updatedAt: string;
}
