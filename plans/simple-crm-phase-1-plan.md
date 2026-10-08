# Plan: Simple CRM — Phase 1 (Customers & Jobs)

> Source PRD: [simple-crm-phase-1.md](./simple-crm-phase-1.md)

## Architectural decisions

Decisions that apply to every phase:

- **Repo layout**: an npm-workspaces monorepo with three packages: `client` (React + TypeScript + Vite + React Router + Trimble Modus), `server` (Express + TypeScript + Mongoose), and `shared` (types and constants used by both).
- **Shared contract**: the `Customer`, `Job`, `Address` and `JobStatus` types, the job status list, and the API error shape live only in `shared`. Client and server both import them from there.
- **API routes** (all JSON, under `/api`):
  - `GET /api/health`
  - `GET | POST /api/customers`, `GET | PATCH /api/customers/:id`
  - `GET | POST /api/jobs` (`GET` accepts the optional filters `?status=` and `?customerId=`), `GET | PATCH /api/jobs/:id`
- **Client routes**:
  - `/` redirects to `/customers`
  - `/customers`, `/customers/new`, `/customers/:id`, `/customers/:id/edit`
  - `/jobs` (accepts `?status=`), `/jobs/new` (accepts `?customerId=`), `/jobs/:id`, `/jobs/:id/edit`
  - Any other path shows a not-found page.
