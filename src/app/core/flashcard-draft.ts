import type { FlashcardImage } from './flashcard-image';

export interface FlashcardDraft {
  front: string;
  back: string;
  frontImage?: FlashcardImage;
  backImage?: FlashcardImage;
}
