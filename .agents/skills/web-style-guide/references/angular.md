# Angular Style Guide

Source: https://angular.dev/style-guide
Checked: 2026-05-12

Use this reference for Angular application structure, file naming, dependency injection, components, directives, templates, and lifecycle conventions.

## Priority Rules

- Prefer consistency with the current file or feature when a recommendation conflicts with established local style.
- Keep Angular UI code under `src`; keep scripts, configuration, and non-UI support outside `src`.
- Bootstrap the application from `src/main.ts`.
- Organize code by feature area instead of by artifact type. Prefer `settings/profile/edit-profile.*` over broad `components/`, `services/`, or `directives/` buckets.
- Keep one primary concept per file. Split files when the common theme is weak or the file becomes hard to scan.

## Naming

- Separate words in file names with hyphens: `user-profile.ts`, not `userProfile.ts`.
- Name unit test files after the implementation file with `.spec.ts`: `user-profile.spec.ts`.
- Match component TypeScript, template, and style file names: `user-profile.ts`, `user-profile.html`, `user-profile.css` or `.scss`.
- Avoid generic file names such as `helpers.ts`, `utils.ts`, or `common.ts` unless the contents truly share a single specific theme.

## Dependency Injection

- Prefer `inject()` over constructor parameter injection.
- Keep injected dependencies grouped near the top of the class.
- Use dependency injection for services and framework dependencies; avoid manual service construction.

## Components And Directives

- Choose selectors that are specific to the application and consistent with the project prefix.
- Use camelCase attribute selectors for directives, such as `[appTooltip]`.
- Group Angular-specific class members near the top: injected dependencies, inputs, outputs, model inputs, queries, then derived state and methods.
- Keep components and directives focused on presentation. Move validation rules, data transforms, and other UI-independent logic into separate functions or services.
- Use `protected` for members that are consumed only by the template and are not part of the public API.
- Mark Angular-initialized properties `readonly`, including `input()`, `model()`, `output()`, and query results.
- Prefer `class` and `style` bindings over `ngClass` and `ngStyle`.
- Name event handlers after the action they perform, such as `saveUserData()`, not after the DOM event, such as `handleClick()`.

## Templates

- Keep template expressions simple. Move complex derived logic into TypeScript, usually as a `computed()`.
- Use clear, action-oriented event bindings.
- Do not put heavy branching, data shaping, or multi-step computation directly in the template.

## Lifecycle

- Keep lifecycle methods small. Call well-named methods from lifecycle hooks when more than trivial setup is needed.
- Implement lifecycle interfaces such as `OnInit` when adding lifecycle methods.

## Local Angular Defaults

For this repository, also obey the active `AGENTS.md` instructions:

- Use standalone components and do not set `standalone: true` in Angular v20+ decorators.
- Use signals for local state and `computed()` for derived state.
- Use `input()` and `output()` functions instead of decorators where applicable.
- Set `ChangeDetectionStrategy.OnPush` on components.
- Keep component templates and styles in separate files.
- Prefer Reactive Forms unless a local feature already uses another form strategy.
- Use native control flow (`@if`, `@for`, `@switch`) rather than structural directives.
- Avoid `@HostBinding` and `@HostListener`; use the decorator `host` object.
