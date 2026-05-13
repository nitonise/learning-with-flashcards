import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { DeckStore } from './core/deck-store';
import { ThemeService } from './core/theme';
import { Toast } from './shared/toast/toast';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, Toast],
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
