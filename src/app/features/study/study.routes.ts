import { Routes } from '@angular/router';

export const STUDY_ROUTES: Routes = [
  {
    path: ':deckId',
    title: 'Study deck',
    loadComponent: () =>
      import('./study-session/study-session.component').then((m) => m.StudySession),
  },
];
