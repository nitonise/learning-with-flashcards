import { Routes } from '@angular/router';

export const STUDY_ROUTES: Routes = [
  {
    path: ':deckId',
    loadComponent: () =>
      import('./study-session/study-session').then((m) => m.StudySession),
  },
];
