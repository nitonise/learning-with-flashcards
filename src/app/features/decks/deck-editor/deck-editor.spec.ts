import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { Deck } from '../../../core/deck.model';
import { expectNoAxeViolations } from '../../../test-helpers/a11y';
import { DeckEditor } from './deck-editor';

const STORAGE_KEY = 'learning-with-flashcards.decks';

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

function storedDeckWithCard(): Deck {
  const now = '2026-01-01T00:00:00.000Z';

  return {
    ...storedDeck(),
    cards: [
      {
        id: 'card-editor-test',
        front: 'Question',
        back: 'Answer',
        createdAt: now,
        updatedAt: now,
      },
    ],
  };
}

async function configureDeckEditor(routeParams: Record<string, string> = {}): Promise<void> {
  await TestBed.configureTestingModule({
    imports: [DeckEditor],
    providers: [
      provideRouter([]),
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            paramMap: convertToParamMap(routeParams),
          },
        },
      },
    ],
  }).compileComponents();
}

function setFieldValue(field: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  field.value = value;
  field.dispatchEvent(new Event('input'));
}

function buttonByText(root: ParentNode, text: string): HTMLButtonElement {
  const button = Array.from(root.querySelectorAll('button')).find((candidate) =>
    candidate.textContent?.includes(text),
  );

  expect(button).toBeTruthy();
  return button as HTMLButtonElement;
}

function waitForDialogClose(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 300));
}

describe('DeckEditor', () => {
  afterEach(() => {
    localStorage.clear();
    document.body.replaceChildren();
    TestBed.resetTestingModule();
  });

  it('shows deck form validation', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));

    await configureDeckEditor();

    const fixture = TestBed.createComponent(DeckEditor);
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Enter a deck name.');
  });

  it('rejects whitespace-only deck names', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));

    await configureDeckEditor();

    const fixture = TestBed.createComponent(DeckEditor);
    fixture.detectChanges();

    const nameInput = fixture.nativeElement.querySelector('#deck-name') as HTMLInputElement;
    setFieldValue(nameInput, '   ');

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Enter a deck name.');
  });

  it('shows card form validation', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([storedDeck()]));

    await configureDeckEditor({ deckId: 'deck-editor-test' });

    const fixture = TestBed.createComponent(DeckEditor);
    fixture.detectChanges();

    const forms = fixture.nativeElement.querySelectorAll('form') as NodeListOf<HTMLFormElement>;
    forms[1].dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Enter the card front.');
    expect(compiled.textContent).toContain('Enter the card back.');
  });

  it('rejects whitespace-only card sides', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([storedDeck()]));

    await configureDeckEditor({ deckId: 'deck-editor-test' });

    const fixture = TestBed.createComponent(DeckEditor);
    fixture.detectChanges();

    const frontInput = fixture.nativeElement.querySelector('#card-front') as HTMLTextAreaElement;
    const backInput = fixture.nativeElement.querySelector('#card-back') as HTMLTextAreaElement;
    setFieldValue(frontInput, '   ');
    setFieldValue(backInput, '   ');

    const forms = fixture.nativeElement.querySelectorAll('form') as NodeListOf<HTMLFormElement>;
    forms[1].dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Enter the card front.');
    expect(compiled.textContent).toContain('Enter the card back.');
  });

  it('keeps dirty deck fields when cards are added', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([storedDeck()]));

    await configureDeckEditor({ deckId: 'deck-editor-test' });

    const fixture = TestBed.createComponent(DeckEditor);
    fixture.detectChanges();

    const nameInput = fixture.nativeElement.querySelector('#deck-name') as HTMLInputElement;
    const descriptionInput = fixture.nativeElement.querySelector(
      '#deck-description',
    ) as HTMLTextAreaElement;
    setFieldValue(nameInput, 'Unsaved deck name');
    setFieldValue(descriptionInput, 'Unsaved deck description');

    const frontInput = fixture.nativeElement.querySelector('#card-front') as HTMLTextAreaElement;
    const backInput = fixture.nativeElement.querySelector('#card-back') as HTMLTextAreaElement;
    setFieldValue(frontInput, 'Question');
    setFieldValue(backInput, 'Answer');

    const forms = fixture.nativeElement.querySelectorAll('form') as NodeListOf<HTMLFormElement>;
    forms[1].dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(nameInput.value).toBe('Unsaved deck name');
    expect(descriptionInput.value).toBe('Unsaved deck description');
  });

  it('deletes a card after Material dialog confirmation', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([storedDeckWithCard()]));

    await configureDeckEditor({ deckId: 'deck-editor-test' });

    const fixture = TestBed.createComponent(DeckEditor);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    buttonByText(compiled, 'Delete').click();
    fixture.detectChanges();
    await fixture.whenStable();

    const dialog = document.body.querySelector('mat-dialog-container') as HTMLElement;
    expect(dialog.textContent).toContain('Delete this card from the deck?');

    expect(buttonByText(dialog, 'Delete')).toBeTruthy();

    TestBed.inject(MatDialog).openDialogs[0].close(true);
    await waitForDialogClose();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(compiled.textContent).toContain('Add at least one card before studying this deck.');
  });

  it('passes axe checks', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([storedDeckWithCard()]));

    await configureDeckEditor({ deckId: 'deck-editor-test' });

    const fixture = TestBed.createComponent(DeckEditor);
    fixture.detectChanges();
    await fixture.whenStable();

    await expectNoAxeViolations(fixture.nativeElement);
  });
});
