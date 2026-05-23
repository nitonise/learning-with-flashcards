import type { Deck } from './deck';
import type { Flashcard } from './flashcard';

export function createSampleDeck(now: string): Deck {
  return {
    id: 'sample-study-basics',
    name: 'Study Basics',
    description: 'A small starter deck with habits that make any study session easier.',
    createdAt: now,
    updatedAt: now,
    cards: [
      createSampleCard(
        'What is active recall?',
        'A study method where you try to retrieve an answer before checking notes or the back of a card.',
        now,
        'sample-active-recall',
      ),
      createSampleCard(
        'Why shuffle flashcards?',
        'Shuffling prevents memorizing the order and helps you practice each prompt on its own.',
        now,
        'sample-shuffle',
      ),
      createSampleCard(
        'What should a good card ask?',
        'One clear question or prompt with one focused answer.',
        now,
        'sample-good-card',
      ),
    ],
  };
}

function createSampleCard(front: string, back: string, now: string, id: string): Flashcard {
  return {
    id,
    front,
    back,
    createdAt: now,
    updatedAt: now,
  };
}
