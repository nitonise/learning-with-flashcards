import { TestBed } from '@angular/core/testing';

import { DeckImageProcessorService } from './deck-image-processor.service';

describe('DeckImageProcessorService', () => {
  let service: DeckImageProcessorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DeckImageProcessorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('exposes the image types accepted by the file input', () => {
    expect(service.acceptedImageTypes).toBe('image/jpeg,image/png,image/webp');
  });

  it('rejects unsupported image types before processing', async () => {
    const file = new File(['notes'], 'notes.txt', { type: 'text/plain' });

    expect(service.validateFile(file)).toBe('unsupported-type');
    await expect(service.processImageFile(file)).rejects.toMatchObject({
      code: 'unsupported-type',
    });
  });

  it('rejects oversized uploads before processing', async () => {
    const file = new File([new Uint8Array(1024 * 1024 + 1)], 'large.png', {
      type: 'image/png',
    });

    expect(service.validateFile(file)).toBe('file-too-large');
    await expect(service.processImageFile(file)).rejects.toMatchObject({
      code: 'file-too-large',
    });
  });
});
