# nps-fe

Frontend for the Nimar Patidar Sangathan, Indore portal (npsindore.org). React 18 + Vite, Tailwind CSS and shadcn/ui (Radix) components, React Router and TanStack Query.

The backend API lives in the separate [`nps-be`](https://github.com/vpatidar94/nps-be) repo.

## Requirements

- Node.js 22+
- A running `nps-be` API (locally on `http://localhost:4000`, or a hosted URL)

## Setup

```bash
npm install
cp .env.example .env.local   # set VITE_API_BASE_URL
npm run dev                  # http://localhost:5173
```

To run the whole stack locally, start MySQL and `nps-be` (`npm run dev` in that repo) first.

### Environment

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Base URL of the nps-be API. Defaults to `http://localhost:4000` if unset. |
| `VITE_RECAPTCHA_SITE_KEY` | Google reCAPTCHA v3 site key for registration forms. Leave empty locally. |

Vite loads `.env.local` over `.env`. Env values are baked into the bundle at build time, so never put secrets in them. Restart `npm run dev` after changing them.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server on port 5173 (also exposed on your LAN) |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Lint pages and components (ESLint) |
| `npm test` | API URL map tests (`src/api/endpoints.test.js`) |

## Project layout

```
src/
  App.jsx           Routes (pages are lazy-loaded)
  main.jsx          Entry point
  api/base44Client.js  API client used by the app (entities, auth, users, helper endpoints)
  pages/            One file per route: public pages, member pages, Admin* pages
  components/       Layouts, shared components; components/ui = shadcn/ui primitives
  lib/              Auth context, i18n (English/Hindi), theme, query client, helpers
  hooks/            Shared hooks
public/             Favicons, manifest, robots.txt, sitemap.xml, videos/
```

The API client keeps the Base44 SDK shape (`base44.entities.Family.list()`, `base44.auth.me()`, ...) but sends everything to `VITE_API_BASE_URL`. The session token is stored in `localStorage` as `base44_access_token`.

## Troubleshooting

- **"Failed to fetch" on login**: check that `nps-be` is running and `VITE_API_BASE_URL` is correct. If the browser console mentions `Access-Control-Allow-Origin` being `*`, a CORS browser extension is rewriting the response; disable it for localhost.
- **`Cannot find native binding` when starting Vite**: delete `node_modules` and run `npm install` again (the platform-specific bundler binary is missing).
- **reCAPTCHA errors on registration locally**: leave `VITE_RECAPTCHA_SITE_KEY` empty and `RECAPTCHA_SECRET_KEY` unset in nps-be.
- Open the app at `http://localhost:5173`, not the LAN IP, when the API runs on `localhost`.

## Deployment

`npm run build` and deploy the `dist/` folder as a single-page app (all unknown paths must fall back to `index.html`). Set `VITE_API_BASE_URL` to the production API before building.
