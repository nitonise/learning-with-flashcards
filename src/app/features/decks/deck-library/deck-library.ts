import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';

import { ConfirmDialogService } from '../../../core/confirm-dialog';
import { DeckStore } from '../../../core/deck-store';
import { ToastService } from '../../../core/toast';

@Component({
  selector: 'app-deck-library',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    RouterLink,
  ],
  templateUrl: './deck-library.html',
  styleUrl: './deck-library.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckLibrary {
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly deckStore = inject(DeckStore);
  private readonly toast = inject(ToastService);

  protected readonly decks = this.deckStore.decks;
  protected readonly searchQuery = signal('');
  protected readonly hasDecks = computed(() => this.decks().length > 0);
  protected readonly filteredDecks = computed(() => {
    const query = this.searchQuery().trim().toLocaleLowerCase();

    if (!query) {
      return this.decks();
    }

    return this.decks().filter((deck) => deck.name.toLocaleLowerCase().includes(query));
  });
  protected readonly hasFilteredDecks = computed(() => this.filteredDecks().length > 0);
  protected readonly resultCountText = computed(() => {
    const filteredCount = this.filteredDecks().length;
    const totalCount = this.decks().length;

    if (!this.searchQuery().trim()) {
      return `Showing ${totalCount} ${this.deckLabel(totalCount)}.`;
    }

    return `Showing ${filteredCount} of ${totalCount} ${this.deckLabel(totalCount)}.`;
  });

  protected updateSearchQuery(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  protected clearSearchQuery(): void {
    this.searchQuery.set('');
  }

  protected deleteDeck(deckId: string, deckName: string): void {
    this.confirmDialog
      .confirm({
        title: 'Delete deck?',
        message: `Delete "${deckName}" and all of its cards?`,
        confirmLabel: 'Delete',
        tone: 'danger',
      })
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.deckStore.deleteDeck(deckId);
        this.toast.success('Deck deleted.');
      });
  }

  private deckLabel(count: number): string {
    return count === 1 ? 'deck' : 'decks';
  }
}
