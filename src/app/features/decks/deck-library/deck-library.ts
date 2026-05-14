import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { ConfirmDialogService } from '../../../core/confirm-dialog';
import { DeckStore } from '../../../core/deck-store';
import { ToastService } from '../../../core/toast';

@Component({
  selector: 'app-deck-library',
  imports: [MatButtonModule, MatCardModule, MatIconModule, RouterLink],
  templateUrl: './deck-library.html',
  styleUrl: './deck-library.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckLibrary {
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly deckStore = inject(DeckStore);
  private readonly toast = inject(ToastService);

  protected readonly decks = this.deckStore.decks;
  protected readonly hasDecks = computed(() => this.decks().length > 0);

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
}
