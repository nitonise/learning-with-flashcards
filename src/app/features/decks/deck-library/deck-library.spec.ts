import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { DeckLibrary } from './deck-library';

const STORAGE_KEY = 'learning-with-flashcards.decks';

describe('DeckLibrary', () => {
  afterEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('renders an empty state', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));

    await TestBed.configureTestingModule({
      imports: [DeckLibrary],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(DeckLibrary);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No decks yet');
  });

  it('renders saved decks', async () => {
    await TestBed.configureTestingModule({
      imports: [DeckLibrary],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(DeckLibrary);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Study Basics');
    expect(compiled.querySelectorAll('.deck-card')).toHaveLength(1);
  });
});
