import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DeckStore } from '../../../core/deck-store';

@Component({
  selector: 'app-deck-library',
  imports: [RouterLink],
  templateUrl: './deck-library.html',
  styleUrl: './deck-library.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckLibrary {
  private readonly deckStore = inject(DeckStore);

  protected readonly decks = this.deckStore.decks;
  protected readonly hasDecks = computed(() => this.decks().length > 0);

  protected deleteDeck(deckId: string, deckName: string): void {
    const confirmed = globalThis.confirm?.(`Delete "${deckName}" and all of its cards?`) ?? false;

    if (confirmed) {
      this.deckStore.deleteDeck(deckId);
    }
  }
}
