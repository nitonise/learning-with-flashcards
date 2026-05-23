import { computed, Injectable, signal } from '@angular/core';

import type { Deck } from './deck';
import { isDeck } from './deck-validation';
import type { Flashcard } from './flashcard';
import type { FlashcardDraft } from './flashcard-draft';
import { normalizeFlashcardDraft } from './flashcard-draft-normalization';
import { createSampleDeck } from './sample-decks';

const STORAGE_KEY = 'learning-with-flashcards.decks';
const STORAGE_INITIALIZED_KEY = 'learning-with-flashcards.decks.initialized';

@Injectable({
  providedIn: 'root',
})
export class DeckStoreService {
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

  createDeck(name: string, description: string): Deck | undefined {
    const now = this.now();
    const deck: Deck = {
      id: this.createId('deck'),
      name: name.trim(),
      description: description.trim(),
      cards: [],
      createdAt: now,
      updatedAt: now,
    };

    let savedDeck: Deck | undefined;
    this.decksState.update((decks) => {
      const persistedDecks = this.persist(decks, [...decks, deck]);
      savedDeck = persistedDecks === decks ? undefined : deck;
      return persistedDecks;
    });
    return savedDeck;
  }

  updateDeck(deckId: string, changes: Pick<Deck, 'name' | 'description'>): boolean {
    const now = this.now();
    let saved = false;

    this.decksState.update((decks) => {
      const nextDecks = decks.map((deck) =>
        deck.id === deckId
          ? {
              ...deck,
              name: changes.name.trim(),
              description: changes.description.trim(),
              updatedAt: now,
            }
          : deck,
      );
      const persistedDecks = this.persist(decks, nextDecks);
      saved = persistedDecks !== decks;
      return persistedDecks;
    });

    return saved;
  }

  deleteDeck(deckId: string): boolean {
    let saved = false;

    this.decksState.update((decks) => {
      const persistedDecks = this.persist(
        decks,
        decks.filter((deck) => deck.id !== deckId),
      );
      saved = persistedDecks !== decks;
      return persistedDecks;
    });

    return saved;
  }

  addCard(deckId: string, draft: FlashcardDraft): Flashcard | undefined {
    const normalizedDraft = normalizeFlashcardDraft(draft);

    if (!normalizedDraft) {
      return undefined;
    }

    const now = this.now();
    const card: Flashcard = {
      id: this.createId('card'),
      ...normalizedDraft,
      createdAt: now,
      updatedAt: now,
    };

    let created = false;
    this.decksState.update((decks) => {
      const nextDecks = decks.map((deck) => {
        if (deck.id !== deckId) {
          return deck;
        }

        created = true;
        return {
          ...deck,
          cards: [...deck.cards, card],
          updatedAt: now,
        };
      });
      const persistedDecks = this.persist(decks, nextDecks);
      created = created && persistedDecks !== decks;
      return persistedDecks;
    });

    return created ? card : undefined;
  }

  updateCard(deckId: string, cardId: string, draft: FlashcardDraft): boolean {
    const normalizedDraft = normalizeFlashcardDraft(draft);

    if (!normalizedDraft) {
      return false;
    }

    const now = this.now();
    let saved = false;

    this.decksState.update((decks) => {
      const nextDecks = decks.map((deck) => {
        if (deck.id !== deckId) {
          return deck;
        }

        return {
          ...deck,
          cards: deck.cards.map((card) =>
            card.id === cardId
              ? {
                  ...card,
                  ...normalizedDraft,
                  updatedAt: now,
                }
              : card,
          ),
          updatedAt: now,
        };
      });
      const persistedDecks = this.persist(decks, nextDecks);
      saved = persistedDecks !== decks;
      return persistedDecks;
    });

    return saved;
  }

  deleteCard(deckId: string, cardId: string): boolean {
    const now = this.now();
    let saved = false;

    this.decksState.update((decks) => {
      const nextDecks = decks.map((deck) =>
        deck.id === deckId
          ? {
              ...deck,
              cards: deck.cards.filter((card) => card.id !== cardId),
              updatedAt: now,
            }
          : deck,
      );
      const persistedDecks = this.persist(decks, nextDecks);
      saved = persistedDecks !== decks;
      return persistedDecks;
    });

    return saved;
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

      if (parsed.length === 0 && !this.hasInitializedStorage()) {
        return undefined;
      }

      this.markStorageInitialized();
      return parsed;
    } catch {
      return undefined;
    }
  }

  private persist(currentDecks: Deck[], nextDecks: Deck[]): Deck[] {
    return this.writeDecks(nextDecks) ? nextDecks : currentDecks;
  }

  private writeDecks(decks: Deck[]): boolean {
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(decks));
      this.markStorageInitialized();
      return true;
    } catch {
      return false;
    }
  }

  private hasInitializedStorage(): boolean {
    return globalThis.localStorage?.getItem(STORAGE_INITIALIZED_KEY) === 'true';
  }

  private markStorageInitialized(): void {
    try {
      globalThis.localStorage?.setItem(STORAGE_INITIALIZED_KEY, 'true');
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
