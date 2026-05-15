# Learning with Flashcards

Learning with Flashcards is a local-first Angular study workspace for creating flashcard decks,
adding text or image-backed cards, and running focused study sessions in the browser.

The app stores data locally with `localStorage`. It ships with a small starter deck on first load
and does not require an account, backend service, or network connection after installation.

## Features

- **Deck library:** Browse saved decks, search by deck title, see card totals, and create, edit, or
  delete decks.
- **Deck editor:** Manage deck name and description, add or edit cards, delete cards, attach front
  and back images, and require alt text for attached images.
- **Image handling:** Accepts JPEG, PNG, and WebP uploads, resizes images to safe dimensions, and
  enforces local storage-friendly size limits before saving.
- **Study sessions:** Flip cards, move previous or next, shuffle the current run, mark difficult
  cards, switch to difficult-only review, and render card images with saved alt text.
- **Local persistence:** Uses a typed `DeckStore` service to normalize and validate stored decks,
  recover from invalid storage payloads, and preserve intentional empty libraries.
- **Theme preference:** Supports light and dark themes and persists the selected theme locally.

## Technical Approach

- Angular 21 application with standalone components, lazy feature routes, separate templates and
  styles, and `ChangeDetectionStrategy.OnPush`.
- Signal-based state with `signal()` and `computed()` for local UI state and derived deck data.
- Reactive Forms for deck and card editing, including validation for required text or image content
  and image alt text.
- Angular Material components and Material Icons for the shell, forms, cards, dialogs, snackbars,
  buttons, and study controls.
- Local state architecture built around typed domain models, `DeckStore`, validation,
  normalization, and browser storage.
- Accessibility coverage uses semantic markup, ARIA labels, keyboard-friendly controls, WCAG-aware
  color themes, axe checks, Vitest, and Angular TestBed.

## Getting Started

Install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm start
```

You can also run the Angular CLI directly:

```bash
ng serve
```

Open `http://localhost:4200/` after the dev server starts.

## Build

Create a production build:

```bash
npm run build
```

Build output is written to `dist/`.

## Test

Run the unit and accessibility test suite once:

```bash
npm test -- --watch=false
```

The project uses Vitest through Angular's unit test builder. Component tests exercise the main
deck, editor, study, shell, storage, toast, and axe accessibility paths.
