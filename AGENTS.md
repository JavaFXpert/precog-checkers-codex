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

