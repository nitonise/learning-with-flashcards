import { TestBed } from '@angular/core/testing';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Router, provideRouter } from '@angular/router';

import { expectNoAxeViolations } from './test-helpers/a11y';
import { App } from './app.component';
import { routes } from './app.routes';

describe('App', () => {
  let liveAnnouncer: { announce: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    localStorage.clear();
    liveAnnouncer = {
      announce: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes), { provide: LiveAnnouncer, useValue: liveAnnouncer }],
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

  it('renders a skip link and focusable main content target', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const skipLink = compiled.querySelector('.skip-link') as HTMLAnchorElement;
    const main = compiled.querySelector('#main-content') as HTMLElement;

    expect(skipLink).toBeTruthy();
    expect(skipLink.getAttribute('href')).toBe('#main-content');
    expect(skipLink.textContent).toContain('Skip to content');
    expect(main).toBeTruthy();
    expect(main.getAttribute('tabindex')).toBe('-1');
  });

  it('focuses main content and announces route title after navigation', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    await fixture.whenStable();
    fixture.detectChanges();

    await router.navigateByUrl('/decks/new');
    await fixture.whenStable();
    fixture.detectChanges();

    const main = fixture.nativeElement.querySelector('#main-content') as HTMLElement;
    expect(document.activeElement).toBe(main);
    expect(liveAnnouncer.announce).toHaveBeenCalledWith('New deck loaded', 'polite');
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
