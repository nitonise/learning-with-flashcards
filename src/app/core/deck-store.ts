import { computed, Injectable, signal } from '@angular/core';

import { Deck, Flashcard } from './deck.model';

const STORAGE_KEY = 'learning-with-flashcards.decks';

function createSampleDeck(now: string): Deck {
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isFlashcard(value: unknown): value is Flashcard {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonEmptyString(value['id']) &&
    isNonEmptyString(value['front']) &&
    isNonEmptyString(value['back']) &&
    isNonEmptyString(value['createdAt']) &&
    isNonEmptyString(value['updatedAt'])
  );
}

function isDeck(value: unknown): value is Deck {
  if (!isRecord(value) || !Array.isArray(value['cards'])) {
    return false;
  }

  return (
    isNonEmptyString(value['id']) &&
    isNonEmptyString(value['name']) &&
    isString(value['description']) &&
    isNonEmptyString(value['createdAt']) &&
    isNonEmptyString(value['updatedAt']) &&
    value['cards'].every(isFlashcard)
  );
}

@Injectable({
  providedIn: 'root',
})
export class DeckStore {
  private readonly decksState = signal<Deck[]>(this.loadInitialDecks());

  readonly decks = this.decksState.asReadonly();
  readonly totalCards = computed(() =>
    this.decksState().reduce((total, deck) => total + deck.cards.length, 0),
  );
  private readonly deckLookup = computed(
    () => new Map(this.decksState().map((deck) => [deck.id, deck] as const)),
  );

  deckById(id: string): Deck | undefined {
    return this.deckLookup().get(id);
  }

  createDeck(name: string, description: string): Deck {
    const now = this.now();
    const deck: Deck = {
      id: this.createId('deck'),
      name: name.trim(),
      description: description.trim(),
      cards: [],
      createdAt: now,
      updatedAt: now,
    };

    this.decksState.update((decks) => this.persist([...decks, deck]));
    return deck;
  }

  updateDeck(deckId: string, changes: Pick<Deck, 'name' | 'description'>): void {
    const now = this.now();

    this.decksState.update((decks) =>
      this.persist(
        decks.map((deck) =>
          deck.id === deckId
            ? {
                ...deck,
                name: changes.name.trim(),
                description: changes.description.trim(),
                updatedAt: now,
              }
            : deck,
        ),
      ),
    );
  }

  deleteDeck(deckId: string): void {
    this.decksState.update((decks) => this.persist(decks.filter((deck) => deck.id !== deckId)));
  }

  addCard(deckId: string, front: string, back: string): Flashcard | undefined {
    const now = this.now();
    const card: Flashcard = {
      id: this.createId('card'),
      front: front.trim(),
      back: back.trim(),
      createdAt: now,
      updatedAt: now,
    };

    let created = false;
    this.decksState.update((decks) =>
      this.persist(
        decks.map((deck) => {
          if (deck.id !== deckId) {
            return deck;
          }

          created = true;
          return {
            ...deck,
            cards: [...deck.cards, card],
            updatedAt: now,
          };
        }),
      ),
    );

    return created ? card : undefined;
  }

  updateCard(deckId: string, cardId: string, front: string, back: string): void {
    const now = this.now();

    this.decksState.update((decks) =>
      this.persist(
        decks.map((deck) => {
          if (deck.id !== deckId) {
            return deck;
          }

          return {
            ...deck,
            cards: deck.cards.map((card) =>
              card.id === cardId
                ? {
                    ...card,
                    front: front.trim(),
                    back: back.trim(),
                    updatedAt: now,
                  }
                : card,
            ),
            updatedAt: now,
          };
        }),
      ),
    );
  }

  deleteCard(deckId: string, cardId: string): void {
    const now = this.now();

    this.decksState.update((decks) =>
      this.persist(
        decks.map((deck) =>
          deck.id === deckId
            ? {
                ...deck,
                cards: deck.cards.filter((card) => card.id !== cardId),
                updatedAt: now,
              }
            : deck,
        ),
      ),
    );
  }

  private loadInitialDecks(): Deck[] {
    const stored = this.readStoredDecks();

    if (stored) {
      return stored;
    }

    const sampleDecks = [createSampleDeck(this.now())];
    this.writeDecks(sampleDecks);
    return sampleDecks;
  }

  private readStoredDecks(): Deck[] | undefined {
    try {
      const rawDecks = globalThis.localStorage?.getItem(STORAGE_KEY);

      if (!rawDecks) {
        return undefined;
      }

      const parsed: unknown = JSON.parse(rawDecks);

      if (!Array.isArray(parsed) || !parsed.every(isDeck)) {
        return undefined;
      }

      return parsed;
    } catch {
      return undefined;
    }
  }

  private persist(decks: Deck[]): Deck[] {
    this.writeDecks(decks);
    return decks;
  }

  private writeDecks(decks: Deck[]): void {
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(decks));
    } catch {
      return;
    }
  }

  private createId(prefix: string): string {
    return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? this.fallbackId()}`;
  }

  private fallbackId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  private now(): string {
    return new Date().toISOString();
  }
}
