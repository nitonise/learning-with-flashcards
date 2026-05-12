import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'decks',
  },
  {
    path: 'decks',
    loadChildren: () => import('./features/decks/deck.routes').then((m) => m.DECK_ROUTES),
  },
  {
    path: 'study',
    loadChildren: () => import('./features/study/study.routes').then((m) => m.STUDY_ROUTES),
  },
  {
    path: '**',
    redirectTo: 'decks',
  },
];
