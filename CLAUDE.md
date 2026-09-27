# CLAUDE.md

Frontend for the NPS Indore portal: React 18 + Vite 8, Tailwind 3, shadcn/ui (Radix), React Router 6, TanStack Query. JavaScript/JSX (no TypeScript). See `README.md` for setup and layout.

## Commands

- `npm run dev`: dev server on http://localhost:5173 (needs the `nps-be` API, default `http://localhost:4000`)
- `npm run build`: production build; run it to verify changes compile
- `npx eslint .`: lint (config covers `src/pages`, `src/components`, excluding `components/ui`)

No test suite exists; verify UI changes in the running app.

## Architecture notes

- All backend calls go through `src/api/base44Client.js`, which mimics the Base44 SDK (`base44.entities.<Entity>.list/filter/create/update/delete`, `base44.auth.*`). Reuse it; don't call `fetch` directly from pages. `src/api/appClient.js` is an older, unused copy.
- Entity names map to backend tables in `nps-be/server/entityConfig.js`; a new entity needs a backend change too.
- Routes are declared in `src/App.jsx` with lazy-loaded pages from `src/pages/`. Admin pages are prefixed `Admin*` and wrapped in `AdminLayout`/`ProtectedRoute`.
- Auth state lives in `src/lib/AuthContext.jsx`. UI text is bilingual (English/Hindi) via `src/lib/i18n.jsx`; add strings for both languages.
- Admin tables share helpers: `src/lib/useTableControls.js` (search/sort/paging), `src/lib/dateRangeFilter.js` + `components/admin/DateRangeFilter.jsx`, and `src/lib/exportTable.js` + `components/ExportMenu.jsx` for export. Reuse them on new admin pages.
- Protected public forms call `getRecaptchaToken()` from `src/lib/recaptcha.js` before submitting.
- Use the `@/` import alias (maps to `src/`). Use existing shadcn/ui components in `src/components/ui/` before adding new ones.

## Rules

- Never commit `.env*` files (except `.env.example`), `dist/`, or zipped builds.
- `VITE_*` variables end up in the public bundle; never put secrets in them.
- Keep changes focused and match the surrounding code style.
