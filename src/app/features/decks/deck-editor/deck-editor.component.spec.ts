import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import type { Deck } from '../../../core/deck';
import type { FlashcardImage } from '../../../core/flashcard-image';
import { expectNoAxeViolations } from '../../../test-helpers/a11y';
import { DeckEditor } from './deck-editor.component';

const STORAGE_KEY = 'learning-with-flashcards.decks';

interface DeckEditorTestApi {
  selectImage: (side: 'front' | 'back', event: Event) => Promise<void>;
  processImageFile: (file: File) => Promise<FlashcardImage>;
  cancelCardEdit: () => void;
}

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
}

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

function testImage(originalName = 'diagram.png'): FlashcardImage {
  return {
    src: 'data:image/png;base64,aW1hZ2U=',
    alt: 'Plant cell diagram',
    mimeType: 'image/png',
    originalName,
    width: 640,
    height: 480,
  };
}

function storedDeckWithImageCard(): Deck {
  const now = '2026-01-01T00:00:00.000Z';

  return {
    ...storedDeck(),
    cards: [
      {
        id: 'card-editor-test',
        front: '',
        frontImage: testImage('front.png'),
        back: 'Answer',
        backImage: testImage('back.png'),
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

function fileInputEvent(file: File): Event {
  const input = document.createElement('input');
  Object.defineProperty(input, 'files', {
    value: [file],
  });

  return { target: input } as unknown as Event;
}

function deferred<T>(): Deferred<T> {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });

  return { promise, resolve };
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
    expect(compiled.textContent).toContain('Add front text or a front image.');
    expect(compiled.textContent).toContain('Add back text or a back image.');
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
    expect(compiled.textContent).toContain('Add front text or a front image.');
    expect(compiled.textContent).toContain('Add back text or a back image.');
  });

  it('requires alt text when an uploaded image is attached', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([storedDeck()]));

    await configureDeckEditor({ deckId: 'deck-editor-test' });

    const fixture = TestBed.createComponent(DeckEditor);
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as DeckEditorTestApi;
    vi.spyOn(component, 'processImageFile').mockResolvedValue({
      ...testImage('uploaded.png'),
      alt: '',
    });

    const frontInput = fixture.nativeElement.querySelector('#card-front') as HTMLTextAreaElement;
    const backInput = fixture.nativeElement.querySelector('#card-back') as HTMLTextAreaElement;
    setFieldValue(frontInput, '');
    setFieldValue(backInput, 'Answer');

    await component.selectImage(
      'front',
      fileInputEvent(new File(['image'], 'uploaded.png', { type: 'image/png' })),
    );
    fixture.detectChanges();

    const forms = fixture.nativeElement.querySelectorAll('form') as NodeListOf<HTMLFormElement>;
    forms[1].dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Enter alt text for the front image.');
  });

  it('shows a validation message for unsupported image uploads', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([storedDeck()]));

    await configureDeckEditor({ deckId: 'deck-editor-test' });

    const fixture = TestBed.createComponent(DeckEditor);
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as DeckEditorTestApi;

    await component.selectImage(
      'front',
      fileInputEvent(new File(['text'], 'notes.txt', { type: 'text/plain' })),
    );
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Choose a JPEG, PNG, or WebP image.');
  });

  it('shows a validation message for oversized image uploads', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([storedDeck()]));

    await configureDeckEditor({ deckId: 'deck-editor-test' });

    const fixture = TestBed.createComponent(DeckEditor);
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as DeckEditorTestApi;
    const processImageFile = vi.spyOn(component, 'processImageFile');

    await component.selectImage(
      'front',
      fileInputEvent(
        new File([new Uint8Array(1024 * 1024 + 1)], 'large.png', { type: 'image/png' }),
      ),
    );
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Choose an image smaller than 1 MB.');
    expect(processImageFile).not.toHaveBeenCalled();
  });

  it('shows a validation message when processed image data is too large to persist', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([storedDeck()]));

    await configureDeckEditor({ deckId: 'deck-editor-test' });

    const fixture = TestBed.createComponent(DeckEditor);
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as DeckEditorTestApi;
    vi.spyOn(component, 'processImageFile').mockResolvedValue({
      ...testImage('large.png'),
      src: `data:image/png;base64,${'a'.repeat(700 * 1024 + 1)}`,
    });

    await component.selectImage(
      'front',
      fileInputEvent(new File(['image'], 'large.png', { type: 'image/png' })),
    );
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Choose a smaller image.');
    expect(compiled.textContent).not.toContain('large.png');
  });

  it('ignores stale image processing results after a newer image is selected', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([storedDeck()]));

    await configureDeckEditor({ deckId: 'deck-editor-test' });

    const fixture = TestBed.createComponent(DeckEditor);
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as DeckEditorTestApi;
    const firstUpload = deferred<FlashcardImage>();
    const secondUpload = deferred<FlashcardImage>();
    vi.spyOn(component, 'processImageFile')
      .mockReturnValueOnce(firstUpload.promise)
      .mockReturnValueOnce(secondUpload.promise);

    const firstSelection = component.selectImage(
      'front',
      fileInputEvent(new File(['first'], 'first.png', { type: 'image/png' })),
    );
    const secondSelection = component.selectImage(
      'front',
      fileInputEvent(new File(['second'], 'second.png', { type: 'image/png' })),
    );

    secondUpload.resolve(testImage('second.png'));
    await secondSelection;
    firstUpload.resolve(testImage('first.png'));
    await firstSelection;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('second.png');
    expect(compiled.textContent).not.toContain('first.png');
  });

  it('ignores image processing results after the composer is reset', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([storedDeck()]));

    await configureDeckEditor({ deckId: 'deck-editor-test' });

    const fixture = TestBed.createComponent(DeckEditor);
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as DeckEditorTestApi;
    const upload = deferred<FlashcardImage>();
    vi.spyOn(component, 'processImageFile').mockReturnValue(upload.promise);

    const selection = component.selectImage(
      'front',
      fileInputEvent(new File(['image'], 'stale.png', { type: 'image/png' })),
    );
    component.cancelCardEdit();
    upload.resolve(testImage('stale.png'));
    await selection;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('stale.png');
  });

  it('edits an existing card with images and removes an image', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([storedDeckWithImageCard()]));

    await configureDeckEditor({ deckId: 'deck-editor-test' });

    const fixture = TestBed.createComponent(DeckEditor);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    buttonByText(compiled, 'Edit').click();
    fixture.detectChanges();

    const frontAltInput = fixture.nativeElement.querySelector(
      '#card-front-image-alt',
    ) as HTMLInputElement;
    expect(frontAltInput.value).toBe('Plant cell diagram');

    buttonByText(compiled, 'Remove front image').click();
    fixture.detectChanges();

    const frontInput = fixture.nativeElement.querySelector('#card-front') as HTMLTextAreaElement;
    setFieldValue(frontInput, 'Question');

    const forms = fixture.nativeElement.querySelectorAll('form') as NodeListOf<HTMLFormElement>;
    forms[1].dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as Deck[];
    expect(stored[0].cards[0].front).toBe('Question');
    expect(stored[0].cards[0].frontImage).toBeUndefined();
    expect(stored[0].cards[0].backImage?.alt).toBe('Plant cell diagram');
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
