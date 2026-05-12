import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { DeckStore } from '../../../core/deck-store';
import { Flashcard } from '../../../core/deck.model';

@Component({
  selector: 'app-deck-editor',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './deck-editor.html',
  styleUrl: './deck-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckEditor {
  private readonly deckStore = inject(DeckStore);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly deckId = signal(this.route.snapshot.paramMap.get('deckId'));
  protected readonly editingCardId = signal<string | null>(null);
  protected readonly deck = computed(() => {
    const id = this.deckId();
    return id ? this.deckStore.deckById(id) : undefined;
  });
  protected readonly isNewDeck = computed(() => this.deckId() === null);
  protected readonly cardBeingEdited = computed(() => {
    const cardId = this.editingCardId();
    return this.deck()?.cards.find((card) => card.id === cardId);
  });

  protected readonly deckForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required]],
    description: [''],
  });
  protected readonly cardForm = this.formBuilder.nonNullable.group({
    front: ['', [Validators.required]],
    back: ['', [Validators.required]],
  });

  constructor() {
    effect(() => {
      const deck = this.deck();

      if (deck) {
        this.deckForm.setValue(
          {
            name: deck.name,
            description: deck.description,
          },
          { emitEvent: false },
        );
      }
    });
  }

  protected saveDeck(): void {
    this.deckForm.markAllAsTouched();

    if (this.deckForm.invalid) {
      return;
    }

    const value = this.deckForm.getRawValue();
    const deckId = this.deckId();

    if (deckId) {
      this.deckStore.updateDeck(deckId, value);
      return;
    }

    const deck = this.deckStore.createDeck(value.name, value.description);
    void this.router.navigate(['/decks', deck.id, 'edit']);
  }

  protected saveCard(): void {
    this.cardForm.markAllAsTouched();

    if (this.cardForm.invalid) {
      return;
    }

    const deckId = this.deckId();

    if (!deckId) {
      return;
    }

    const value = this.cardForm.getRawValue();
    const editingCardId = this.editingCardId();

    if (editingCardId) {
      this.deckStore.updateCard(deckId, editingCardId, value.front, value.back);
    } else {
      this.deckStore.addCard(deckId, value.front, value.back);
    }

    this.cancelCardEdit();
  }

  protected editCard(card: Flashcard): void {
    this.editingCardId.set(card.id);
    this.cardForm.setValue({
      front: card.front,
      back: card.back,
    });
  }

  protected cancelCardEdit(): void {
    this.editingCardId.set(null);
    this.cardForm.reset({
      front: '',
      back: '',
    });
  }

  protected deleteCard(card: Flashcard): void {
    const deckId = this.deckId();
    const confirmed = globalThis.confirm?.('Delete this card?') ?? false;

    if (deckId && confirmed) {
      this.deckStore.deleteCard(deckId, card.id);
      if (this.editingCardId() === card.id) {
        this.cancelCardEdit();
      }
    }
  }
}
