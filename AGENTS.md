# Repository Guidelines

## Project Structure & Module Organization
- Use `src/` for application code. Suggested modules: `src/engine/` (rules, move generation), `src/ui/` (presentation), `src/game/` (state, controllers), `src/lib/` (utilities).
- Place tests in `tests/`, mirroring the `src/` tree (e.g., `src/engine/moves.ts` → `tests/engine/moves.spec.ts`).
- Keep static assets in `assets/` and developer scripts in `scripts/`. Add `docs/` for short technical notes and architecture sketches.
- The main file for an HTML/JS/CSS app shall be index.html at the root of repo `/`
- Create `.github/workflows/` for CI as the project grows.

## Build, Test, and Development Commands
- This repo targets a TypeScript-first workflow. Standardize on the following npm scripts (add to `package.json` if missing):
  - `npm install` — install dependencies.
  - `npm run dev` — start local dev server (e.g., Vite).
  - `npm test` — run unit tests with coverage.
  - `npm run build` — production build.
  - `npm run lint` / `npm run format` — static analysis and formatting.

## Coding Style & Naming Conventions
- Indentation: 2 spaces. File names: `kebab-case.ts(x)`. Types/classes: `PascalCase`; functions/variables: `camelCase`.
- Prefer pure, small modules; avoid circular imports. Keep exported APIs stable and documented in `docs/`.
- Use ESLint + Prettier. Enforce no unused vars, explicit return types on public APIs, and consistent imports.

## Testing Guidelines
- Framework: Vitest or Jest (choose one; Vitest preferred). Name tests `*.spec.ts` and mirror `src/` structure.
- Minimum coverage target: 80% lines/branches. Add tests for every bug fix and new rule in the checkers engine.
- Run locally via `npm test`; for focused work use `npm test -- -t "engine: jumps"` (example).

## Commit & Pull Request Guidelines
- Use Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `perf:`, `ci:`.
- Example: `feat(engine): add mandatory jump validation`.
- PRs must include: concise description, linked issue, test updates, and screenshots/gifs for UI changes. Ensure `build`, `lint`, and `test` checks pass.

## Agent-Specific Notes (Codex CLI)
- Prefer small, focused patches; use `rg` for search. When a task maps to a skill, open its `SKILL.md` and follow the provided workflow and scripts. Keep context minimal and reuse templates/assets where available.

## GitHub Pages Deployment Playbook
- Base path: For repo pages, always build with `--base=/${REPO_NAME}/`. If you need a permanent setting, set `base` in `vite.config.ts`.
- Assets that respect base: import CSS in your entry (`import './style.css'`) and create workers via `new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })`. Do not use root-absolute paths like `/src/style.css`.
- Lockfile and install: commit `package-lock.json` and prefer `npm ci` in CI; fall back to `npm install` only if the lockfile is intentionally absent.
- Ignore bloat: ensure `.gitignore` excludes `node_modules/` and `dist/`.
- Router note: if using a client router, add a `404.html` that serves the SPA (copy of `index.html`); not needed for this app.
- Visibility: Pages status APIs require a public repo (or a scoped token). If private, report status via the Actions UI instead of API polling.

### Workflow (copy-paste)
```
name: Deploy to GitHub Pages
on:
  push: { branches: [main] }
  workflow_dispatch:
permissions: { contents: read, pages: write, id-token: write }
concurrency: { group: pages, cancel-in-progress: true }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci || npm install --no-audit --no-fund
      - run: npm run build -- --base=/${{ github.event.repository.name }}/
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: ${{ steps.deployment.outputs.page_url }} }
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

### Preflight Checklist
- `package.json` has `build: "tsc -b && vite build"` and an entry file that imports CSS.
- Web workers are created with `new URL(..., import.meta.url)`.
- `tsconfig.json` includes `"lib": ["DOM", "WebWorker", "ES2020"]`.
- Vite base confirmed for repo pages; Settings → Pages set to “GitHub Actions”.
