# yellow

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines React, TanStack Start, Convex, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **TanStack Start** - SSR framework with TanStack Router
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **shadcn/ui** - Reusable UI components
- **Convex** - Reactive backend-as-a-service platform
- **Authentication** - Better-Auth
- **Biome** - Linting and formatting
- **Turborepo** - Optimized monorepo build system
- **Testing** - React Testing Library, Vitest, and Playwright

## Getting Started

First, install the dependencies:

```bash
bun install
```

## Convex Setup

This project uses Convex as a backend. You'll need to set up Convex before running the app:

```bash
bun run dev:setup
```

Follow the prompts to create a new Convex project and connect it to your application.

Copy environment variables from `packages/backend/.env.local` to `apps/*/.env`.

Then, run the development server:

```bash
bun run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.
Your app will connect to the Convex cloud backend automatically.

## Git Hooks and Formatting

- Format and lint fix: `bun run check`

## Project Structure

```
yellow/
├── apps/
│   ├── web/         # Frontend application (React + TanStack Start)
├── packages/
│   ├── backend/     # Convex backend functions and schema
│   ├── e2e/         # End-to-end tests with Playwright
```

## Testing

This project includes a comprehensive test suite with unit and end-to-end tests.

### Unit Tests

Unit tests are powered by Vitest and React Testing Library. They test individual components and functions in isolation.

```bash
# Run all unit tests
bun run test --filter=web

# Run tests in watch mode (web app)
cd apps/web && bun run test:watch
```

### End-to-End Tests

E2E tests are powered by Playwright and test the application as a whole, simulating real user interactions.

```bash
# Install Playwright browsers (first time only)
cd packages/e2e && bunx playwright install --with-deps chromium

# Run E2E tests
bun run test --filter=@yellow/e2e

# Run E2E tests with UI
cd packages/e2e && bun run test:ui

# Run E2E tests in headed mode (visible browser)
cd packages/e2e && bun run test:headed
```

### Run All Tests

```bash
bun run test
```

## Available Scripts

- `bun run dev`: Start all applications in development mode
- `bun run build`: Build all applications
- `bun run test`: Run all tests (unit and E2E)
- `bun run dev:web`: Start only the web application
- `bun run dev:setup`: Setup and configure your Convex project
- `bun run check-types`: Check TypeScript types across all apps
- `bun run check`: Run Biome formatting and linting
