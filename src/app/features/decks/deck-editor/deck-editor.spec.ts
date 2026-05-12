import { provideRouter } from '@angular/router';
import { convertToParamMap, ActivatedRoute } from '@angular/router';
import { TestBed } from '@angular/core/testing';

import { Deck } from '../../../core/deck.model';
import { DeckEditor } from './deck-editor';

const storageKey = 'learning-with-flashcards.decks';

function storedDeck(): Deck {
  const now = '2026-01-01T00:00:00.000Z';

  return {
    id: 'deck-editor-test',
    name: 'Editor deck',
    description: '',
    createdAt: now,
    updatedAt: now,
    cards: [],
  };
}

describe('DeckEditor', () => {
  afterEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('shows deck form validation', async () => {
    localStorage.setItem(storageKey, JSON.stringify([]));

    await TestBed.configureTestingModule({
      imports: [DeckEditor],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({}),
            },
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(DeckEditor);
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Enter a deck name.');
  });

  it('shows card form validation', async () => {
    localStorage.setItem(storageKey, JSON.stringify([storedDeck()]));

    await TestBed.configureTestingModule({
      imports: [DeckEditor],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ deckId: 'deck-editor-test' }),
            },
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(DeckEditor);
    fixture.detectChanges();

    const forms = fixture.nativeElement.querySelectorAll('form') as NodeListOf<HTMLFormElement>;
    forms[1].dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Enter the card front.');
    expect(compiled.textContent).toContain('Enter the card back.');
  });
});
