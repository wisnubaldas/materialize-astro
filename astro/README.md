# Astro Starter Kit: Minimal

```sh
npm create astro@latest -- --template minimal
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## Project Structure (Current)

Key folders used in this Astro app:

```text
astro/
  public/
  src/
    assets/
    components/
      astro/
      react/
    hooks/
    js/
    layouts/
    lib/
      api/
        client.js
        edi.js
        hubnetApi.js
        sse.js
        warehouse.js
    pages/
    utils/
    scss/
    libs/
    vendor/
```

Legacy folders (`src/js`, `src/scss`, `src/libs`, `src/vendor`) masih dipertahankan untuk kompatibilitas bertahap, tetapi modul baru diprioritaskan ke struktur target di atas.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

## Integrated React

Integrated React into the SSR build and wired up a default layout plus component.

- [astro.config.mjs:3](astro.config.mjs) imports @astrojs/react and registers the integration alongside the Node adapter so React islands can render in SSR.
- [src/layouts/BaseLayout.astro:1](src\layouts\BaseLayout.astro) adds a reusable layout providing HTML scaffolding with configurable title/description and slot-based content.
- [src/components/WelcomeBanner.jsx:1](src\components\WelcomeBanner.jsx) introduces an interactive React banner with a counter to validate client-side hydration.
- [src/pages/index.astro:2](src\pages\index.astro) switches the homepage to use the new layout and mounts WelcomeBanner via client:load.

> Tested with npm run build.
>
> Next steps: 1) npm run dev to start the SSR dev server.

## Template

[materialize](https://www.mediafire.com/file/k2dg8p2e97wez94/materialize-1390.rar/file)
[metronic](https://drive.google.com/drive/folders/0BwbYBjaC3lAmV2R0MUpORTVlaXM?resourcekey=0-9YjRuZtzdAyXLhWa9IAciQ&usp=drive_link)

## Auth

Menerapkan alur masuk yang didukung FastAPI ditambah perlindungan SSR.

- [src/js/auth.js:1-123](src\js\auth.js) now provides cookie-based auth helpers (login, logout, getAccessToken) with localized error messaging that call the FastAPI /auth endpoints.
- [src/lib/auth/config.js:1-35](src\lib\auth\config.js) centralizes auth configuration (API base URL, cookie name/max-age, redirect targets, shared error copy).
- [src/pages/auth/login.astro:1-292](src\pages\auth\login.astro) updates the form to submit email/password, shows inline errors, and adds a module script that calls the new helpers and redirects on success.
- [src/middleware.js:1-232](src\middleware.js) introduces an Astro middleware that skips static assets, validates auth via `/auth/me`, redirects unauthenticated users to `/auth/login`, and keeps logged-in users away from the login page.

Tested with npm run build.

Next steps:

1. Set PUBLIC_AUTH_API_BASE_URL in your .env when the FastAPI service isn’t on http://127.0.0.1:8000.
2. Confirm FastAPI CORS settings allow credentials from the Astro origin so the cookie survives cross-origin requests.

## Fetch

Added a reusable API client so every request automatically carries the bearer token:

- [src/lib/api/client.js](src\lib\api\client.js) centralizes the backend base URL (resolved from PUBLIC_BACKEND_PATH with a 127.0.0.1 fallback), exports apiClient helpers (get/post/put/patch/delete), and now includes explicit request timeout support.
- Each call merges custom headers with defaults, attaches Authorization: Bearer <token> using getAccessToken() from [@js/auth.js](src\js\auth.js), sets Accept: application/json, stringifies non-FormData bodies, includes cookies by default, and turns non-2xx responses into typed Errors.
- Supports params for query strings, token overrides, and raw: true when you need the raw Response.
  Example usage:

```js
import { apiClient } from '@lib/api/client';

const invoices = await apiClient.get('/angkasapura/datatables', {
  params: { page: 1 },
});
```

On the server (where document isn’t available) the Authorization header is skipped unless you pass token explicitly. Update callers as needed to take advantage of the wrapper.

## Datatables React

```node
npm install jszip
npm install pdfmake
npm install datatables.net-react
npm install datatables.net-bs5
npm install datatables.net-autofill-bs5
npm install datatables.net-buttons-bs5
npm install datatables.net-colreorder-bs5
npm install datatables.net-columncontrol-bs5
npm install datatables.net-datetime
npm install datatables.net-fixedcolumns-bs5
npm install datatables.net-fixedheader-bs5
npm install datatables.net-keytable-bs5
npm install datatables.net-responsive-bs5
npm install datatables.net-rowgroup-bs5
npm install datatables.net-rowreorder-bs5
npm install datatables.net-scroller-bs5
npm install datatables.net-searchbuilder-bs5
npm install datatables.net-searchpanes-bs5
npm install datatables.net-select-bs5
npm install datatables.net-staterestore-bs5
```

```javascript
import jszip from 'jszip';
import pdfmake from 'pdfmake';
import DataTable from 'datatables.net-react';
import DataTablesCore from 'datatables.net-bs5';
import 'datatables.net-autofill-bs5';
import 'datatables.net-buttons-bs5';
import 'datatables.net-buttons/js/buttons.colVis.mjs';
import 'datatables.net-buttons/js/buttons.html5.mjs';
import 'datatables.net-buttons/js/buttons.print.mjs';
import 'datatables.net-colreorder-bs5';
import 'datatables.net-columncontrol-bs5';
import DateTime from 'datatables.net-datetime';
import 'datatables.net-fixedcolumns-bs5';
import 'datatables.net-fixedheader-bs5';
import 'datatables.net-keytable-bs5';
import 'datatables.net-responsive-bs5';
import 'datatables.net-rowgroup-bs5';
import 'datatables.net-rowreorder-bs5';
import 'datatables.net-scroller-bs5';
import 'datatables.net-searchbuilder-bs5';
import 'datatables.net-searchpanes-bs5';
import 'datatables.net-select-bs5';
import 'datatables.net-staterestore-bs5';

DataTablesCore.Buttons.jszip(jszip);
DataTablesCore.Buttons.pdfMake(pdfmake);
DataTable.use(DataTablesCore);
```

## ENV

```bash
# .env
PUBLIC_BACKEND_PATH=http://127.0.0.1:8000
PUBLIC_AUTH_API_BASE_URL=http://127.0.0.1:8000
PUBLIC_SSE_KEY=<set_hex_key_here>
PUBLIC_API_TIMEOUT_MS=15000
AUTH_PROFILE_CACHE_TTL_MS=300000
AUTH_PROFILE_CACHE_MAX_ENTRIES=300

```

Gunakan `astro/.env.example` sebagai template lokal. Jangan commit nilai secret nyata ke repository.
