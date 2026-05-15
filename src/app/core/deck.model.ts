export interface FlashcardImage {
  src: string;
  alt: string;
  mimeType: string;
  originalName: string;
  width: number;
  height: number;
}

export interface FlashcardDraft {
  front: string;
  back: string;
  frontImage?: FlashcardImage;
  backImage?: FlashcardImage;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  frontImage?: FlashcardImage;
  backImage?: FlashcardImage;
  createdAt: string;
  updatedAt: string;
}

export interface Deck {
  id: string;
  name: string;
  description: string;
  cards: Flashcard[];
  createdAt: string;
  updatedAt: string;
}
