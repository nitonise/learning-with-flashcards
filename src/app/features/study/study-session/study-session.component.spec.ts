import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import type { Deck } from '../../../core/deck';
import type { Flashcard } from '../../../core/flashcard';
import type { FlashcardImage } from '../../../core/flashcard-image';
import { expectNoAxeViolations } from '../../../test-helpers/a11y';
import { StudySession } from './study-session.component';

const STORAGE_KEY = 'learning-with-flashcards.decks';

interface StudySessionTestApi {
  studyCards: () => Flashcard[];
  studyOrder: () => 'sequential' | 'shuffle';
  activeText: () => string | undefined;
  activeCardStatus: () => string;
  flashcardAriaLabel: () => string;
  liveStatus: () => string;
  difficultCount: () => number;
  showDifficultOnly: () => boolean;
  activeCardIsDifficult: () => boolean;
  toggleFlip: () => void;
  toggleActiveCardDifficult: () => void;
  toggleDifficultOnly: () => void;
  setStudyOrder: (order: 'sequential' | 'shuffle') => void;
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
        frontImage: testImage('Question one diagram', 'front.png'),
        back: 'Answer one',
        backImage: testImage('Answer one diagram', 'back.png'),
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

function testImage(alt: string, originalName: string): FlashcardImage {
  return {
    src: 'data:image/png;base64,aW1hZ2U=',
    alt,
    mimeType: 'image/png',
    originalName,
    width: 640,
    height: 480,
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

  it('gives the flashcard an explicit accessible name with card status', () => {
    const fixture = TestBed.createComponent(StudySession);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const flashcard = compiled.querySelector('.flashcard') as HTMLButtonElement;

    expect(flashcard.getAttribute('aria-label')).toContain('Card 1 of 3. Front side.');
    expect(flashcard.getAttribute('aria-label')).toContain('Text: Question one.');
    expect(flashcard.getAttribute('aria-label')).toContain('Image: Question one diagram.');
    expect(flashcard.getAttribute('aria-label')).toContain('Show back side.');
  });

  it('updates screen-reader status after flips and card navigation', () => {
    const fixture = TestBed.createComponent(StudySession);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const component = studySessionApi(fixture);
    const liveRegion = compiled.querySelector('[aria-live="polite"]') as HTMLElement;

    expect(liveRegion.textContent).toContain('Card 1 of 3. Front side.');

    component.toggleFlip();
    fixture.detectChanges();

    expect(component.liveStatus()).toContain('Card 1 of 3. Back side.');
    expect(liveRegion.textContent).toContain('Text: Answer one.');

    component.nextCard();
    fixture.detectChanges();

    expect(component.liveStatus()).toContain('Card 2 of 3. Front side.');
    expect(liveRegion.textContent).toContain('Text: Question two.');
  });

  it('announces order and difficult-only filter changes', () => {
    const fixture = TestBed.createComponent(StudySession);
    fixture.detectChanges();

    const component = studySessionApi(fixture);
    component.setStudyOrder('shuffle');

    expect(component.liveStatus()).toContain('Study order set to shuffle.');

    component.toggleActiveCardDifficult();
    component.toggleDifficultOnly();

    expect(component.showDifficultOnly()).toBe(true);
    expect(component.liveStatus()).toContain('Difficult-only filter on.');
  });

  it('renders front and back images on the correct side', () => {
    const fixture = TestBed.createComponent(StudySession);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const frontImage = compiled.querySelector('.flashcard__image') as HTMLImageElement;
    expect(frontImage.alt).toBe('Question one diagram');

    getButtonByText(compiled, 'Flip').click();
    fixture.detectChanges();

    const backImage = compiled.querySelector('.flashcard__image') as HTMLImageElement;
    expect(backImage.alt).toBe('Answer one diagram');
    expect(compiled.querySelector('.flashcard__text')?.textContent).toContain('Answer one');
  });

  it('selects shuffled and sequential study order', () => {
    const fixture = TestBed.createComponent(StudySession);
    fixture.detectChanges();

    const component = studySessionApi(fixture);

    expect(component.studyOrder()).toBe('sequential');

    component.setStudyOrder('shuffle');

    expect(component.studyOrder()).toBe('shuffle');
    expect(component.activeText()).toBeTruthy();

    component.setStudyOrder('sequential');

    expect(component.studyOrder()).toBe('sequential');
    expect(component.studyCards().map((card) => card.id)).toEqual([
      'card-one',
      'card-two',
      'card-three',
    ]);
    expect(component.activeText()).toBe('Question one');
  });

  it('preserves the same card set when shuffled', () => {
    const fixture = TestBed.createComponent(StudySession);
    fixture.detectChanges();

    const component = studySessionApi(fixture);
    const originalIds = component
      .studyCards()
      .map((card) => card.id)
      .sort();

    component.setStudyOrder('shuffle');
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

    component.setStudyOrder('shuffle');
    const shuffledDifficultOnlyIds = component
      .studyCards()
      .map((card) => card.id)
      .sort();

    expect(difficultOnlyIds).toEqual(['card-one', 'card-two']);
    expect(shuffledDifficultOnlyIds).toEqual(difficultOnlyIds);
  });
});
