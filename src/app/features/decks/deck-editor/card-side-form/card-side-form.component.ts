import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import type { FlashcardImage } from '../../../../core/flashcard-image';

export type CardSide = 'front' | 'back';

@Component({
  selector: 'app-card-side-form',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  templateUrl: './card-side-form.component.html',
  styleUrl: './card-side-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardSideForm {
  readonly side = input.required<CardSide>();
  readonly textControl = input.required<FormControl<string>>();
  readonly imageAltControl = input.required<FormControl<string>>();
  readonly image = input<FlashcardImage | undefined>();
  readonly imageError = input('');
  readonly acceptedImageTypes = input.required<string>();
  readonly imageSelect = output<Event>();
  readonly imageRemove = output<void>();

  protected readonly title = computed(() => (this.side() === 'front' ? 'Front' : 'Back'));
  protected readonly textInputId = computed(() => `card-${this.side()}`);
  protected readonly fileInputId = computed(() => `card-${this.side()}-image`);
  protected readonly fileErrorId = computed(() => `card-${this.side()}-image-error`);
  protected readonly altInputId = computed(() => `card-${this.side()}-image-alt`);

  protected selectImage(event: Event): void {
    this.imageSelect.emit(event);
  }

  protected removeImage(): void {
    this.imageRemove.emit();
  }
}
