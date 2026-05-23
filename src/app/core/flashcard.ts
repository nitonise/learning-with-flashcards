import type { FlashcardImage } from './flashcard-image';

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  frontImage?: FlashcardImage;
  backImage?: FlashcardImage;
  createdAt: string;
  updatedAt: string;
}
