---
name: web-style-guide
description: Applies a combined Angular, Google TypeScript, and Google HTML/CSS style guide for web application work. Use when Codex is writing, refactoring, reviewing, or explaining Angular components, TypeScript files, Angular templates, HTML, CSS, SCSS, or project structure; when asked for style-guide compliance; or when resolving naming, formatting, typing, selector, component-organization, template, or stylesheet conventions.
---

# Web Style Guide

Use this skill as the local style authority for Angular, TypeScript, HTML, and CSS work.

The bundled references summarize these upstream sources:

- Angular coding style guide: https://angular.dev/style-guide
- Google TypeScript style guide: https://google.github.io/styleguide/tsguide.html
- Google HTML/CSS style guide: https://google.github.io/styleguide/htmlcssguide.html

## Workflow

1. Read only the references relevant to the files being changed or reviewed.
2. Apply active user instructions, `AGENTS.md`, and existing project conventions first.
3. If rules conflict, prefer the most specific rule in this order: explicit user request, local project convention, Angular-specific guidance, Google TypeScript guidance, Google HTML/CSS guidance.
4. Preserve consistency inside the file being edited, especially when a legacy file intentionally differs from a recommendation.
5. When editing code, run the repo's formatter, type check, lint, tests, or build command that best matches the change scope.

## References

- For Angular file naming, project structure, dependency injection, components, templates, and lifecycle rules, read [angular.md](references/angular.md).
- For TypeScript imports, exports, naming, type-system usage, disallowed features, comments, and toolchain rules, read [typescript.md](references/typescript.md).
- For HTML and CSS validity, semantics, formatting, selector naming, and stylesheet organization, read [html-css.md](references/html-css.md).

## Review Checklist

When reviewing code, report concrete violations first with file and line references. Favor issues that affect maintainability, type safety, framework consistency, accessibility, or future refactoring. Do not flag purely optional formatting preferences when the repo's formatter already enforces a different style.

When writing code, apply the rules directly instead of explaining them unless the user asks for the rationale.
