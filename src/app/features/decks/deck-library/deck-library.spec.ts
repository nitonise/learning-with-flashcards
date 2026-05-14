import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';

import { expectNoAxeViolations } from '../../../test-helpers/a11y';
import { DeckLibrary } from './deck-library';

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

  it('passes axe checks', async () => {
    const fixture = TestBed.createComponent(DeckLibrary);
    fixture.detectChanges();
    await fixture.whenStable();

    await expectNoAxeViolations(fixture.nativeElement);
  });
});
