import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { DeckStoreService } from '../../../core/deck-store.service';
import type { Flashcard } from '../../../core/flashcard';

type StudyOrder = 'sequential' | 'shuffle';

@Component({
  selector: 'app-study-session',
  imports: [MatButtonModule, MatButtonToggleModule, MatCardModule, MatIconModule, RouterLink],
  templateUrl: './study-session.component.html',
  styleUrl: './study-session.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudySession {
  private readonly deckStore = inject(DeckStoreService);
  private readonly route = inject(ActivatedRoute);

  protected readonly deckId = signal(this.route.snapshot.paramMap.get('deckId') ?? '');
  protected readonly isShuffled = signal(false);
  protected readonly activeIndex = signal(0);
  protected readonly isFlipped = signal(false);
  protected readonly shuffledIds = signal<string[]>([]);
  protected readonly difficultCardIds = signal<ReadonlySet<string>>(new Set<string>());
  protected readonly showDifficultOnly = signal(false);
  protected readonly studyStatusMessage = signal('');
  protected readonly studyOrder = computed<StudyOrder>(() =>
    this.isShuffled() ? 'shuffle' : 'sequential',
  );

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
  protected readonly activeImage = computed(() => {
    const card = this.activeCard();
    return this.isFlipped() ? card?.backImage : card?.frontImage;
  });
  protected readonly activeCardStatus = computed(() => {
    const activeCard = this.activeCard();

    if (!activeCard) {
      return 'No study card is available.';
    }

    return `${this.activeCardPosition()}. ${this.activeSide()} side. ${this.activeSideSummary()}`;
  });
  protected readonly flashcardAriaLabel = computed(() => {
    const nextSide = this.isFlipped() ? 'front' : 'back';

    return `${this.activeCardStatus()} Show ${nextSide} side.`;
  });
  protected readonly liveStatus = computed(
    () => this.studyStatusMessage() || this.activeCardStatus(),
  );
  protected readonly canMoveBack = computed(() => this.activeIndex() > 0);
  protected readonly canMoveForward = computed(
    () => this.activeIndex() < this.studyCards().length - 1,
  );

  protected hasText(value: string | undefined): value is string {
    return typeof value === 'string' && value.trim().length > 0;
  }

  protected toggleFlip(): void {
    this.isFlipped.update((flipped) => !flipped);
    this.announceActiveCard();
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
      this.studyStatusMessage.set(
        wasDifficult ? 'Card unmarked as difficult.' : 'Card marked as difficult.',
      );
      return;
    }

    if (this.difficultCount() === 0) {
      this.showDifficultOnly.set(false);
      this.resetCurrentRun();
      this.studyStatusMessage.set('Difficult-only filter off. No difficult cards remain.');
      return;
    }

    this.clampActiveIndex();
    this.isFlipped.set(false);
    this.announceActiveCard('Card removed from difficult-only run.');
  }

  protected toggleDifficultOnly(): void {
    if (this.difficultCount() === 0) {
      return;
    }

    this.showDifficultOnly.update((showOnly) => !showOnly);
    this.resetCurrentRun();
    this.announceActiveCard(
      this.showDifficultOnly()
        ? `Difficult-only filter on. Showing ${this.studyCards().length} cards.`
        : 'Difficult-only filter off.',
    );
  }

  protected previousCard(): void {
    this.activeIndex.update((index) => Math.max(0, index - 1));
    this.isFlipped.set(false);
    this.announceActiveCard();
  }

  protected nextCard(): void {
    this.activeIndex.update((index) => Math.min(this.studyCards().length - 1, index + 1));
    this.isFlipped.set(false);
    this.announceActiveCard();
  }

  protected setStudyOrder(order: StudyOrder): void {
    if (order === this.studyOrder()) {
      return;
    }

    const shouldShuffle = order === 'shuffle';
    this.isShuffled.set(shouldShuffle);
    this.activeIndex.set(0);
    this.isFlipped.set(false);

    if (shouldShuffle) {
      this.shuffleCurrentSource();
    } else {
      this.shuffledIds.set([]);
    }

    this.announceActiveCard(
      shouldShuffle ? 'Study order set to shuffle.' : 'Study order set to sequential.',
    );
  }

  private activeCardPosition(): string {
    return `Card ${this.activeIndex() + 1} of ${this.studyCards().length}`;
  }

  private activeSideSummary(): string {
    const text = this.activeText();
    const image = this.activeImage();
    const textSummary = this.hasText(text) ? `Text: ${text.trim()}.` : 'No text.';
    const imageSummary = image
      ? this.hasText(image.alt)
        ? `Image: ${image.alt.trim()}.`
        : 'Image has no alt text.'
      : 'No image.';

    return `${textSummary} ${imageSummary}`;
  }

  private announceActiveCard(prefix = ''): void {
    this.studyStatusMessage.set(
      prefix ? `${prefix} ${this.activeCardStatus()}` : this.activeCardStatus(),
    );
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
