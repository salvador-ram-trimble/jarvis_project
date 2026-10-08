# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`jarvis_project` is a simple CRM (customers and jobs) built for the Trimble 2026 Global Hackathon. The PRD and the phased plan are in `plans/`. Phase 1 (the tracer bullet: create and list customers, deployed to Azure) is implemented.

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

- `shared` (`@jarvis/shared`): the API contract types (`Customer`, `CustomerInput`, `ApiErrorBody`, `HealthResponse`). It's compiled to `shared/dist`, so build it (any root script does) before the server or client can see changes. Client and server must take these types from here, never redefine them.
- `server` (`@jarvis/server`): Express 5 + Mongoose 9, ESM.
  - `src/app.ts`: `createApp({ connection, clientDistPath })` is the app factory. Models are registered on the connection it is given (see `models/customer.ts`), which is how tests run it against `mongodb-memory-server` (`test/testDb.ts`).
  - `src/index.ts`: the process entry point. It loads `server/.env`, connects to `MONGODB_URI`, and listens before the database connects, so `/api/health` can report a database problem (503).
  - `src/errors.ts`: the single error middleware. It produces every error response as `{ error: { message, fields? } }`: Mongoose validation → 400 with `fields`, cast errors (malformed ids) → 404, bad JSON → 400, and anything else → 500. Throw an `HttpError` for other statuses. Express 5 forwards rejected promises from async handlers to it.
  - Import Mongoose as a default import (`mongoose.Schema`, `mongoose.ConnectionStates`). Node's ESM loader can't see some of its named exports, even though Vitest can.
- `client` (`@jarvis/client`): React 19 + Vite + React Router 7 + Modus Web Components (`@trimble-oss/moduswebcomponents-react`, pinned to an exact version).
  - `src/api/client.ts` is the typed `fetch` wrapper. It throws `ApiError` with `status`, `message` and `fields`. Pages use it through small hooks in `src/hooks/`. There is no global state library.
  - `src/components/AppShell.tsx` holds the Modus navbar and side navigation. The side nav floats over the page, so the shell offsets `<main>` by the nav's width itself.
  - Modus inputs report changes through custom events, which React renders a tick late. Forms keep their latest values in a ref and read that on submit (see `CustomerForm.tsx`), so an Enter right after typing isn't lost.
  - Modus components don't render in jsdom. `src/test/setup.ts` replaces the whole Modus React package with the plain-element stand-ins in `src/test/modusMock.tsx`, and tests query by role and label. Add a stand-in there for every new Modus component you use.