- **Key models**:
  - **Customer**: `name` (required), `company`, `email` (validated format), `phone`, `address`, `notes`, `createdAt`, `updatedAt`.
  - **Job**: `title` (required), `customer` (a reference to a customer that must exist), `status` (`scheduled` | `in_progress` | `done` | `cancelled`, defaults to `scheduled`), `description`, `scheduledStart`, `scheduledEnd` (end can't be before start), `siteAddress`, `price` (USD, ≥ 0), `createdAt`, `updatedAt`.
  - **Address** (embedded in both): `street`, `city`, `state`, `postalCode`, `country`. All fields are optional.
  - Jobs returned by the API include a customer summary `{ id, name }`.
  - A job's site address is a copy of the customer's address taken when the job is created. Later changes to the customer don't update it.
- **Error contract**: `{ error: { message, fields? } }`. Status codes: 400 for validation errors (with `fields`), 404 for unknown or malformed ids, 500 for anything unexpected. A single error-handling middleware produces every error response.
- **Server shape**: an app factory that receives its database connection, kept separate from the process entry point, so tests can run it against an in-memory MongoDB.
- **Client data access**: a typed API client built on `fetch`, used through small custom hooks. There is no global state library. Sorting and filtering happen in the browser, and nothing is paginated.
- **Configuration**: `MONGODB_URI` and `PORT` come from environment variables, set in a git-ignored `.env` locally and as App Service settings on Azure.
- **Hosting**: one Azure App Service (Linux, Node LTS). Express serves `/api` and the built React app, and sends unknown routes to the React app's `index.html`. Deployment is manual.
- **Auth**: none in phase 1. Use only fictional data on the public deployment.
- **Testing**: server tests use Vitest + Supertest + an in-memory MongoDB. Client tests use Vitest + React Testing Library with the API client mocked, and check behavior through accessible roles and labels.

---

## Phase 1: Tracer bullet — create and list customers, deployed to Azure

**User stories**: 1, 2, 5, 44, 45, 53, 54, 55, 56, 57, 58, 59, 60

### What to build

The thinnest path through every layer. Set up the monorepo with the client, server and shared packages, and a single root command that runs client and server together, with the Vite dev server proxying `/api` to Express. The server connects to Atlas through `MONGODB_URI` and exposes `/api/health`. It also has the error-handling middleware that returns the shared error format.

A Customer model with only `name` (required) is enough for now, plus `GET` and `POST /api/customers`. The client renders the Modus app shell with a side navigation containing Customers and Jobs; Jobs is a placeholder for now. The customers list page shows customers in a table with name, company, email and phone columns; the last three are empty for now. A minimal "new customer" form takes a name.

Set up both test suites with at least one meaningful test each. Finally, build the production bundle, have Express serve it, and deploy it manually to an Azure App Service connected to Atlas.

### Acceptance criteria

- [ ] One root command starts client and server locally, and the app loads in the browser with the Modus shell and side navigation.
- [ ] `GET /api/health` reports OK when the database is connected.
- [ ] Creating a customer with a name adds it to the customers list, and it is still there after a page reload, so it is stored in Atlas.
- [ ] `POST /api/customers` without a name returns 400 in the shared error format, with a `fields.name` message.
- [ ] `Customer` and the error type are defined in `shared` and used by both client and server.
- [ ] Server tests (in-memory MongoDB) cover create, list and the missing-name 400. A client test covers the create form.
- [ ] `.env` is git-ignored, and a committed example file documents `MONGODB_URI` and `PORT`.
- [ ] The app runs at a public Azure App Service URL. Refreshing on a client route such as `/customers` works, and `/api/health` works there too.
- [ ] CLAUDE.md is updated with the install, dev, test and deploy commands.

---

## Phase 2: Complete customer management (all fields, detail page, edit, sort)

**User stories**: 2, 3, 4, 6, 7, 8, 9, 10, 11, 14, 46, 47, 48, 49, 50, 51, 52

### What to build

Make customers fully usable. Add the remaining fields to the model and the shared type: company, email (format validated), phone, address and notes. Add `GET` and `PATCH /api/customers/:id`, with 404 for unknown or malformed ids.

Build a customer form that is shared by the create and edit pages. It mirrors the server's validation and shows field-level messages from 400 responses. Add the customer detail page at `/customers/:id` and the edit page at `/customers/:id/edit`. The customers list can be sorted by name and by created date.

Add the common UI states used from here on: loading indicators, an empty list with a "create" action, a not-found page for unknown records and routes, and a visible message when a server request fails.

### Acceptance criteria

- [ ] A customer can be created and edited with every field. Name is the only required field.
- [ ] An invalid email is rejected by the server (400 with `fields.email`), and the form shows the message next to the email field.
- [ ] `/customers/:id` shows every customer field and can be bookmarked or reloaded. An unknown or malformed id shows the not-found page, and the API returns 404 for it.
- [ ] Back and forward navigation between the list, detail and edit pages works as expected.
- [ ] The customers list can be sorted by name (A→Z, Z→A) and by created date (newest or oldest first).
- [ ] An empty customers list shows an empty state with a "New customer" action. A loading indicator shows while data loads, and server failures show an error message.
- [ ] Server tests cover get-by-id, patch, the email validation, and 404 for unknown and malformed ids. Client tests cover form validation and how server field errors are displayed.

---

## Phase 3: Complete job management (create, list, detail, edit, filter, sort)

**User stories**: 12, 13, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 43

### What to build

Build jobs end to end. Add the Job model with all of its fields and the matching shared types (`Job`, `JobStatus`, the status list and its display labels). The fields are title, customer, status (defaults to Scheduled), description, scheduled start and end dates (end can't be before start), site address, and price (USD, ≥ 0). Index the `customer` and `status` fields.

Add `GET` and `POST /api/jobs` and `GET` and `PATCH /api/jobs/:id`. Every job returned includes the customer summary. Creating or updating a job checks that the customer exists. `PATCH` allows any status change and moving a job to a different customer. `GET /api/jobs` supports the `?customerId=` and `?status=` filters.

The Jobs entry in the side navigation leads to a jobs list with title, customer name, status, scheduled start and price columns. The list has a status filter kept in the URL (`/jobs?status=in_progress`) with a clear action, and can be sorted by scheduled start, title and created date.

A job form is shared by `/jobs/new` and `/jobs/:id/edit`. It has a customer picker filled from existing customers, and selecting a customer copies that customer's address into the site address, which the user can still edit. `/jobs/new?customerId=…` opens the form with that customer already selected. The job detail page at `/jobs/:id` shows every field, formats the price as USD, and links to the customer's page.

The customer detail page shows that customer's jobs with their statuses and has a "New job" action that opens the form with that customer selected.

### Acceptance criteria

- [ ] A job can be created with only a title and a customer. Its status defaults to Scheduled, and it appears in the jobs list with the customer's name.
- [ ] A job can be created and edited with every field. The detail page shows them all, with the price formatted as USD (for example, $1,250.00), and links to the customer's page.
- [ ] Statuses appear in the UI as Scheduled, In progress, Done and Cancelled, using labels defined in `shared`. A job's status can be changed to any other status, Cancelled included.
- [ ] A job can be moved to a different customer.
- [ ] The API returns 400 with field messages for a missing title, a missing customer, an unknown customer id, an invalid status, an end date before the start date, or a negative price. The form catches the date and price errors before submitting.
- [ ] Selecting a customer in the job form fills the site address with that customer's address, and the user can then change it. Editing the customer's address later doesn't change existing jobs.
- [ ] `GET /api/jobs?customerId=…` returns only that customer's jobs. `GET /api/jobs?status=…` returns only jobs with that status, and an invalid status value returns 400.
- [ ] A customer's detail page lists their jobs with status, each linking to the job's page, and shows an empty state when they have none. Its "New job" action opens the form with that customer selected and the site address filled in.
- [ ] Choosing a status filter updates the URL. Opening that URL directly shows the same filtered list, and clearing the filter shows all jobs again.
- [ ] The jobs list can be sorted by scheduled start date (jobs without a date sort last), by title, and by created date.
- [ ] Unknown or malformed job ids show the not-found page, and the API returns 404 for them. The jobs list has the same empty, loading and error states as the customers list.
- [ ] Server tests cover create, list, get-by-id and patch (including status and customer changes), the customer summary in responses, every validation case above, both filters, and the 404s. Client tests cover the job form's defaults and customer picker, the site-address prefill, the date and price validation, the status filter staying in sync with the URL, and the customer being preselected from `?customerId=`.
- [ ] The build is redeployed to Azure, and the full flow works there: create a customer, add jobs to it, filter and sort the jobs list, and edit a job.

---

## Deferred to a later plan: deletes

Deleting customers and jobs (PRD user stories 15, 16, 17 and 42) is not part of this plan and will be covered in a later phase. Until then, the API has no `DELETE` endpoints and the UI has no delete actions. To retire a job, set its status to Cancelled.

The PRD's design for deletes still stands for when that phase is planned:
- `DELETE /api/customers/:id` and `DELETE /api/jobs/:id`, each confirmed with a Modus dialog.
- A customer who still has jobs can't be deleted. The API returns 409 with an explanation, and the UI shows it.
