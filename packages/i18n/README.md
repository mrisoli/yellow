# @yellow/i18n

Internationalization package for Yellow using [Paraglide JS](https://inlang.com/m/gerre34r/library-inlang-paraglideJs).

## Setup

This package is configured with Paraglide JS and the `@inlang/plugin-json` for handling JSON translation files.

## Adding/Modifying Translations

1. Edit the JSON files in the `messages/` folder (e.g., `messages/en.json`)
2. Run `bun run build` in this package to regenerate the paraglide runtime
3. The generated files will be available in `src/paraglide/`

### Message File Format

Messages are organized hierarchically in JSON:

```json
{
  "greeting": "Hello",
  "common": {
    "yes": "Yes",
    "no": "No"
  }
}
```

This generates corresponding JavaScript functions:

```typescript
m.greeting() // "Hello"
m.common.yes() // "Yes"
```

## Adding a New Language

1. Create a new JSON file in `messages/` (e.g., `messages/es.json`) with the same structure as `en.json`
2. Update `languageTags` in both:
   - `paraglide.config.json`
   - `project.inlang/settings.json`
3. Run `bun run build` to regenerate the runtime files

## Package Structure

```
packages/i18n/
├── messages/              # Translation source files
│   ├── en.json           # English translations
│   └── [language].json   # Additional language translations
├── project.inlang/       # Inlang project configuration
│   └── settings.json     # Inlang settings
├── src/paraglide/        # Generated runtime (auto-generated, do not edit)
│   ├── messages.js       # Message exports
│   ├── runtime.js        # Paraglide runtime
│   └── server.js         # Server-side utilities
├── package.json
├── paraglide.config.json # Paraglide configuration
└── README.md
```

## Usage in Your App

### JavaScript/TypeScript

```typescript
import * as m from "@yellow/i18n/messages";

// Access messages as functions
console.log(m.greeting()); // "Hello"
console.log(m.common.yes()); // "Yes"
```

### Runtime and Language Management

```typescript
import { baseLocale, locales, setLanguageTag } from "@yellow/i18n/runtime";

// Check available locales
console.log(locales); // ["en", ...]

// Set the current language
setLanguageTag("en");

// Get the base locale
console.log(baseLocale); // "en"
```

### React Integration

Messages can be used directly in React components:

```tsx
import * as m from "@yellow/i18n/messages";

export function MyComponent() {
  return (
    <div>
      <h1>{m.welcome()}</h1>
      <button>{m.common.save()}</button>
    </div>
  );
}
```

## Build

```bash
# Build the i18n package
bun run build

# Or from the root workspace
bun run build --filter @yellow/i18n
```
