# jarvis_project

A simple CRM for customers and jobs, built for the Trimble 2026 Global Hackathon. It's the foundation for the "Jarvis" assistant planned for later.

- Frontend: React 19, TypeScript, Vite, React Router and Trimble Modus Web Components
- Backend: Express 5, TypeScript and Mongoose 9, with data stored in MongoDB Atlas
- Hosting: one Azure App Service that serves both the API and the React app

The product requirements and the phased implementation plan are in [`plans/`](./plans).

## Status

Phases 1 and 2 of the [plan](./plans/simple-crm-phase-1-plan.md) are done:

- The Modus app shell with side navigation (Customers, Jobs)
- Customers with name (required), company, email (format checked), phone, address and notes
- A customers list that can be sorted by name or created date, a detail page for each customer (`/customers/:id`), and one form shared by the create and edit pages, with validation messages next to the fields
- Loading indicators, an empty state with a "New customer" action, a not-found page for unknown records and routes, and error messages when a request fails
- `GET /api/health`, `GET | POST /api/customers` and `GET | PATCH /api/customers/:id` (404 for unknown or malformed ids)
- One error format for every API error: `{ error: { message, fields? } }`
- Server and client test suites, and a manual deployment script for Azure

The Jobs page is still a placeholder. Jobs come in phase 3.

> There is no login. Anyone with the deployed URL can read and change the data, so use only fictional data.

## Getting started

You need Node 22 or newer and a MongoDB Atlas connection string.

```sh
npm install
cp server/.env.example server/.env   # then set MONGODB_URI (and PORT if needed)
npm run dev
```

Open http://localhost:5173. Vite proxies `/api` to the Express server on port 3001.

`server/.env` is git-ignored. Never commit a connection string.

## Scripts

Run these from the repo root.

| Command | What it does |
| --- | --- |
| `npm run dev` | Builds `shared`, then runs the shared type watcher, the API server (`tsx watch`) and Vite together |
| `npm test` | Runs all tests: server (Vitest + Supertest against an in-memory MongoDB) and client (Vitest + React Testing Library) |
| `npm test -w server` / `npm test -w client` | Runs the tests for one workspace |
| `npm run typecheck` | Type-checks every package |
| `npm run build` | Builds the production bundle |
| `npm start` | Runs the production server, which serves `/api` and `client/dist` |

## Project layout

An npm-workspaces monorepo with three packages:

- `shared/`: the API contract types (`Customer`, `CustomerInput`, `CustomerPatch`, `Address`, `ApiErrorBody`, `HealthResponse`) and the validation rules that both client and server use
- `server/`: the Express API. `src/app.ts` is the app factory and `src/index.ts` is the process entry point.
- `client/`: the React app. `src/api/client.ts` is the typed API client, which pages use through hooks in `src/hooks/`.
- `scripts/deploy-azure.ps1`: the Azure deployment script
- `plans/`: the PRD and the implementation plan

## Deploying to Azure

Run this in PowerShell after `az login`.

First deployment (creates the resource group, App Service plan and web app):

```powershell
./scripts/deploy-azure.ps1 -ResourceGroup <rg> -AppName <globally-unique-name> -Subscription <sub> -Provision -MongoUri '<atlas uri>'
```

Then add the outbound IP addresses the script prints to the Atlas network access list.

Redeploy:

```powershell
./scripts/deploy-azure.ps1 -ResourceGroup <rg> -AppName <name>
```

The script zip-deploys the source. App Service runs `npm install` and `npm run build`, then starts the app with `npm start`. The app is served at `https://<AppName>.azurewebsites.net`.
