import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Title } from '@angular/platform-browser';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { DeckStoreService } from './core/deck-store.service';
import { ThemeService } from './core/theme.service';

@Component({
  selector: 'app-root',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly deckStore = inject(DeckStoreService);
  private readonly liveAnnouncer = inject(LiveAnnouncer);
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  protected readonly themeService = inject(ThemeService);
  private readonly mainContent = viewChild<ElementRef<HTMLElement>>('mainContent');

  protected readonly deckCount = computed(() => this.deckStore.decks().length);
  protected readonly cardCount = this.deckStore.totalCards;

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.focusMainContent();
        void this.liveAnnouncer.announce(`${this.activePageTitle()} loaded`, 'polite');
      });
  }

  private focusMainContent(): void {
    this.mainContent()?.nativeElement.focus({ preventScroll: true });
  }

  private activePageTitle(): string {
    let route = this.router.routerState.snapshot.root;

    while (route.firstChild) {
      route = route.firstChild;
    }

    return (route.title ?? this.title.getTitle()) || 'Flashcards';
  }
}
