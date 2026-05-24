import { Injectable } from '@angular/core';

import type { FlashcardImage } from '../../../core/flashcard-image';
import {
  FLASHCARD_IMAGE_MIME_TYPES,
  MAX_FLASHCARD_IMAGE_DIMENSION,
  isSupportedFlashcardImageMimeType,
} from '../../../core/flashcard-image-validation';

export type DeckImageProcessingErrorCode =
  | 'unsupported-type'
  | 'file-too-large'
  | 'data-url-too-large'
  | 'processing-failed';

const MAX_IMAGE_BYTES = 1024 * 1024;
const MAX_IMAGE_DATA_URL_LENGTH = 700 * 1024;

export class DeckImageProcessingError extends Error {
  constructor(readonly code: DeckImageProcessingErrorCode) {
    super(code);
  }
}

@Injectable({
  providedIn: 'root',
})
export class DeckImageProcessorService {
  readonly acceptedImageTypes = FLASHCARD_IMAGE_MIME_TYPES.join(',');

  validateFile(file: File): DeckImageProcessingErrorCode | undefined {
    if (!isSupportedFlashcardImageMimeType(file.type)) {
      return 'unsupported-type';
    }

    if (file.size > MAX_IMAGE_BYTES) {
      return 'file-too-large';
    }

    return undefined;
  }

  async processImageFile(file: File): Promise<FlashcardImage> {
    const validationError = this.validateFile(file);

    if (validationError) {
      throw new DeckImageProcessingError(validationError);
    }

    try {
      const originalDataUrl = await this.readDataUrl(file);
      const image = await this.loadImage(originalDataUrl);
      const originalWidth = image.naturalWidth || image.width;
      const originalHeight = image.naturalHeight || image.height;
      const scale = Math.min(
        1,
        MAX_FLASHCARD_IMAGE_DIMENSION / Math.max(originalWidth, originalHeight),
      );
      const width = Math.max(1, Math.round(originalWidth * scale));
      const height = Math.max(1, Math.round(originalHeight * scale));
      const src = this.resizeImage(image, file.type, width, height);

      if (src.length > MAX_IMAGE_DATA_URL_LENGTH) {
        throw new DeckImageProcessingError('data-url-too-large');
      }

      const mimeType = this.mimeTypeFromDataUrl(src);

      if (!isSupportedFlashcardImageMimeType(mimeType)) {
        throw new DeckImageProcessingError('processing-failed');
      }

      return {
        src,
        alt: '',
        mimeType,
        originalName: file.name,
        width,
        height,
      };
    } catch (error) {
      if (error instanceof DeckImageProcessingError) {
        throw error;
      }

      throw new DeckImageProcessingError('processing-failed');
    }
  }

  private resizeImage(
    image: HTMLImageElement,
    requestedMimeType: string,
    width: number,
    height: number,
  ): string {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Canvas is unavailable.');
    }

    context.drawImage(image, 0, 0, width, height);

    return canvas.toDataURL(
      requestedMimeType,
      requestedMimeType === 'image/png' ? undefined : 0.82,
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
