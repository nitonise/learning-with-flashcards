import { Routes } from '@angular/router';

export const DECK_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./deck-library/deck-library.component').then((m) => m.DeckLibrary),
  },
  {
    path: 'new',
    loadComponent: () => import('./deck-editor/deck-editor.component').then((m) => m.DeckEditor),
  },
  {
    path: ':deckId/edit',
    loadComponent: () => import('./deck-editor/deck-editor.component').then((m) => m.DeckEditor),
  },
];
