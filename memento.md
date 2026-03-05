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

---

## Content Script: Updated Selectors for New Medium Stats Page

**Date:** 2026-03-04

### Decision
Updated `src/content.tsx` to replace the `.container.stats` CSS selector with a text-based selector strategy. Medium redesigned their stats page, replacing the old `.container.stats` element with a React SPA that uses obfuscated CSS class names (e.g., `fa`, `cg`, `fb`) that change on every deploy.

### What Changed
- **Selector strategy:** Instead of `document.querySelector('.container.stats')`, the extension now searches for an `<h2>` element with the text content "Stats", then walks up the DOM tree to find the top-level content wrapper (a direct child of `#root`). Falls back to `#root` itself, then `document.body`.
- **MutationObserver:** Since Medium is an SPA, the stats content may not be in the DOM when the content script runs. Added a `MutationObserver` that watches for the `<h2>Stats</h2>` element to appear, with a 15-second timeout fallback.
- **Exported helpers:** `findStatsHeading`, `findInsertionPoint`, and `init` are now exported for testability.
- **Tests:** Created `src/content.test.tsx` with 13 tests covering heading detection, insertion point resolution, idempotency, and fallback behavior.

### Trade-offs
- **Text-based selectors are more stable** than CSS class selectors for Medium's obfuscated classes, but could break if Medium renames the "Stats" heading. This is unlikely since it's user-facing text.
- **The `MutationObserver` timeout (15s)** is generous to handle slow page loads. If the page never renders the Stats heading, the extension falls back to inserting at the end of `document.body`.
- **`findContentAncestor` walks to `#root`'s direct child**, which means the extension container is inserted as a sibling of Medium's top-level content wrapper. This keeps it visually below the stats page content.

---

## API Migration: REST → GraphQL

**Date:** 2026-03-04

### Decision
Migrated the data-fetching layer from Medium's deprecated REST API endpoints to their GraphQL API (`POST https://medium.com/_/graphql`). The old REST endpoints (`/me/stats?format=json`, `/stats/{postId}/{begin}/{end}?format=json`, `/_/api/activity`) now return HTML instead of JSON, breaking the extension.

### What Changed
- **`src/services/api.ts`:** Completely rewritten. Removed all REST-based functions (`request`, `getPosts`, `getTotals`). Now uses GraphQL queries via the new `graphqlClient.ts` module.
- **`src/services/graphqlQueries.ts`:** New file containing GraphQL query strings and TypeScript interfaces for the GraphQL response shapes (`GraphQlPostNode`, `PostsConnectionPage`, `TimeseriesPoint`).
- **`src/services/graphqlClient.ts`:** New file containing the generic `graphqlFetch<T>()` helper (with caching support), `extractUsername()` (reads the logged-in user's username from `window.__PRELOADED_STATE__` or profile links), and `getCacheStats()`.
- **`getPostsFromUser()`:** Now uses `UserLifetimeStoryStatsPostsQuery` with cursor-based pagination (25 posts per page) instead of the old `/me/stats?format=json&limit=500` endpoint.
- **`getPostStats()`:** Now uses `UserMonthlyStoryStatsTimeseriesQuery` for aggregate daily views/reads data, replacing per-post REST fetches to `/stats/{postId}/{begin}/{end}?format=json`.
- **`getActivities()`:** Returns empty array since the old `/_/api/activity` REST endpoint is dead. Follower tracking is no longer available via the new API.
- **`getEarningsOfPost()`:** Unchanged — it already used GraphQL (`StatsPostChart` operation).
- **`manifest.json`:** Updated `content_scripts.matches` to include `https://medium.com/me/stats` and `https://medium.com/me/stats?*` patterns (Medium's new stats URL format).
- **`src/hooks/useStatsData.ts`:** Updated to work with aggregate timeseries data (one GraphQL call per time range chunk) instead of per-post REST calls.

### Username Extraction
The GraphQL API requires the authenticated user's username. `extractUsername()` uses two strategies:
1. **Primary:** Scans `<script>` tags for `window.__PRELOADED_STATE__` and extracts the `"username"` field via regex.
2. **Fallback:** Looks for an `<a href="/@username">` link in the page DOM.

### Trade-offs
- **Aggregate stats only:** The timeseries query (`UserMonthlyStoryStatsTimeseriesQuery`) returns aggregate views/reads across all posts, not per-post breakdowns. Per-post daily stats would require additional GraphQL queries (e.g., `StatsPostChart` per post), which was deferred to avoid rate-limiting.
- **No follower/activity data:** The old `/_/api/activity` endpoint is gone. The GraphQL API doesn't expose an equivalent activity feed, so follower tracking is disabled.
- **Username dependency:** The extension now requires the username to be extractable from the page. If Medium changes how `__PRELOADED_STATE__` is embedded, the fallback profile-link strategy should still work.
- **GraphQL request format:** Medium's GraphQL endpoint expects the request body wrapped in an array (`[{ operationName, variables, query }]`) and returns an array response. The `graphqlFetch` helper handles both array and object response shapes.
