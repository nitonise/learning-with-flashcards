import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { Deck, Flashcard } from '../../../core/deck.model';
import { StudySession } from './study-session';

const STORAGE_KEY = 'learning-with-flashcards.decks';

interface StudySessionTestApi {
  studyCards: () => Flashcard[];
  toggleShuffle: () => void;
}

function studyDeck(): Deck {
  const now = '2026-01-01T00:00:00.000Z';

  return {
    id: 'deck-study-test',
    name: 'Study deck',
    description: '',
    createdAt: now,
    updatedAt: now,
    cards: [
      {
        id: 'card-one',
        front: 'Question one',
        back: 'Answer one',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'card-two',
        front: 'Question two',
        back: 'Answer two',
        createdAt: now,
        updatedAt: now,
      },
    ],
  };
}

describe('StudySession', () => {
  beforeEach(async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([studyDeck()]));

    await TestBed.configureTestingModule({
      imports: [StudySession],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ deckId: 'deck-study-test' }),
            },
          },
        },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('flips and navigates cards', () => {
    const fixture = TestBed.createComponent(StudySession);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.flashcard__text')?.textContent).toContain('Question one');

    const flipButton = Array.from(compiled.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Flip'),
    );
    flipButton?.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.flashcard__text')?.textContent).toContain('Answer one');

    const nextButton = Array.from(compiled.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Next'),
    );
    nextButton?.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.flashcard__text')?.textContent).toContain('Question two');
  });

  it('keeps the visible card text in the flashcard accessible name', () => {
    const fixture = TestBed.createComponent(StudySession);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const flashcard = compiled.querySelector('.flashcard') as HTMLButtonElement;

    expect(flashcard.getAttribute('aria-label')).toBeNull();
    expect(flashcard.textContent).toContain('Question one');
  });

  it('preserves the same card set when shuffled', () => {
    const fixture = TestBed.createComponent(StudySession);
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as StudySessionTestApi;
    const originalIds = component.studyCards().map((card) => card.id).sort();

    component.toggleShuffle();
    const shuffledIds = component.studyCards().map((card) => card.id).sort();

    expect(shuffledIds).toEqual(originalIds);
  });
});
