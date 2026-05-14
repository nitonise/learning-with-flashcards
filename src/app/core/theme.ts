import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { OverlayContainer } from '@angular/cdk/overlay';
import { computed, effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

const storageKey = 'flashcards.theme';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly overlayContainer = inject(OverlayContainer, { optional: true });
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly selectedTheme = signal<Theme>(this.getInitialTheme());

  readonly theme = this.selectedTheme.asReadonly();
  readonly isDark = computed(() => this.theme() === 'dark');

  constructor() {
    effect(() => {
      const theme = this.theme();

      this.document.documentElement.setAttribute('data-theme', theme);
      this.document.documentElement.style.colorScheme = theme;
      this.syncOverlayTheme(theme);
      this.storeTheme(theme);
    });
  }

  toggleTheme(): void {
    this.selectedTheme.update((theme) => (theme === 'dark' ? 'light' : 'dark'));
  }

  private getInitialTheme(): Theme {
    const storedTheme = this.getStoredTheme();

    if (storedTheme !== null) {
      return storedTheme;
    }

    if (this.prefersDarkTheme()) {
      return 'dark';
    }

    return 'light';
  }

  private getStoredTheme(): Theme | null {
    if (!this.isBrowser) {
      return null;
    }

    try {
      const storedTheme = localStorage.getItem(storageKey);

      return isTheme(storedTheme) ? storedTheme : null;
    } catch {
      return null;
    }
  }

  private storeTheme(theme: Theme): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      localStorage.setItem(storageKey, theme);
    } catch {
      return;
    }
  }

  private syncOverlayTheme(theme: Theme): void {
    if (!this.isBrowser || !this.overlayContainer) {
      return;
    }

    const overlayElement = this.overlayContainer.getContainerElement();
    overlayElement.setAttribute('data-theme', theme);
    overlayElement.style.colorScheme = theme;
  }

  private prefersDarkTheme(): boolean {
    return (
      this.isBrowser &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  }
}

function isTheme(theme: string | null): theme is Theme {
  return theme === 'light' || theme === 'dark';
}
