import type { Deck } from './deck';
import type { Flashcard } from './flashcard';
import { isFlashcardImage } from './flashcard-image-validation';
import { hasFlashcardSideContent } from './flashcard-side-content';

export function isDeck(value: unknown): value is Deck {
  if (!isRecord(value) || !Array.isArray(value['cards'])) {
    return false;
  }

  return (
    isNonEmptyString(value['id']) &&
    isNonEmptyString(value['name']) &&
    isString(value['description']) &&
    isNonEmptyString(value['createdAt']) &&
    isNonEmptyString(value['updatedAt']) &&
    value['cards'].every(isFlashcard)
  );
}

function isFlashcard(value: unknown): value is Flashcard {
  if (!isRecord(value)) {
    return false;
  }

  const front = value['front'];
  const back = value['back'];
  const frontImage = value['frontImage'];
  const backImage = value['backImage'];

  if (
    !isNonEmptyString(value['id']) ||
    !isString(front) ||
    !isString(back) ||
    !isNonEmptyString(value['createdAt']) ||
    !isNonEmptyString(value['updatedAt'])
  ) {
    return false;
  }

  if (frontImage !== undefined && !isFlashcardImage(frontImage)) {
    return false;
  }

  if (backImage !== undefined && !isFlashcardImage(backImage)) {
    return false;
  }

  return (
    hasFlashcardSideContent(front, frontImage) && hasFlashcardSideContent(back, backImage)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}
