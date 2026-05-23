import { TestBed } from '@angular/core/testing';

import type { Deck } from './deck';
import { DeckStoreService } from './deck-store.service';
import type { FlashcardImage } from './flashcard-image';

const STORAGE_KEY = 'learning-with-flashcards.decks';

function testDeck(): Deck {
  const now = new Date('2026-01-01T00:00:00.000Z').toISOString();

  return {
    id: 'deck-test',
    name: 'Existing deck',
    description: 'Loaded from storage',
    createdAt: now,
    updatedAt: now,
    cards: [
      {
        id: 'card-test',
        front: 'Front',
        back: 'Back',
        createdAt: now,
        updatedAt: now,
      },
    ],
  };
}

function testImage(name = 'diagram.png'): FlashcardImage {
  return {
    src: 'data:image/png;base64,aW1hZ2U=',
    alt: 'Cell diagram',
    mimeType: 'image/png',
    originalName: name,
    width: 640,
    height: 480,
  };
}

function createDeckOrThrow(store: DeckStoreService, name: string, description = ''): Deck {
  const deck = store.createDeck(name, description);

  if (!deck) {
    throw new Error('Expected deck to be created.');
  }

  return deck;
}

describe('DeckStoreService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('seeds sample data when storage is empty', () => {
    const store = TestBed.inject(DeckStoreService);

    expect(store.decks()).toHaveLength(1);
    expect(store.decks()[0].name).toBe('Study Basics');
    expect(store.decks()[0].cards.length).toBeGreaterThan(0);
  });

  it('seeds sample data when legacy saved storage has no decks', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));

    const store = TestBed.inject(DeckStoreService);

    expect(store.decks()).toHaveLength(1);
    expect(store.decks()[0].name).toBe('Study Basics');
    expect(localStorage.getItem(STORAGE_KEY)).toContain('Study Basics');
  });

  it('preserves a deliberately empty deck library after reload', () => {
    const store = TestBed.inject(DeckStoreService);

    store.deleteDeck(store.decks()[0].id);
    expect(store.decks()).toEqual([]);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});

    const reloadedStore = TestBed.inject(DeckStoreService);
    expect(reloadedStore.decks()).toEqual([]);
  });

  it('loads existing saved data', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([testDeck()]));

    const store = TestBed.inject(DeckStoreService);

    expect(store.decks()).toEqual([testDeck()]);
    expect(store.totalCards()).toBe(1);
  });

  it('loads legacy saved cards without image fields', () => {
    const legacyDeck = testDeck();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([legacyDeck]));

    const store = TestBed.inject(DeckStoreService);

    expect(store.decks()[0].cards[0].frontImage).toBeUndefined();
    expect(store.decks()[0].cards[0].backImage).toBeUndefined();
  });

  it('rejects invalid persisted data by falling back safely', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ id: 'broken' }]));

    const store = TestBed.inject(DeckStoreService);

    expect(store.decks()).toHaveLength(1);
    expect(store.decks()[0].name).toBe('Study Basics');
  });

  it('rejects invalid persisted image data by falling back safely', () => {
    const deck = testDeck();
    deck.cards[0] = {
      ...deck.cards[0],
      frontImage: {
        ...testImage(),
        alt: '',
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([deck]));

    const store = TestBed.inject(DeckStoreService);

    expect(store.decks()).toHaveLength(1);
    expect(store.decks()[0].name).toBe('Study Basics');
  });

  it('creates, updates, and deletes decks', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));

    const store = TestBed.inject(DeckStoreService);
    const deck = createDeckOrThrow(store, ' Biology ', ' Cells ');

    expect(store.deckById(deck.id)?.name).toBe('Biology');

    store.updateDeck(deck.id, { name: 'Chemistry', description: 'Reactions' });
    expect(store.deckById(deck.id)?.description).toBe('Reactions');

    store.deleteDeck(deck.id);
    expect(store.deckById(deck.id)).toBeUndefined();
  });

  it('creates, updates, and deletes cards', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));

    const store = TestBed.inject(DeckStoreService);
    const deck = createDeckOrThrow(store, 'History');
    const card = store.addCard(deck.id, {
      front: ' 1492 ',
      back: ' Columbus reaches the Americas ',
    });

    expect(card).toBeDefined();
    expect(store.deckById(deck.id)?.cards[0].front).toBe('1492');

    store.updateCard(deck.id, card?.id ?? '', { front: '1066', back: 'Battle of Hastings' });
    expect(store.deckById(deck.id)?.cards[0].back).toBe('Battle of Hastings');

    store.deleteCard(deck.id, card?.id ?? '');
    expect(store.deckById(deck.id)?.cards).toHaveLength(0);
  });

  it('creates cards with text and images', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));

    const store = TestBed.inject(DeckStoreService);
    const deck = createDeckOrThrow(store, 'Biology');
    const card = store.addCard(deck.id, {
      front: 'Cell',
      frontImage: testImage('front.png'),
      back: 'Smallest unit of life',
      backImage: testImage('back.png'),
    });

    expect(card?.frontImage?.alt).toBe('Cell diagram');
    expect(store.deckById(deck.id)?.cards[0].backImage?.originalName).toBe('back.png');
  });

  it('creates image-only card sides when images have alt text', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));

    const store = TestBed.inject(DeckStoreService);
    const deck = createDeckOrThrow(store, 'Art');
    const card = store.addCard(deck.id, {
      front: '',
      frontImage: testImage('front.png'),
      back: '',
      backImage: testImage('back.png'),
    });

    expect(card).toBeDefined();
    expect(store.deckById(deck.id)?.cards[0].front).toBe('');
    expect(store.deckById(deck.id)?.cards[0].backImage?.alt).toBe('Cell diagram');
  });

  it('keeps deck state unchanged when persistence fails', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([testDeck()]));

    const store = TestBed.inject(DeckStoreService);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded.', 'QuotaExceededError');
    });

    expect(store.createDeck('Biology', '')).toBeUndefined();
    expect(store.decks()).toEqual([testDeck()]);
  });
});
