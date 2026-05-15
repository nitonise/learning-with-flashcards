import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';

import { Deck } from '../../../core/deck.model';
import { expectNoAxeViolations } from '../../../test-helpers/a11y';
import { DeckLibrary } from './deck-library';

const STORAGE_KEY = 'learning-with-flashcards.decks';

function storedDeck(id: string, name: string): Deck {
  const now = '2026-01-01T00:00:00.000Z';

  return {
    id,
    name,
    description: `${name} description`,
    createdAt: now,
    updatedAt: now,
    cards: [],
  };
}

function searchDecks(): Deck[] {
  return [
    storedDeck('study-basics', 'Study Basics'),
    storedDeck('angular-signals', 'Angular Signals'),
    storedDeck('travel-notes', 'Travel Notes'),
  ];
}

function buttonByText(root: ParentNode, text: string): HTMLButtonElement {
  const button = Array.from(root.querySelectorAll('button')).find((candidate) =>
    candidate.textContent?.includes(text) || candidate.getAttribute('aria-label') === text,
  );

  expect(button).toBeTruthy();
  return button as HTMLButtonElement;
}

function deckTitles(root: ParentNode): string[] {
  return Array.from(root.querySelectorAll('mat-card-title')).map(
    (title) => title.textContent?.trim() ?? '',
  );
}

function setSearchQuery(root: ParentNode, value: string): void {
  const searchInput = root.querySelector('#deck-title-search') as HTMLInputElement;

  expect(searchInput).toBeTruthy();
  searchInput.value = value;
  searchInput.dispatchEvent(new Event('input'));
}

function waitForDialogClose(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 300));
}

describe('DeckLibrary', () => {
  afterEach(() => {
    localStorage.clear();
    document.body.replaceChildren();
    TestBed.resetTestingModule();
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeckLibrary],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('deletes a deck after Material dialog confirmation', async () => {
    const fixture = TestBed.createComponent(DeckLibrary);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const deleteButton = buttonByText(compiled, 'Delete');

    deleteButton.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const dialog = document.body.querySelector('mat-dialog-container') as HTMLElement;
    expect(dialog.textContent).toContain('Delete "Study Basics" and all of its cards?');

    expect(buttonByText(dialog, 'Delete')).toBeTruthy();

    TestBed.inject(MatDialog).openDialogs[0].close(true);
    await waitForDialogClose();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(compiled.textContent).toContain('No decks yet');
  });

  it('renders saved decks', () => {
    const fixture = TestBed.createComponent(DeckLibrary);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Study Basics');
    expect(compiled.querySelectorAll('.deck-card')).toHaveLength(1);
  });

  it('filters visible deck cards by typed title fragment', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(searchDecks()));

    const fixture = TestBed.createComponent(DeckLibrary);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    setSearchQuery(compiled, 'signal');
    fixture.detectChanges();

    expect(deckTitles(compiled)).toEqual(['Angular Signals']);
    expect(compiled.textContent).toContain('Showing 1 of 3 decks.');
  });

  it('matches deck titles case-insensitively and ignores query whitespace', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(searchDecks()));

    const fixture = TestBed.createComponent(DeckLibrary);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    setSearchQuery(compiled, '  basics  ');
    fixture.detectChanges();

    expect(deckTitles(compiled)).toEqual(['Study Basics']);
  });

  it('clears the search and restores the full deck list', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(searchDecks()));

    const fixture = TestBed.createComponent(DeckLibrary);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    setSearchQuery(compiled, 'travel');
    fixture.detectChanges();
    expect(deckTitles(compiled)).toEqual(['Travel Notes']);

    buttonByText(compiled, 'Clear deck title search').click();
    fixture.detectChanges();

    expect(deckTitles(compiled)).toEqual(['Study Basics', 'Angular Signals', 'Travel Notes']);
  });

  it('shows no matching decks instead of the empty library state for unmatched searches', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(searchDecks()));

    const fixture = TestBed.createComponent(DeckLibrary);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    setSearchQuery(compiled, 'biology');
    fixture.detectChanges();

    expect(compiled.textContent).toContain('No matching decks');
    expect(compiled.textContent).not.toContain('No decks yet');
    expect(compiled.querySelectorAll('.deck-card')).toHaveLength(0);
  });

  it('passes axe checks', async () => {
    const fixture = TestBed.createComponent(DeckLibrary);
    fixture.detectChanges();
    await fixture.whenStable();

    await expectNoAxeViolations(fixture.nativeElement);
  });
});
