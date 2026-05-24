import type { FlashcardImage } from './flashcard-image';

export function hasFlashcardSideContent(text: string, image: FlashcardImage | undefined): boolean {
  return text.trim().length > 0 || image !== undefined;
}
