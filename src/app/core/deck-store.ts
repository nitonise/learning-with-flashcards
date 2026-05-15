import { computed, Injectable, signal } from '@angular/core';

import { Deck, Flashcard, FlashcardDraft, FlashcardImage } from './deck.model';

const STORAGE_KEY = 'learning-with-flashcards.decks';
const STORAGE_INITIALIZED_KEY = 'learning-with-flashcards.decks.initialized';
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

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

function isPositiveDimension(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= 1200;
}

function isFlashcardImage(value: unknown): value is FlashcardImage {
  if (!isRecord(value) || !isString(value['mimeType'])) {
    return false;
  }

  const mimeType = value['mimeType'];

  return (
    ALLOWED_IMAGE_TYPES.has(mimeType) &&
    isNonEmptyString(value['src']) &&
    value['src'].startsWith(`data:${mimeType};base64,`) &&
    isNonEmptyString(value['alt']) &&
    isNonEmptyString(value['originalName']) &&
    isPositiveDimension(value['width']) &&
    isPositiveDimension(value['height'])
  );
}

function hasSideContent(text: unknown, image: unknown): boolean {
  return (isString(text) && text.trim().length > 0) || isFlashcardImage(image);
}

function isFlashcard(value: unknown): value is Flashcard {
  if (!isRecord(value)) {
    return false;
  }

  const frontImage = value['frontImage'];
  const backImage = value['backImage'];

  return (
    isNonEmptyString(value['id']) &&
    isString(value['front']) &&
    isString(value['back']) &&
    (frontImage === undefined || isFlashcardImage(frontImage)) &&
    (backImage === undefined || isFlashcardImage(backImage)) &&
    hasSideContent(value['front'], frontImage) &&
    hasSideContent(value['back'], backImage) &&
    isNonEmptyString(value['createdAt']) &&
    isNonEmptyString(value['updatedAt'])
  );
}

function normalizeImage(image: FlashcardImage | undefined): FlashcardImage | undefined {
  if (!image) {
    return undefined;
  }

  return {
    ...image,
    alt: image.alt.trim(),
    originalName: image.originalName.trim(),
  };
}

function normalizeDraft(draft: FlashcardDraft): FlashcardDraft | undefined {
  const normalized: FlashcardDraft = {
    front: draft.front.trim(),
    back: draft.back.trim(),
    frontImage: normalizeImage(draft.frontImage),
    backImage: normalizeImage(draft.backImage),
  };

  if (normalized.frontImage !== undefined && !isFlashcardImage(normalized.frontImage)) {
    return undefined;
  }

  if (normalized.backImage !== undefined && !isFlashcardImage(normalized.backImage)) {
    return undefined;
  }

  if (!hasSideContent(normalized.front, normalized.frontImage)) {
    return undefined;
  }

  if (!hasSideContent(normalized.back, normalized.backImage)) {
    return undefined;
  }

  return normalized;
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
    const normalizedDraft = normalizeDraft(draft);

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
    const normalizedDraft = normalizeDraft(draft);

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
