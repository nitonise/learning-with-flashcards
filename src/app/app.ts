import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { DeckStore } from './core/deck-store';
import { ThemeService } from './core/theme';

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
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly deckStore = inject(DeckStore);
  protected readonly themeService = inject(ThemeService);

  protected readonly deckCount = computed(() => this.deckStore.decks().length);
  protected readonly cardCount = this.deckStore.totalCards;
}
