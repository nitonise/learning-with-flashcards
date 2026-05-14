import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { expectNoAxeViolations } from './test-helpers/a11y';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the flashcards shell', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.brand-title')?.textContent).toContain('Flashcards');
    expect(compiled.querySelector('nav')?.textContent).toContain('Library');
  });

  it('passes axe checks for the shell', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    fixture.detectChanges();

    await expectNoAxeViolations(fixture.nativeElement);
  });

  it('should toggle the app theme', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const toggle = compiled.querySelector('.theme-toggle') as HTMLButtonElement;

    expect(toggle).toBeTruthy();
    expect(toggle.getAttribute('aria-label')).toBe('Switch to dark theme');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    toggle.click();
    fixture.detectChanges();

    expect(toggle.getAttribute('aria-label')).toBe('Switch to light theme');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('flashcards.theme')).toBe('dark');
  });
});
