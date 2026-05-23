import type { FlashcardImage } from './flashcard-image';

export const FLASHCARD_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_FLASHCARD_IMAGE_DIMENSION = 1200;

const FLASHCARD_IMAGE_MIME_TYPE_SET = new Set<string>(FLASHCARD_IMAGE_MIME_TYPES);

export function isSupportedFlashcardImageMimeType(mimeType: string): boolean {
  return FLASHCARD_IMAGE_MIME_TYPE_SET.has(mimeType);
}

export function isFlashcardImage(value: unknown): value is FlashcardImage {
  if (!isRecord(value) || !isString(value['mimeType'])) {
    return false;
  }

  const mimeType = value['mimeType'];

  return (
    isSupportedFlashcardImageMimeType(mimeType) &&
    isNonEmptyString(value['src']) &&
    value['src'].startsWith(`data:${mimeType};base64,`) &&
    isNonEmptyString(value['alt']) &&
    isNonEmptyString(value['originalName']) &&
    isPositiveDimension(value['width']) &&
    isPositiveDimension(value['height'])
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

function isPositiveDimension(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value > 0 &&
    value <= MAX_FLASHCARD_IMAGE_DIMENSION
  );
}
