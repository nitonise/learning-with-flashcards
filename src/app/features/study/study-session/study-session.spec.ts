import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { Deck, Flashcard } from '../../../core/deck.model';
import { expectNoAxeViolations } from '../../../test-helpers/a11y';
import { StudySession } from './study-session';

const STORAGE_KEY = 'learning-with-flashcards.decks';

interface StudySessionTestApi {
  studyCards: () => Flashcard[];
  activeText: () => string | undefined;
  difficultCount: () => number;
  showDifficultOnly: () => boolean;
  activeCardIsDifficult: () => boolean;
  toggleActiveCardDifficult: () => void;
  toggleDifficultOnly: () => void;
  toggleShuffle: () => void;
  nextCard: () => void;
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
      {
        id: 'card-three',
        front: 'Question three',
        back: 'Answer three',
        createdAt: now,
        updatedAt: now,
      },
    ],
  };
}

function getButtonByText(compiled: HTMLElement, text: string): HTMLButtonElement {
  const button = Array.from(compiled.querySelectorAll('button')).find((candidate) =>
    candidate.textContent?.includes(text),
  );

  expect(button).toBeTruthy();
  return button as HTMLButtonElement;
}

function studySessionApi(fixture: { componentInstance: StudySession }): StudySessionTestApi {
  return fixture.componentInstance as unknown as StudySessionTestApi;
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

  it('passes axe checks', async () => {
    const fixture = TestBed.createComponent(StudySession);
    fixture.detectChanges();
    await fixture.whenStable();

    await expectNoAxeViolations(fixture.nativeElement);
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

    const component = studySessionApi(fixture);
    const originalIds = component
      .studyCards()
      .map((card) => card.id)
      .sort();

    component.toggleShuffle();
    const shuffledIds = component
      .studyCards()
      .map((card) => card.id)
      .sort();

    expect(shuffledIds).toEqual(originalIds);
  });

  it('marks and unmarks the active card as difficult', () => {
    const fixture = TestBed.createComponent(StudySession);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const component = studySessionApi(fixture);
    const markButton = getButtonByText(compiled, 'Mark difficult');

    expect(markButton.getAttribute('aria-pressed')).toBe('false');

    markButton.click();
    fixture.detectChanges();

    const markedButton = getButtonByText(compiled, 'Marked difficult');
    expect(component.difficultCount()).toBe(1);
    expect(component.activeCardIsDifficult()).toBe(true);
    expect(markedButton.getAttribute('aria-pressed')).toBe('true');

    markedButton.click();
    fixture.detectChanges();

    expect(component.difficultCount()).toBe(0);
    expect(component.activeCardIsDifficult()).toBe(false);
    expect(getButtonByText(compiled, 'Mark difficult').getAttribute('aria-pressed')).toBe('false');
  });

  it('disables difficult-only mode when no cards are marked', () => {
    const fixture = TestBed.createComponent(StudySession);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const difficultOnlyButton = getButtonByText(compiled, 'Difficult only (0)');

    expect(difficultOnlyButton.disabled).toBe(true);
    expect(difficultOnlyButton.getAttribute('aria-pressed')).toBe('false');
  });

  it('shows only marked cards in difficult-only mode', () => {
    const fixture = TestBed.createComponent(StudySession);
    fixture.detectChanges();

    const component = studySessionApi(fixture);
    component.toggleActiveCardDifficult();
    component.nextCard();
    component.nextCard();
    component.toggleActiveCardDifficult();

    component.toggleDifficultOnly();

    expect(component.showDifficultOnly()).toBe(true);
    expect(component.studyCards().map((card) => card.id)).toEqual(['card-one', 'card-three']);
    expect(component.activeText()).toBe('Question one');

    component.nextCard();

    expect(component.activeText()).toBe('Question three');
  });

  it('removes unmarked cards from a difficult-only run', () => {
    const fixture = TestBed.createComponent(StudySession);
    fixture.detectChanges();

    const component = studySessionApi(fixture);
    component.toggleActiveCardDifficult();
    component.nextCard();
    component.toggleActiveCardDifficult();
    component.toggleDifficultOnly();
    component.nextCard();

    component.toggleActiveCardDifficult();

    expect(component.showDifficultOnly()).toBe(true);
    expect(component.studyCards().map((card) => card.id)).toEqual(['card-one']);
    expect(component.activeText()).toBe('Question one');
  });

  it('exits difficult-only mode when the last difficult card is unmarked', () => {
    const fixture = TestBed.createComponent(StudySession);
    fixture.detectChanges();

    const component = studySessionApi(fixture);
    component.toggleActiveCardDifficult();
    component.toggleDifficultOnly();

    component.toggleActiveCardDifficult();

    expect(component.showDifficultOnly()).toBe(false);
    expect(component.difficultCount()).toBe(0);
    expect(component.studyCards().map((card) => card.id)).toEqual([
      'card-one',
      'card-two',
      'card-three',
    ]);
    expect(component.activeText()).toBe('Question one');
  });

  it('preserves the difficult-only card set when shuffled', () => {
    const fixture = TestBed.createComponent(StudySession);
    fixture.detectChanges();

    const component = studySessionApi(fixture);
    component.toggleActiveCardDifficult();
    component.nextCard();
    component.toggleActiveCardDifficult();
    component.toggleDifficultOnly();
    const difficultOnlyIds = component
      .studyCards()
      .map((card) => card.id)
      .sort();

    component.toggleShuffle();
    const shuffledDifficultOnlyIds = component
      .studyCards()
      .map((card) => card.id)
      .sort();

    expect(difficultOnlyIds).toEqual(['card-one', 'card-two']);
    expect(shuffledDifficultOnlyIds).toEqual(difficultOnlyIds);
  });
});
