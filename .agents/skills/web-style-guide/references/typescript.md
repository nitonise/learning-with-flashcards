# Google TypeScript Style Guide

Source: https://google.github.io/styleguide/tsguide.html
Checked: 2026-05-12

Use this reference for TypeScript source organization, imports, exports, naming, typing, comments, and disallowed language features.

## Source Files

- Use UTF-8.
- Keep file sections in this order: copyright or license if present, file-level JSDoc if present, imports, implementation.
- Separate present top-level sections with one blank line.
- Use paths for TypeScript imports. Prefer relative imports for files in the same logical project.
- Prefer named imports for commonly used or clear symbols. Prefer namespace imports when many symbols from a broad API need readable namespacing.
- Use named exports. Avoid default exports.
- Export only symbols used outside the module; minimize public surface area.
- Do not use mutable exports such as `export let`.
- Do not create container classes just to hold static members. Use file-scope constants, functions, and named exports.

## Naming

- Use descriptive names that a new reader can understand.
- Do not encode type information in names. Avoid prefixes like `opt_`, interface prefixes like `IUser`, or private-member underscores.
- Treat acronyms as words in camel case: `loadHttpUrl`, not `loadHTTPURL`.
- Use `UpperCamelCase` for classes, interfaces, type aliases, enums, decorators, and type parameters.
- Use `lowerCamelCase` for variables, parameters, functions, methods, properties, and module aliases.
- Use `CONSTANT_CASE` only for module-level constants, enum values, and static readonly constants that are intended as constants.
- Avoid `$` in identifiers except where a project consistently uses it for observables or a third-party convention requires it.

## Types

- Rely on inference for trivially inferred values such as string, number, boolean, RegExp, and `new` expressions.
- Add explicit annotations when inference would produce `unknown`, when initializing empty generic containers, or when a complex expression's type is hard to understand.
- Prefer optional fields and parameters over explicit `| undefined` for values that may be omitted.
- Use interfaces for object-shaped structural types. Use type aliases for unions, primitives, tuples, and other type expressions.
- Prefer `T[]` and `readonly T[]` for simple array element types. Use `Array<T>` or `ReadonlyArray<T>` for complex element types.
- Prefer `Map` or `Set` for associative collections unless a plain object or `Record` better models known keys.
- Use the simplest type construct that expresses the code. Avoid clever mapped or conditional types when spelling out an interface is clearer.
- Avoid `any`. Prefer a specific type or `unknown` with narrowing. If `any` is unavoidable, isolate it and document why.
- Avoid `{}` for opaque values. Prefer `unknown`, `Record<string, T>`, or `object`, depending on intent.
- Use primitive types `string`, `boolean`, and `number`, not wrapper types `String`, `Boolean`, and `Number`.
- Avoid APIs where a generic parameter appears only in the return type.

## Classes And Functions

- Do not add empty constructors or constructors that only delegate to `super` unless decorators, parameter properties, or visibility modifiers require them.
- Prefer module-local functions over private static methods when readability is not harmed.
- Do not use `this` in a static context.
- Keep `try` blocks focused around code that can actually throw.
- Use framework decorators only when the framework requires them. In Angular code, prefer modern Angular APIs where local instructions require them.

## Disallowed Or Restricted Features

- Do not rely on Automatic Semicolon Insertion; terminate statements with semicolons when the project style does.
- Do not use `const enum`.
- Do not leave `debugger` statements in production code.
- Do not use `with`, `eval`, or `Function(...string)`.
- Do not modify builtin prototypes or constructors.
- Avoid non-standard ECMAScript or Web Platform features unless the runtime contract explicitly allows them.
- Do not use `@ts-ignore`, `@ts-expect-error`, or `@ts-nocheck` as routine fixes. In tests, narrowly isolate and explain unavoidable suppressions.

## Comments And Documentation

- Use JSDoc for API documentation that callers should read.
- Use ordinary `//` comments for implementation notes.
- Prefer multiple `//` lines over block comments for multi-line implementation comments.
- Document top-level exports and non-obvious public members. Avoid comments that restate names.
- Write JSDoc in valid Markdown and keep tags well formed.
