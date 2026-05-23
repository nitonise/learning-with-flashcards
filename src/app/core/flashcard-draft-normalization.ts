import type { FlashcardDraft } from './flashcard-draft';
import type { FlashcardImage } from './flashcard-image';
import { isFlashcardImage } from './flashcard-image-validation';
import { hasFlashcardSideContent } from './flashcard-side-content';

export function normalizeFlashcardDraft(draft: FlashcardDraft): FlashcardDraft | undefined {
  const normalized: FlashcardDraft = {
    front: draft.front.trim(),
    back: draft.back.trim(),
    frontImage: normalizeImage(draft.frontImage),
    backImage: normalizeImage(draft.backImage),
  };

  if (normalized.frontImage !== undefined && !isFlashcardImage(normalized.frontImage)) {
    return undefined;
  }

  if (normalized.backImage !== undefined && !isFlashcardImage(normalized.backImage)) {
    return undefined;
  }

  if (!hasFlashcardSideContent(normalized.front, normalized.frontImage)) {
    return undefined;
  }

  if (!hasFlashcardSideContent(normalized.back, normalized.backImage)) {
    return undefined;
  }

  return normalized;
}

function normalizeImage(image: FlashcardImage | undefined): FlashcardImage | undefined {
  if (!image) {
    return undefined;
  }

  return {
    ...image,
    alt: image.alt.trim(),
    originalName: image.originalName.trim(),
  };
}
