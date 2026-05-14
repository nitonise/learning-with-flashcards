import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { DeckStore } from '../../../core/deck-store';
import { Flashcard } from '../../../core/deck.model';

@Component({
  selector: 'app-study-session',
  imports: [MatButtonModule, MatButtonToggleModule, MatCardModule, MatIconModule, RouterLink],
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
  protected readonly difficultCardIds = signal<ReadonlySet<string>>(new Set<string>());
  protected readonly showDifficultOnly = signal(false);

  protected readonly deck = computed(() => this.deckStore.deckById(this.deckId()));
  protected readonly orderedCards = computed(() => this.deck()?.cards ?? []);
  protected readonly sourceCards = computed(() => {
    const cards = this.orderedCards();

    if (!this.showDifficultOnly()) {
      return cards;
    }

    const difficultCardIds = this.difficultCardIds();
    return cards.filter((card) => difficultCardIds.has(card.id));
  });
  protected readonly studyCards = computed(() => {
    const cards = this.sourceCards();

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
  protected readonly difficultCount = computed(() => this.difficultCardIds().size);
  protected readonly activeCardIsDifficult = computed(() => {
    const activeCard = this.activeCard();
    return activeCard ? this.difficultCardIds().has(activeCard.id) : false;
  });
  protected readonly activeSide = computed(() => (this.isFlipped() ? 'Back' : 'Front'));
  protected readonly activeText = computed(() => {
    const card = this.activeCard();
    return this.isFlipped() ? card?.back : card?.front;
  });
  protected readonly canMoveBack = computed(() => this.activeIndex() > 0);
  protected readonly canMoveForward = computed(
    () => this.activeIndex() < this.studyCards().length - 1,
  );

  protected toggleFlip(): void {
    this.isFlipped.update((flipped) => !flipped);
  }

  protected toggleActiveCardDifficult(): void {
    const activeCard = this.activeCard();

    if (!activeCard) {
      return;
    }

    const wasDifficult = this.difficultCardIds().has(activeCard.id);

    this.difficultCardIds.update((cardIds) => {
      const nextCardIds = new Set(cardIds);

      if (wasDifficult) {
        nextCardIds.delete(activeCard.id);
      } else {
        nextCardIds.add(activeCard.id);
      }

      return nextCardIds;
    });

    if (!wasDifficult || !this.showDifficultOnly()) {
      return;
    }

    if (this.difficultCount() === 0) {
      this.showDifficultOnly.set(false);
      this.resetCurrentRun();
      return;
    }

    this.clampActiveIndex();
    this.isFlipped.set(false);
  }

  protected toggleDifficultOnly(): void {
    if (this.difficultCount() === 0) {
      return;
    }

    this.showDifficultOnly.update((showOnly) => !showOnly);
    this.resetCurrentRun();
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
      this.shuffleCurrentSource();
    } else {
      this.shuffledIds.set([]);
    }
  }

  private resetCurrentRun(): void {
    this.activeIndex.set(0);
    this.isFlipped.set(false);

    if (this.isShuffled()) {
      this.shuffleCurrentSource();
    }
  }

  private clampActiveIndex(): void {
    const lastIndex = Math.max(0, this.studyCards().length - 1);
    this.activeIndex.update((index) => Math.min(index, lastIndex));
  }

  private shuffleCurrentSource(): void {
    this.shuffledIds.set(this.shuffle(this.sourceCards().map((card) => card.id)));
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
