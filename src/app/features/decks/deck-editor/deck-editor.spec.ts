import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { Deck } from '../../../core/deck.model';
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

describe('DeckEditor', () => {
  afterEach(() => {
    localStorage.clear();
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
});
