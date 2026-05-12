# Google HTML/CSS Style Guide

Source: https://google.github.io/styleguide/htmlcssguide.html
Checked: 2026-05-12

Use this reference for HTML, Angular templates, CSS, and SCSS style decisions. In Angular templates, prefer Angular compiler requirements and project conventions over generic HTML shortcuts.

## HTML

- Use valid HTML and semantic elements.
- Use elements for their intended purpose before adding ARIA or custom behavior.
- Keep markup accessible: form controls need labels, tables need appropriate header scope, images need suitable alternative text or empty alt text when decorative, and interactive elements must be keyboard reachable.
- Separate structure, presentation, and behavior. Prefer CSS for presentation and Angular bindings for behavior.
- Avoid unnecessary entity references. Use entities only when required or when they improve readability.
- Use `type` attributes only when needed by the platform or project. Modern HTML does not need JavaScript or CSS MIME type attributes in normal cases.
- Use hyphenated `id` values when an `id` is necessary.
- Use double quotes for HTML attribute values.
- Put block, list, and table elements on new lines and indent child block content.
- Wrap long tag attributes consistently with the project formatter. Continuation lines should be visually distinct from child content.
- In Angular templates, do not omit closing tags in ways that make template structure harder to read.

## CSS Selectors And Naming

- Use valid CSS.
- Use meaningful class names based on purpose, not visual appearance.
- Keep class names as short as possible while still clear.
- Separate words in class names with hyphens.
- Consider an application-specific class prefix for large, embedded, or externally distributed surfaces.
- Avoid qualifying classes with element selectors unless necessary.
- Avoid ID selectors in CSS. Prefer classes for styling.
- Use shorthand properties when they genuinely improve clarity and do not hide unrelated values.
- Avoid browser hacks and user-agent detection except as a last resort.

## CSS Formatting

- Sort declarations consistently within a project. If there is no local rule or formatter, alphabetical order is acceptable.
- Indent declarations and nested block content to reflect hierarchy.
- End every declaration with a semicolon.
- Use a single space after a property colon and no space before it.
- Keep the opening brace on the selector line with one space before it.
- Put each selector and declaration on its own line when a rule has multiple selectors or declarations.
- Separate rules with one blank line.
- Use single quotes in CSS attribute selectors and string values. Do not quote `url()` values unless required by tooling.

## Angular Component Styles

- Prefer component-scoped styles for component presentation.
- Keep class names stable and meaningful even when Angular style encapsulation is enabled.
- Avoid styling by generated Angular attributes, internal framework classes, or DOM depth that is likely to change.
- Prefer classes over element selectors for reusable component internals when the element choice may evolve.
