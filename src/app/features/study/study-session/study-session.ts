import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { DeckStore } from '../../../core/deck-store';
import { Flashcard } from '../../../core/deck.model';

@Component({
  selector: 'app-study-session',
  imports: [RouterLink],
  templateUrl: './study-session.html',
  styleUrl: './study-session.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudySession {
  private readonly deckStore = inject(DeckStore);
  private readonly route = inject(ActivatedRoute);

  protected readonly deckId = signal(this.route.snapshot.paramMap.get('deckId') ?? '');
  protected readonly isShuffled = signal(false);
  protected readonly activeIndex = signal(0);
  protected readonly isFlipped = signal(false);
  protected readonly shuffledIds = signal<string[]>([]);

  protected readonly deck = computed(() => this.deckStore.deckById(this.deckId()));
  protected readonly orderedCards = computed(() => this.deck()?.cards ?? []);
  protected readonly studyCards = computed(() => {
    const cards = this.orderedCards();

    if (!this.isShuffled()) {
      return cards;
    }

    const cardById = new Map(cards.map((card) => [card.id, card] as const));
    const shuffledCards = this.shuffledIds()
      .map((id) => cardById.get(id))
      .filter((card): card is Flashcard => card !== undefined);

    return shuffledCards.length === cards.length ? shuffledCards : cards;
  });
  protected readonly activeCard = computed(() => this.studyCards()[this.activeIndex()]);
  protected readonly activeSide = computed(() => (this.isFlipped() ? 'Back' : 'Front'));
  protected readonly activeText = computed(() => {
    const card = this.activeCard();
    return this.isFlipped() ? card?.back : card?.front;
  });
  protected readonly canMoveBack = computed(() => this.activeIndex() > 0);
  protected readonly canMoveForward = computed(() => this.activeIndex() < this.studyCards().length - 1);

  protected toggleFlip(): void {
    this.isFlipped.update((flipped) => !flipped);
  }

  protected previousCard(): void {
    this.activeIndex.update((index) => Math.max(0, index - 1));
    this.isFlipped.set(false);
  }

  protected nextCard(): void {
    this.activeIndex.update((index) => Math.min(this.studyCards().length - 1, index + 1));
    this.isFlipped.set(false);
  }

  protected toggleShuffle(): void {
    const wasShuffled = this.isShuffled();
    this.isShuffled.set(!wasShuffled);
    this.activeIndex.set(0);
    this.isFlipped.set(false);

    if (!wasShuffled) {
      this.shuffledIds.set(this.shuffle(this.orderedCards().map((card) => card.id)));
    }
  }

  private shuffle(cardIds: string[]): string[] {
    const nextIds = [...cardIds];

    for (let index = nextIds.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      const current = nextIds[index];
      nextIds[index] = nextIds[swapIndex];
      nextIds[swapIndex] = current;
    }

    return nextIds;
  }
}
