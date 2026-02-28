# CLAUDE.md

## Project Overview

**TechLine** — an interactive 3D encyclopedia of the history of science and technology, from the formation of Earth to the present day. Users navigate a 3D globe through time, exploring geolocated scientific discoveries and technological innovations.

**Live URL:** https://jeremygoupil.github.io

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 7 |
| 3D Engine | Three.js via React Three Fiber (@react-three/fiber) + drei |
| State | Zustand |
| Styling | Tailwind CSS 4 |
| Routing | React Router 7 |
| Testing | Vitest + React Testing Library |
| Linting | ESLint + Prettier |

## Repository Structure

```
.
├── index.html                      # Vite entry point
├── package.json                    # Dependencies and scripts
├── vite.config.ts                  # Vite + Tailwind + Vitest config
├── tsconfig.json                   # TypeScript project references
├── tsconfig.app.json               # App TypeScript config
├── tsconfig.node.json              # Node/Vite TypeScript config
├── eslint.config.js                # ESLint flat config
├── .prettierrc                     # Prettier config
├── .gitignore
├── CLAUDE.md                       # This file
├── public/
│   └── favicon.svg                 # App favicon
├── src/
│   ├── main.tsx                    # React entry point
│   ├── App.tsx                     # Root component
│   ├── index.css                   # Global styles + Tailwind + CSS variables
│   ├── vite-env.d.ts               # Vite type declarations
│   ├── components/
│   │   ├── Globe/
│   │   │   ├── Globe.tsx           # 3D globe sphere + wireframe
│   │   │   ├── Atmosphere.tsx      # Glow effect around globe
│   │   │   ├── EventMarker.tsx     # Single clickable marker on globe
│   │   │   └── EventMarkers.tsx    # Renders all markers from data
│   │   ├── Scene/
│   │   │   ├── SceneSetup.tsx      # R3F Canvas, camera, lights, controls
│   │   │   └── Background.tsx      # Starfield background
│   │   ├── Timeline/
│   │   │   └── Timeline.tsx        # Timeline bar with era chips + slider
│   │   └── UI/
│   │       ├── NavigationBar.tsx   # Top navigation bar
│   │       └── EventPanel.tsx      # Side panel for event details
│   ├── data/
│   │   ├── eras.json               # 13 eras from formation to contemporary
│   │   ├── categories.json         # 10 scientific categories
│   │   └── events/
│   │       └── sample.json         # Initial 14 sample events
│   ├── hooks/                      # Custom React hooks (to be expanded)
│   ├── stores/
│   │   └── appStore.ts             # Zustand global state
│   ├── types/
│   │   └── index.ts                # Shared TypeScript types
│   ├── utils/
│   │   ├── coordinates.ts          # lat/lng → 3D position conversion
│   │   ├── timeScale.ts            # Year ↔ timeline position + formatting
│   │   └── timeScale.test.ts       # Unit tests for time utilities
│   └── test/
│       └── setup.ts                # Vitest setup (jest-dom matchers)
└── legacy-portfolio/               # Archived original portfolio site
```

## Commands

```bash
npm run dev          # Start dev server (Vite)
npm run build        # TypeScript check + production build
npm run preview      # Preview production build locally
npm test             # Run tests (Vitest)
npm run test:watch   # Run tests in watch mode
npm run lint         # Lint src/ with ESLint
npm run format       # Format src/ with Prettier
```

## Design System

Defined via CSS custom properties in `src/index.css`:

| Variable | Value | Usage |
|---|---|---|
| `--color-primary` | `#1abc9c` | Accent, links, highlights |
| `--color-primary-dark` | `#16a085` | Hover states |
| `--color-header` | `#2c3e50` | Header background |
| `--color-text` | `#ecf0f1` | Primary text |
| `--color-text-muted` | `#95a5a6` | Secondary text |
| `--color-bg-dark` | `#0a0a1a` | App background |
| `--color-bg-panel` | `rgba(15,15,35,0.9)` | Panel backgrounds |
| `--color-border` | `rgba(26,188,156,0.3)` | Borders |

## Data Model

Events are JSON objects in `src/data/events/`. Each event has:

```typescript
interface HistoricalEvent {
  id: string;              // Unique slug, e.g. "gutenberg-printing-press"
  title: string;           // Display name
  year: number;            // Negative for BCE, e.g. -4_500_000_000
  era: EraId;              // One of 13 era identifiers
  category: EventCategory; // physics | chemistry | biology | engineering | ...
  location: { name: string; lat: number; lng: number };
  protagonist?: string;
  summary: string;
  impact?: string;
  connections?: string[];  // IDs of related events
  importance: 1 | 2 | 3 | 4 | 5;
}
```

## Architecture Patterns

- **State management:** Zustand store in `src/stores/appStore.ts`. Access via `useAppStore` hook with selectors.
- **3D scene:** React Three Fiber — all 3D components live in `src/components/Globe/` and `src/components/Scene/`.
- **Data:** Static JSON files in `src/data/`. Imported directly (no API).
- **Styling:** Tailwind utility classes + CSS custom properties. Use arbitrary value syntax `bg-[var(--color-bg-panel)]` for custom properties.

## Git Workflow

- **Primary branch:** `master`
- **Remote default:** `main`
- **Feature branches:** `feature/<description>` or `claude/<description>`
- **Commit messages:** conventional commits — `feat:`, `fix:`, `docs:`, `refactor:`, `test:`
- **PRs:** feature branches merged via pull requests

## Guidelines for AI Assistants

- Run `npm run build` after significant changes to verify TypeScript + build.
- Run `npm test` after modifying utilities or logic.
- Add new events to `src/data/events/` following the `HistoricalEvent` type schema.
- New components go in the appropriate `src/components/` subdirectory.
- Keep 3D components lightweight — heavy computation should be in `src/utils/`.
- Use Zustand selectors to avoid unnecessary re-renders: `useAppStore((s) => s.specificField)`.
- Content language: French. Code/comments: English.
- The `legacy-portfolio/` directory contains the original static portfolio — do not modify.
