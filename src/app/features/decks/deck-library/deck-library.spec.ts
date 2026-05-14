import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { DeckLibrary } from './deck-library';

describe('DeckLibrary', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('renders an empty state', async () => {
    vi.stubGlobal('confirm', () => true);

    await TestBed.configureTestingModule({
      imports: [DeckLibrary],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(DeckLibrary);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const deleteButton = compiled.querySelector('.button.danger') as HTMLButtonElement;

    deleteButton.click();
    fixture.detectChanges();

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
