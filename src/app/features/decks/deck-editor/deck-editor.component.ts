import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ConfirmDialogService } from '../../../core/confirm-dialog.service';
import { DeckStoreService } from '../../../core/deck-store.service';
import type { Flashcard } from '../../../core/flashcard';
import type { FlashcardDraft } from '../../../core/flashcard-draft';
import type { FlashcardImage } from '../../../core/flashcard-image';
import { ToastService } from '../../../core/toast.service';
import { CardSideForm, type CardSide } from './card-side-form/card-side-form.component';
import {
  DeckImageProcessingError,
  type DeckImageProcessingErrorCode,
  DeckImageProcessorService,
} from './deck-image-processor.service';

function imageProcessingErrorCode(error: unknown): DeckImageProcessingErrorCode {
  return error instanceof DeckImageProcessingError ? error.code : 'processing-failed';
}

function imageProcessingErrorMessage(code: DeckImageProcessingErrorCode): string {
  switch (code) {
    case 'unsupported-type':
      return 'Choose a JPEG, PNG, or WebP image.';
    case 'file-too-large':
      return 'Choose an image smaller than 1 MB.';
    case 'data-url-too-large':
      return 'Choose a smaller image. Images must stay under 700 KB.';
    case 'processing-failed':
      return 'This image could not be processed.';
  }

  return 'This image could not be processed.';
}

interface ImageUploadSnapshot {
  token: number;
  deckId: string | null;
  editingCardId: string | null;
}

interface CardFormValue {
  front: string;
  frontImageAlt: string;
  back: string;
  backImageAlt: string;
}

const trimmedRequired: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;

  return typeof value === 'string' && value.trim().length > 0 ? null : { required: true };
};

function sideContentRequired(image: () => FlashcardImage | undefined): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const hasText = typeof control.value === 'string' && control.value.trim().length > 0;

    return hasText || image() ? null : { required: true };
  };
}

function imageAltRequired(image: () => FlashcardImage | undefined): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!image()) {
      return null;
    }

    return typeof control.value === 'string' && control.value.trim().length > 0
      ? null
      : { required: true };
  };
}

