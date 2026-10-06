# CLAUDE.md

Frontend for the NPS Indore portal: React 18 + Vite 8, Tailwind 3, shadcn/ui (Radix), React Router 6, TanStack Query. JavaScript/JSX (no TypeScript). See `README.md` for setup and layout.

## Commands

- `npm run dev`: dev server on http://localhost:5173 (needs the `nps-be` API, default `http://localhost:4000`; set `VITE_API_BASE_URL` to point elsewhere)
- `npm run build`: production build; run it to verify changes compile
- `npm run lint`: ESLint (config covers `src/pages`, `src/components`, excluding `components/ui`); must have 0 errors
- `npm test`: Node's built-in test runner on `src/api/endpoints.test.js` (API URL map vs the backend's paths, and no hard-coded API paths elsewhere)

There are no UI tests; verify UI changes in the running app. Backend API docs (Swagger): `<API base>/api/docs`.

## Architecture notes

- All backend calls go through `src/api/base44Client.js`, which mimics the Base44 SDK (`base44.entities.<Entity>.list/filter/create/bulkCreate/update/delete`, `base44.auth.*`). Reuse it; don't call `fetch` directly from pages.
- API fields are camelCase in requests and responses (`familyName`, `createdAt`, `accessToken`); booleans are `true`/`false`, amounts are numbers, DATE fields are `YYYY-MM-DD`, date-times ISO strings (send ISO too; the client does no date conversion). `filter({ familyId, status })` sends each key as a query parameter, so only filters the backend resource declares work (`families`: familyId, status; `family-members`: familyId; `samiti-members`: samitiId). `order` must be a field of that resource (`-date`, `sectionNumber`), `limit` 1–500.
- Every backend URL lives in `src/api/endpoints.js` (`API` map). The backend serves `/api/v1/...` with plural kebab-case resources and no verbs (login `POST /auth/sessions`, logout `DELETE /auth/sessions/current`, change password `PUT /auth/password`). Never hard-code an `/api/...` path elsewhere; `npm test` fails if you do.
- Entity names map to REST resources in `ENTITY_RESOURCES` (`endpoints.js`), e.g. `FamilyMember` → `/api/v1/family-members`. A new entity needs a backend change too (`nps-be/src/modules/entities/entity-definitions.ts`) and an entry here.
- Backend errors are always `{ error: "<message>" }`; `request()` turns them into thrown `Error`s with `status`.
- Routes are declared in `src/App.jsx` with lazy-loaded pages from `src/pages/`. Admin pages are prefixed `Admin*` and wrapped in `AdminLayout`/`ProtectedRoute`.
- Auth state lives in `src/lib/AuthContext.jsx`. UI text is bilingual (English/Hindi) via `src/lib/i18n.jsx`; add strings for both languages.
- Admin tables share helpers: `src/lib/useTableControls.js` (search/sort/paging), `src/lib/dateRangeFilter.js` + `components/admin/DateRangeFilter.jsx`, and `src/lib/exportTable.js` + `components/ExportMenu.jsx` for export. Reuse them on new admin pages.
- Protected public forms call `getRecaptchaToken()` from `src/lib/recaptcha.js` before submitting.
- Use the `@/` import alias (maps to `src/`). Use existing shadcn/ui components in `src/components/ui/` before adding new ones.

## Rules

- Never commit `.env*` files (except `.env.example`), `dist/`, or zipped builds.
- `VITE_*` variables end up in the public bundle; never put secrets in them.
- Keep changes focused and match the surrounding code style.
