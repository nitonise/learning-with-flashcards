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

import { ConfirmDialogService } from '../../../core/confirm-dialog';
import { DeckStore } from '../../../core/deck-store';
import { Flashcard, FlashcardDraft, FlashcardImage } from '../../../core/deck.model';
import { ToastService } from '../../../core/toast';

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const ACCEPTED_IMAGE_TYPE_SET = new Set<string>(ACCEPTED_IMAGE_TYPES);
const MAX_IMAGE_BYTES = 1024 * 1024;
const MAX_IMAGE_DATA_URL_LENGTH = 700 * 1024;
const MAX_IMAGE_DIMENSION = 1200;

type CardSide = 'front' | 'back';

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
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './deck-editor.html',
  styleUrl: './deck-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckEditor {
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly deckStore = inject(DeckStore);
  private readonly formBuilder = inject(FormBuilder);
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
  protected readonly acceptedImageTypes = ACCEPTED_IMAGE_TYPES.join(',');

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

    if (!ACCEPTED_IMAGE_TYPE_SET.has(file.type)) {
      this.setImageError(side, 'Choose a JPEG, PNG, or WebP image.');
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      this.setImageError(side, 'Choose an image smaller than 1 MB.');
      return;
    }

    try {
      const image = await this.processImageFile(file);

      if (!this.isCurrentImageUpload(side, uploadSnapshot)) {
        return;
      }

      if (image.src.length > MAX_IMAGE_DATA_URL_LENGTH) {
        this.setImageError(side, 'Choose a smaller image. Images must stay under 700 KB.');
        return;
      }

      this.setSideImage(side, image);
      this.toast.success('Image added.');
    } catch {
      if (!this.isCurrentImageUpload(side, uploadSnapshot)) {
        return;
      }

      this.setImageError(side, 'This image could not be processed.');
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

  protected async processImageFile(file: File): Promise<FlashcardImage> {
    const originalDataUrl = await this.readDataUrl(file);
    const image = await this.loadImage(originalDataUrl);
    const originalWidth = image.naturalWidth || image.width;
    const originalHeight = image.naturalHeight || image.height;
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(originalWidth, originalHeight));
    const width = Math.max(1, Math.round(originalWidth * scale));
    const height = Math.max(1, Math.round(originalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Canvas is unavailable.');
    }

    context.drawImage(image, 0, 0, width, height);

    const src = canvas.toDataURL(file.type, file.type === 'image/png' ? undefined : 0.82);
    const mimeType = this.mimeTypeFromDataUrl(src);

    if (!ACCEPTED_IMAGE_TYPE_SET.has(mimeType)) {
      throw new Error('Unsupported encoded image type.');
    }

    return {
      src,
      alt: '',
      mimeType,
      originalName: file.name,
      width,
      height,
    };
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

  private readDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.addEventListener('load', () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Image data is unavailable.'));
        }
      });
      reader.addEventListener('error', () => reject(new Error('Image could not be read.')));
      reader.readAsDataURL(file);
    });
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', () => reject(new Error('Image could not be loaded.')));
      image.src = src;
    });
  }

  private mimeTypeFromDataUrl(src: string): string {
    const match = /^data:([^;]+);base64,/.exec(src);

    if (!match) {
      throw new Error('Invalid image data URL.');
    }

    return match[1];
  }
}