@Component({
  selector: 'app-deck-editor',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    CardSideForm,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './deck-editor.component.html',
  styleUrl: './deck-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckEditor {
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly deckStore = inject(DeckStoreService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly imageProcessor = inject(DeckImageProcessorService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly imageUploadTokens: Record<CardSide, number> = {
    front: 0,
    back: 0,
  };

  protected readonly deckId = signal(this.route.snapshot.paramMap.get('deckId'));
  protected readonly editingCardId = signal<string | null>(null);
  protected readonly deck = computed(() => {
    const id = this.deckId();
    return id ? this.deckStore.deckById(id) : undefined;
  });
  protected readonly isNewDeck = computed(() => this.deckId() === null);
  protected readonly cards = computed(() => this.deck()?.cards ?? []);
  protected readonly hasCards = computed(() => this.cards().length > 0);
  protected readonly canStudyDeck = computed(() => !this.isNewDeck() && this.hasCards());
  protected readonly cardBeingEdited = computed(() => {
    const cardId = this.editingCardId();
    return this.cards().find((card) => card.id === cardId);
  });
  protected readonly frontImage = signal<FlashcardImage | undefined>(undefined);
  protected readonly backImage = signal<FlashcardImage | undefined>(undefined);
  protected readonly frontImageError = signal('');
  protected readonly backImageError = signal('');
  protected readonly acceptedImageTypes = this.imageProcessor.acceptedImageTypes;

  protected readonly deckForm = this.formBuilder.nonNullable.group({
    name: ['', [trimmedRequired]],
    description: [''],
  });
  protected readonly cardForm = this.formBuilder.nonNullable.group({
    front: ['', [sideContentRequired(() => this.frontImage())]],
    frontImageAlt: ['', [imageAltRequired(() => this.frontImage())]],
    back: ['', [sideContentRequired(() => this.backImage())]],
    backImageAlt: ['', [imageAltRequired(() => this.backImage())]],
  });

  constructor() {
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
  }

  protected saveDeck(): void {
    this.deckForm.markAllAsTouched();

    if (this.deckForm.invalid) {
      return;
    }

    const value = this.deckForm.getRawValue();
    const deckId = this.deckId();

    if (deckId) {
      if (!this.deckStore.updateDeck(deckId, value)) {
        this.toast.warning('Deck changes could not be saved.');
        return;
      }

      this.toast.success('Deck changes saved.');
      return;
    }

    const deck = this.deckStore.createDeck(value.name, value.description);
    if (!deck) {
      this.toast.warning('Deck could not be created.');
      return;
    }

    this.toast.success('Deck created.');
    void this.router.navigate(['/decks', deck.id, 'edit']);
  }

  protected saveCard(): void {
    this.cardForm.markAllAsTouched();
    this.cardForm.updateValueAndValidity();

    if (this.cardForm.invalid) {
      return;
    }

    const deckId = this.deckId();

    if (!deckId) {
      return;
    }

    const value = this.cardForm.getRawValue();
    const cardDraft = this.createCardDraft(value);
    const editingCardId = this.editingCardId();

    if (editingCardId) {
      if (!this.deckStore.updateCard(deckId, editingCardId, cardDraft)) {
        this.toast.warning('Card changes could not be saved.');
        return;
      }

      this.toast.success('Card changes saved.');
    } else {
      const card = this.deckStore.addCard(deckId, cardDraft);
      if (!card) {
        this.toast.warning('Card could not be created.');
        return;
      }

      this.toast.success('Card created.');
    }

    this.cancelCardEdit();
  }

  protected editCard(card: Flashcard): void {
    this.invalidateImageUploads();
    this.editingCardId.set(card.id);
    this.frontImage.set(card.frontImage);
    this.backImage.set(card.backImage);
    this.frontImageError.set('');
    this.backImageError.set('');
    this.cardForm.setValue({
      front: card.front,
      frontImageAlt: card.frontImage?.alt ?? '',
      back: card.back,
      backImageAlt: card.backImage?.alt ?? '',
    });
    this.cardForm.updateValueAndValidity();
  }

  protected cancelCardEdit(): void {
    this.invalidateImageUploads();
    this.editingCardId.set(null);
    this.frontImage.set(undefined);
    this.backImage.set(undefined);
    this.frontImageError.set('');
    this.backImageError.set('');
    this.cardForm.reset({
      front: '',
      frontImageAlt: '',
      back: '',
      backImageAlt: '',
    });
    this.cardForm.updateValueAndValidity();
  }

  protected async selectImage(side: CardSide, event: Event): Promise<void> {
    const input = event.target;

    if (!(input instanceof HTMLInputElement) || !input.files?.length) {
      return;
    }

    const file = input.files[0];
    input.value = '';
    const uploadSnapshot = this.startImageUpload(side);
    this.setImageError(side, '');
    const validationError = this.imageProcessor.validateFile(file);

    if (validationError) {
      this.setImageError(side, imageProcessingErrorMessage(validationError));
      return;
    }

    try {
      const image = await this.imageProcessor.processImageFile(file);

      if (!this.isCurrentImageUpload(side, uploadSnapshot)) {
        return;
      }

      this.setSideImage(side, image);
      this.toast.success('Image added.');
    } catch (error) {
      if (!this.isCurrentImageUpload(side, uploadSnapshot)) {
        return;
      }

      this.setImageError(side, imageProcessingErrorMessage(imageProcessingErrorCode(error)));
    }
  }

  protected removeImage(side: CardSide): void {
    this.bumpImageUploadToken(side);
    this.setSideImage(side, undefined);
  }

  protected hasText(value: string): boolean {
    return value.trim().length > 0;
  }

  protected deleteCard(card: Flashcard): void {
    const deckId = this.deckId();

    if (!deckId) {
      return;
    }

    this.confirmDialog
      .confirm({
        title: 'Delete card?',
        message: 'Delete this card from the deck?',
        confirmLabel: 'Delete',
        tone: 'danger',
      })
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        if (!this.deckStore.deleteCard(deckId, card.id)) {
          this.toast.warning('Card could not be deleted.');
          return;
        }

        this.toast.success('Card deleted.');
        if (this.editingCardId() === card.id) {
          this.cancelCardEdit();
        }
      });
  }

  private createCardDraft(value: CardFormValue): FlashcardDraft {
    return {
      front: value.front,
      back: value.back,
      frontImage: this.imageWithAlt(this.frontImage(), value.frontImageAlt),
      backImage: this.imageWithAlt(this.backImage(), value.backImageAlt),
    };
  }

  private imageWithAlt(
    image: FlashcardImage | undefined,
    alt: string,
  ): FlashcardImage | undefined {
    return image ? { ...image, alt: alt.trim() } : undefined;
  }

  private setSideImage(side: CardSide, image: FlashcardImage | undefined): void {
    const imageSignal = side === 'front' ? this.frontImage : this.backImage;
    const altControl =
      side === 'front' ? this.cardForm.controls.frontImageAlt : this.cardForm.controls.backImageAlt;
    const textControl = side === 'front' ? this.cardForm.controls.front : this.cardForm.controls.back;

    imageSignal.set(image);
    altControl.setValue(image?.alt ?? '');
    textControl.updateValueAndValidity();
    altControl.updateValueAndValidity();
  }

  private setImageError(side: CardSide, message: string): void {
    if (side === 'front') {
      this.frontImageError.set(message);
    } else {
      this.backImageError.set(message);
    }
  }

  private startImageUpload(side: CardSide): ImageUploadSnapshot {
    return {
      token: this.bumpImageUploadToken(side),
      deckId: this.deckId(),
      editingCardId: this.editingCardId(),
    };
  }

  private bumpImageUploadToken(side: CardSide): number {
    this.imageUploadTokens[side] += 1;
    return this.imageUploadTokens[side];
  }

  private invalidateImageUploads(): void {
    this.bumpImageUploadToken('front');
    this.bumpImageUploadToken('back');
  }

  private isCurrentImageUpload(side: CardSide, snapshot: ImageUploadSnapshot): boolean {
    return (
      this.imageUploadTokens[side] === snapshot.token &&
      this.deckId() === snapshot.deckId &&
      this.editingCardId() === snapshot.editingCardId
    );
  }
}
