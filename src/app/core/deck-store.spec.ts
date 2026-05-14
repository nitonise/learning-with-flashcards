import { TestBed } from '@angular/core/testing';

import { DeckStore } from './deck-store';
import { Deck } from './deck.model';

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

describe('DeckStore', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('seeds sample data when storage is empty', () => {
    const store = TestBed.inject(DeckStore);

    expect(store.decks()).toHaveLength(1);
    expect(store.decks()[0].name).toBe('Study Basics');
    expect(store.decks()[0].cards.length).toBeGreaterThan(0);
  });

  it('seeds sample data when legacy saved storage has no decks', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));

    const store = TestBed.inject(DeckStore);

    expect(store.decks()).toHaveLength(1);
    expect(store.decks()[0].name).toBe('Study Basics');
    expect(localStorage.getItem(STORAGE_KEY)).toContain('Study Basics');
  });

  it('preserves a deliberately empty deck library after reload', () => {
    const store = TestBed.inject(DeckStore);

    store.deleteDeck(store.decks()[0].id);
    expect(store.decks()).toEqual([]);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});

    const reloadedStore = TestBed.inject(DeckStore);
    expect(reloadedStore.decks()).toEqual([]);
  });

  it('loads existing saved data', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([testDeck()]));

    const store = TestBed.inject(DeckStore);

    expect(store.decks()).toEqual([testDeck()]);
    expect(store.totalCards()).toBe(1);
  });

  it('rejects invalid persisted data by falling back safely', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ id: 'broken' }]));

    const store = TestBed.inject(DeckStore);

    expect(store.decks()).toHaveLength(1);
    expect(store.decks()[0].name).toBe('Study Basics');
  });

  it('creates, updates, and deletes decks', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));

    const store = TestBed.inject(DeckStore);
    const deck = store.createDeck(' Biology ', ' Cells ');

    expect(store.deckById(deck.id)?.name).toBe('Biology');

    store.updateDeck(deck.id, { name: 'Chemistry', description: 'Reactions' });
    expect(store.deckById(deck.id)?.description).toBe('Reactions');

    store.deleteDeck(deck.id);
    expect(store.deckById(deck.id)).toBeUndefined();
  });

  it('creates, updates, and deletes cards', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));

    const store = TestBed.inject(DeckStore);
    const deck = store.createDeck('History', '');
    const card = store.addCard(deck.id, ' 1492 ', ' Columbus reaches the Americas ');

    expect(card).toBeDefined();
    expect(store.deckById(deck.id)?.cards[0].front).toBe('1492');

    store.updateCard(deck.id, card?.id ?? '', '1066', 'Battle of Hastings');
    expect(store.deckById(deck.id)?.cards[0].back).toBe('Battle of Hastings');

    store.deleteCard(deck.id, card?.id ?? '');
    expect(store.deckById(deck.id)?.cards).toHaveLength(0);
  });
});
