import { Routes } from '@angular/router';

export const DECK_ROUTES: Routes = [
  {
    path: '',
    title: 'Deck library',
    loadComponent: () => import('./deck-library/deck-library.component').then((m) => m.DeckLibrary),
  },
  {
    path: 'new',
    title: 'New deck',
    loadComponent: () => import('./deck-editor/deck-editor.component').then((m) => m.DeckEditor),
  },
  {
    path: ':deckId/edit',
    title: 'Edit deck',
    loadComponent: () => import('./deck-editor/deck-editor.component').then((m) => m.DeckEditor),
  },
];
