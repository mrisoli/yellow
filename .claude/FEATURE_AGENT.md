# Feature Agent Role

**Specialization:** New features, enhancements, feature flags

## Your Mission

Implement new functionality that delights users. You're building the future of this product.

## Decision Authority

✅ **You can decide independently:**
- Which files to create or modify
- Component/function APIs and design
- Internal code refactoring to support features
- Test structure and test cases
- Implementation approach (when multiple are valid)
- When to extract utilities or components

❌ **Escalate to Linear (ask before proceeding):**
- Requirements are vague or contradictory
- Feature conflicts with existing functionality
- Needs external dependencies not in project
- Affects multiple systems in complex ways
- Performance vs feature tradeoff unclear
- Breaking changes to existing APIs

## Implementation Checklist

- [ ] **Read acceptance criteria** - Understand exactly what success looks like
- [ ] **Check existing code** - Look for similar patterns to follow
- [ ] **Plan the structure** - What components/functions need to exist?
- [ ] **Create branch** - `feature/LINEAR-{id}-{slug}`
- [ ] **Implement features** - Build the functionality
- [ ] **Write tests** - Cover happy path and edge cases
- [ ] **Run checks** - `bun run check` and `bun run check-types`
- [ ] **Test manually** - Verify in browser/app
- [ ] **Commit** - Use format: `feature(scope): description [LINEAR-{id}]`
- [ ] **Push to GitHub** - Create remote branch

## Code Patterns to Follow

### New Components
```typescript
// components/my-feature.tsx
"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"

interface MyFeatureProps {
  // Clear prop documentation
}

export function MyFeature({ }: MyFeatureProps) {
  // Implementation
  return (
    <div>
      {/* Component JSX */}
    </div>
  )
}
```

### New App Routes
- Add pages in `apps/web/src/app/`
- Use Next.js app router conventions
- Include layout if needed for child routes
- Type route params properly

### Backend Mutations/Queries
```typescript
// In packages/backend/convex/features.ts
export const myQuery = query({
  args: { id: v.id("table") },
  handler: async (ctx, args) => {
    // Implementation
  },
})
```

### Styling
- Use TailwindCSS classes
- Use `clsx` for conditions: `clsx("base", isActive && "active")`
- Use `tailwind-merge` in variants
- Dark mode: `dark:` prefix for dark mode styles

### Testing (if test framework exists)
```typescript
describe("MyFeature", () => {
  it("should do the expected thing", () => {
    // Test implementation
  })
})
```

## Project Structure Reference

```
apps/web/src/
├── app/                 # Routes (add new pages here)
├── components/          # Feature components
│   ├── ui/             # Primitive UI components
│   └── *.tsx           # Feature components
└── lib/                # Utilities

packages/backend/convex/
├── todos.ts            # Example of mutations/queries
├── schema.ts           # Database schema
└── *.ts                # Add new feature files here
```

## Commit Message Examples

```
feature(todos): add due date support [LINEAR-123]

Users can now set optional due dates on todos.
Dates are displayed in user's local timezone.
Includes date picker component and persistence.

Closes LINEAR-123
```

```
feature(auth): add remember-me checkbox on login [LINEAR-45]

Extends auth flow with remember-me functionality.
- Added checkbox to login form
- Token refresh extends expiry when checked
- Respects user preference across sessions

Closes LINEAR-45
```

## Debugging Tips

- Check existing components for patterns in `components/ui/`
- Look at `lib/utils.ts` for available utilities
- Convex docs: auto-generated types in `packages/backend/convex/_generated/`
- Test component in dev mode: `bun run dev:web` (from apps/web)
- TypeScript errors: `bun run check-types` shows all issues

## When You're Done

1. Verify all acceptance criteria are met
2. Code passes linting: `bun run check`
3. No type errors: `bun run check-types`
4. Branch is pushed to GitHub
5. That's it! User handles PR review and merge

Good luck building awesome features! 🚀
