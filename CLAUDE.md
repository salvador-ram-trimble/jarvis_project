# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`jarvis_project` is a simple CRM (customers and jobs) built for the Trimble 2026 Global Hackathon. The PRD and the phased plan are in `plans/`. Phases 1 (the tracer bullet, deployed to Azure), 2 (full customer management) and 3 (full job management: create, list, detail, edit, status filter, sorting, and a customer's jobs on their page) are implemented. Deletes are deferred to a later plan.

## Environment

- Development happens on Windows. Both PowerShell and Git Bash are in use, and the repo path contains a space (`C:\Projects\hackathon 2026\jarvis_project`), so quote paths in shell commands.
- Node 22+ (developed on Node 24). TypeScript 7 (the native compiler).

## Commands

Run these from the repo root.

- Install: `npm install`
- Configure: copy `server/.env.example` to `server/.env` and set `MONGODB_URI` (Atlas) and `PORT` (default 3001). `server/.env` is git-ignored.
- Dev: `npm run dev` builds `shared`, then runs the `shared` type watcher, the Express server (`tsx watch`, port 3001) and Vite (http://localhost:5173, proxies `/api` to 3001).
- Test everything: `npm test` (server: Vitest + Supertest against an in-memory MongoDB; client: Vitest + React Testing Library in jsdom).
- One workspace: `npm test -w server` or `npm test -w client`.
- A single test file or test name: `npm test -w server -- customers` or `npm test -w client -- -t "requires a name"`.
- Typecheck: `npm run typecheck`
- Production build and run: `npm run build`, then `npm start` (Express serves `/api` and `client/dist`).
- Deploy to Azure (PowerShell, needs `az login`):
  - First time: `./scripts/deploy-azure.ps1 -ResourceGroup <rg> -AppName <globally-unique-name> -Subscription <sub> -Provision -MongoUri '<atlas uri>'`, then add the outbound IPs it prints to the Atlas network access list.
  - Redeploy: `./scripts/deploy-azure.ps1 -ResourceGroup <rg> -AppName <name>`
  - The script zip-deploys the source. App Service runs `npm install` and `npm run build`, then starts the app with `npm start`.

## Architecture

npm-workspaces monorepo with three packages:

- `shared` (`@jarvis/shared`): the API contract (`Customer`, `CustomerInput`, `CustomerPatch`, `Job`, `JobInput`, `JobPatch`, `JobFilters`, `CustomerSummary`, `Address`, `ApiErrorBody`, `HealthResponse`), the job statuses (`JOB_STATUSES`, `JOB_STATUS_LABELS`, `isJobStatus`), and the validation rules both sides use (`isValidEmail`, `isValidDate`, `isEndBeforeStart`, `isValidPrice`, `validationMessages`). A job's `scheduledStart` and `scheduledEnd` are calendar dates (`YYYY-MM-DD`), stored as midnight UTC, so no time zone can shift them by a day. It's compiled to `shared/dist`, so build it (any root script does) before the server or client can see changes. Client and server must take these from here, never redefine them.
- `server` (`@jarvis/server`): Express 5 + Mongoose 9, ESM.
  - `src/app.ts`: `createApp({ connection, clientDistPath })` is the app factory. Models are registered on the connection it is given (see `models/customer.ts` and `models/job.ts`), which is how tests run it against `mongodb-memory-server` (`test/testDb.ts`).
  - `src/index.ts`: the process entry point. It loads `server/.env`, connects to `MONGODB_URI`, and listens before the database connects, so `/api/health` can report a database problem (503).
  - `src/routes/customers.ts` and `src/routes/jobs.ts` pick only known fields from the body (helpers in `routes/fields.ts`). A blank string (or `null`) means "not set", so on `PATCH` it clears the field, and an address with nothing filled in is stored as no address. `PATCH` replaces the whole `address` / `siteAddress`. The API leaves unset optional fields out of responses.
  - Jobs: every response includes `customer: { id, name }` (populated). The request field is `customerId`, and field errors use request names (`customerId`, not `customer`). `saveJob` in `routes/jobs.ts` collects Mongoose validation, unreadable values (bad dates or prices) and the "customer must exist" check into one 400. End ≥ start is a `pre('validate')` hook, not a path validator, because Mongoose only validates changed paths. `GET /api/jobs` takes `?status=` (400 if invalid) and `?customerId=` (a malformed id returns `[]`). The server never copies addresses: the job form copies the customer's address into the site address.
  - `src/errors.ts`: the single error middleware. It produces every error response as `{ error: { message, fields? } }`: Mongoose validation → 400 with `fields`, cast errors (malformed ids) → 404, bad JSON → 400, and anything else → 500. Throw an `HttpError` for other statuses. Express 5 forwards rejected promises from async handlers to it.
  - Import Mongoose as a default import (`mongoose.Schema`, `mongoose.ConnectionStates`). Node's ESM loader can't see some of its named exports, even though Vitest can.
- `client` (`@jarvis/client`): React 19 + Vite + React Router 7 + Modus Web Components (`@trimble-oss/moduswebcomponents-react`, pinned to an exact version).
  - `src/api/client.ts` is the typed `fetch` wrapper. It throws `ApiError` with `status`, `message` and `fields`. Pages use it through small hooks in `src/hooks/` built on `useApiData` (loading) and `useApiAction` (saving) from `useApi.ts`. Detail and edit pages show `NotFoundPage` when the API returns 404. There is no global state library. `components/Detail.tsx` (`Detail`, `addressBlock`) lays out detail pages, and `components/AddressFields.tsx` is the address fieldset both forms use.
  - Leaving a form (cancel or save on edit) uses `useGoBack`, which goes back in history so Back and Forward behave, and falls back to a replace when the page was opened directly. Creating a record replaces the form entry with the new record's page. List sorting and the jobs status filter live in the URL (`?sort=`, `?status=`) through `useSearchParam`. Lists sort and filter in the browser. Table title/name cells are real links built with `components/tableLink.ts`.
  - `src/components/AppShell.tsx` holds the Modus navbar and side navigation. The side nav floats over the page, so the shell offsets `<main>` by the nav's width itself.
  - Modus inputs report changes through custom events, which React renders a tick late. Forms keep their latest values in a ref and read that on submit (see `CustomerForm.tsx`, `JobForm.tsx`), so an Enter right after typing isn't lost. Both forms send every field, trimmed, so a cleared field is cleared on the server (a cleared price is sent as `null`).
  - Modus quirks: `ModusWcDate` reports its value as `YYYY-MM-DD`, and as `''` while incomplete or invalid. Don't give it `min`, because it silently moves an earlier date up to the minimum instead of letting the form explain the error. `ModusWcBadge` defaults to an `alert`/`status` live-region role, so `JobStatusBadge` passes `role="none"`. Modus table cell renderers return DOM elements, not React elements, so tables show statuses as text.
  - Modus components don't render in jsdom. `src/test/setup.ts` replaces the whole Modus React package with the plain-element stand-ins in `src/test/modusMock.tsx`, and tests query by role and label. Add a stand-in there for every new Modus component you use (the empty state renders its heading as an `h2`, like the real one).
  - `src/test/setup.ts` also mocks every `api` method with `vi.fn()` (reset after each test), so add new API methods there too. `api.customers.list` and `api.jobs.list` resolve to `[]` unless a test says otherwise. Page tests render the whole app at a URL with `renderApp` from `src/test/renderApp.tsx`, which also provides `currentLocation()`, "Browser back" and "Browser forward" buttons, and customer and job fixtures (`makeCustomer`, `fullCustomer`, `makeJob`, `fullJob`).
