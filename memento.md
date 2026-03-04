# Memento – Architectural Decisions & Context

## Migration: Vanilla JS → TypeScript/React/Bootstrap

**Date:** 2026-03-04

### Decision
Migrated the Chrome extension from a vanilla JavaScript project with vendored libraries and DOM manipulation to a TypeScript/React/Bootstrap architecture using Vite as the bundler.

### What Changed
- **Entry point:** Created `src/content.tsx` as the content script entry point. It injects a `<div id="mngs-root">` into the Medium stats page and renders the React app via `createRoot`.
- **App component:** Created `src/App.tsx` as the main orchestrator. It manages all state (`StatsOptions`, `MngsData`, range/time-range/tab selections) and composes all child components.
- **Custom hook:** Created `src/hooks/useStatsData.ts` to encapsulate the multi-phase data loading sequence (posts → initial stats → activities → earnings → remaining stats).
- **Chart component:** Created `src/components/StatsChart.tsx` using Chart.js directly (imperative `new ChartJS(ctx, config)` in a `useEffect`), because `react-chartjs-2` doesn't support mixed chart types (bar + line + bubble) in a single chart well.
- **SCSS:** Converted `src/css/mngs.css` to `src/css/mngs.scss` with SCSS variables and nesting. Bootstrap CSS is imported via `bootstrap/dist/css/bootstrap.min.css`.
- **Deleted:** `src/js/` (all old vanilla JS files), `src/libs/` (vendored Chart.js and FontAwesome). These are now managed via `package.json`.

### Key Libraries (managed via pnpm)
- `chart.js` + `react-chartjs-2` – Charts (tree-shaken with explicit registration)
- `@fortawesome/react-fontawesome` + icon packages – Icons
- `react-bootstrap` + `bootstrap` – UI components
- `@crxjs/vite-plugin` – Chrome extension Vite integration

### Testing
- **Framework:** Vitest with jsdom environment
- **Setup:** `src/test/setup.ts` mocks `chrome` APIs (`chrome.storage.local`, `chrome.runtime`)
- **Libraries:** `@testing-library/react`, `@testing-library/jest-dom`
- **Pattern:** Co-located test files (`*.test.ts` / `*.test.tsx`) next to source files

### Trade-offs
- **StatsChart uses imperative Chart.js** instead of `react-chartjs-2` declarative components, because the bar chart config uses mixed dataset types (bar + line + bubble) which is easier to handle with the imperative API.
- **Component-level SCSS files** were not created for every component (a single `mngs.scss` is used instead) because the styling is relatively simple and tightly coupled to Medium's existing page styles. Per `agents.md` rule 6, individual `.styled.tsx` or `.scss` files should be added as components grow.
- **`dynamic-table-handler.js` functionality** (highlight button in Medium's native posts table, date labels, preview images) was not migrated to React because it modifies Medium's own DOM elements that exist outside our React tree. This should be revisited if Medium changes their stats page structure.

### Package Manager
- **pnpm** is the package manager (see `packageManager` field in `package.json`).

---

## CI/CD Pipeline: CircleCI + Codecov

**Date:** 2026-03-04

### Decision
Added a CircleCI pipeline with separate jobs for linting, testing, coverage, and building. Integrated Codecov for coverage reporting.

### What Changed
- **ESLint:** Added `eslint.config.js` (flat config, ESM) with `typescript-eslint`, `eslint-plugin-react-hooks`, and `eslint-plugin-react-refresh`. Added `pnpm lint` script.
- **CircleCI:** Created `.circleci/config.yml` with 4 jobs:
  - `lint` – runs ESLint
  - `test` – runs Vitest
  - `coverage` – runs Vitest with v8 coverage, uploads lcov to Codecov
  - `build` – runs Vite build (requires lint + test to pass first)
- **Coverage:** Configured `@vitest/coverage-v8` with `lcov`, `text`, and `json-summary` reporters in `vitest.config.ts`.
- **Badges:** Added CircleCI build status and Codecov coverage badges to `README.md`.

### Trade-offs
- **`react-hooks/set-state-in-effect` rule is disabled** because the data-fetching-on-mount pattern in `useStatsData.ts` legitimately calls `setState` inside a `useEffect`. This is a very new, strict rule from React 19's compiler plugin and does not apply to async data fetching patterns.
- **Codecov orb v5** is used. Requires a `CODECOV_TOKEN` environment variable to be set in CircleCI project settings.
- **Build job gates on lint + test** to fail fast. Coverage runs in parallel since it's informational.


