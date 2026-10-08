# PRD: Simple CRM — Phase 1 (Customers & Jobs)

## Problem Statement

A small field-service business (or a team inside one) tracks its customers and the work it does for them in spreadsheets, notes and memory. There is no single place to see who a customer is, how to contact them, and which jobs are scheduled, in progress, done or cancelled for them. As a result, it is hard to answer simple questions such as "what are we working on right now?", "what is scheduled next?" or "what have we done for this customer?", and details such as a job site address or an agreed price get lost.

For the Trimble 2026 Global Hackathon, we want a small, working CRM that solves this core problem end to end, as a foundation for more ambitious features later (the "Jarvis" assistant).

## Solution

A simple web-based CRM with two core records: **Customers** and **Jobs**.

- Users can create, view, edit and delete customers, with contact details, an address and notes.
- Users can create, view, edit and delete jobs. Each job belongs to exactly one customer and has a status (Scheduled, In progress, Done, Cancelled), a description, scheduled start and end dates, a job site address and a price in USD.
- The app has a side navigation with a **Customers** list and a **Jobs** list. Each record has a detail page. A customer's detail page shows that customer's jobs and has a "New job" action that pre-fills the customer.
- The jobs list can be filtered by status, and both lists can be sorted.
- There is no login. Everyone using the app sees and edits the same data.
- The frontend is React (TypeScript) styled with Trimble Modus. The backend is an Express (TypeScript) REST API that stores data in MongoDB Atlas. The app is deployed to Azure.

## User Stories

### Customers

1. As a user, I want to see a list of all customers, so that I can quickly find who we work with.
2. As a user, I want the customer list to show name, company, email and phone, so that I can identify and contact a customer without opening their record.
3. As a user, I want to sort the customer list by name, so that I can find a customer alphabetically.
4. As a user, I want to sort the customer list by created date, so that I can see the newest customers first.
5. As a user, I want to create a customer with just a name, so that I can capture a new contact quickly even when I don't have all their details.
6. As a user, I want to optionally record a customer's company name, so that I can tell individuals and businesses apart.
7. As a user, I want to record a customer's email and phone number, so that I can contact them.
8. As a user, I want to be told when an email address is not valid, so that I don't save contact details I can't use.
9. As a user, I want to record a customer's address (street, city, state/region, postal code, country), so that I know where they are located.
10. As a user, I want to add free-text notes to a customer, so that I can remember important context about them.
11. As a user, I want to open a customer's detail page, so that I can see all their information in one place.
12. As a user, I want to see all of a customer's jobs on their detail page, so that I can understand our full history with them.
13. As a user, I want to see each job's status on the customer's detail page, so that I know what is active and what is finished for that customer.
14. As a user, I want to edit a customer's details, so that I can keep their information up to date.
15. As a user, I want to delete a customer who has no jobs, so that I can remove contacts added by mistake.
16. As a user, I want to be prevented from deleting a customer who still has jobs, and be told why, so that I don't lose job history by accident.
17. As a user, I want to confirm before a customer is deleted, so that I don't delete one by misclicking.
18. As a user, I want to start creating a new job from a customer's detail page with that customer already selected, so that I can schedule work for them in fewer steps.

### Jobs

19. As a user, I want to see a list of all jobs, so that I can get an overview of all work.
20. As a user, I want the jobs list to show title, customer name, status, scheduled start date and price, so that I can scan the important information at a glance.
21. As a user, I want to filter the jobs list by status, so that I can focus on, for example, only the jobs that are in progress.
22. As a user, I want to clear the status filter, so that I can see all jobs again.
23. As a user, I want to sort the jobs list by scheduled start date, so that I can see what's coming up next.
24. As a user, I want to sort the jobs list by title, so that I can find a job by name.
25. As a user, I want to sort the jobs list by created date, so that I can see the most recently added jobs.
26. As a user, I want to create a job with a title, a customer and a status, so that I can track a piece of work.
27. As a user, I want a new job's status to default to Scheduled, so that I don't have to set it for the common case.
28. As a user, I want to pick the job's customer from my existing customers, so that each job is linked to the right customer.
29. As a user, I want to add a description to a job, so that the scope of work is written down.
30. As a user, I want to set scheduled start and end dates on a job, so that I know when the work is planned.
31. As a user, I want to be told if a job's end date is before its start date, so that I don't save an impossible schedule.
32. As a user, I want the job site address to be pre-filled from the customer's address, so that I don't have to retype it in the common case.
33. As a user, I want to change the job site address, so that I can record work at a location other than the customer's address.
34. As a user, I want to record a price in USD for a job, so that I know what the work is worth.
35. As a user, I want to be prevented from entering a negative price, so that job values stay meaningful.
36. As a user, I want to see prices formatted as US dollars, so that amounts are easy to read.
37. As a user, I want to open a job's detail page, so that I can see all of its information.
38. As a user, I want to go from a job's detail page to its customer's detail page, so that I can quickly see who the work is for.
39. As a user, I want to change a job's status to any other status, so that I can reflect what is really happening (including correcting mistakes).
40. As a user, I want to edit any of a job's details, so that I can keep it accurate.
41. As a user, I want to change which customer a job belongs to, so that I can fix a job assigned to the wrong customer.
42. As a user, I want to delete a job, after confirming, so that I can remove jobs created by mistake.
43. As a user, I want to mark a job as Cancelled rather than deleting it, so that I keep a record of work that didn't happen.

### General experience

44. As a user, I want a side navigation with Customers and Jobs, so that I can move between the two main areas.
45. As a user, I want the app to look and behave like other Trimble products (Modus), so that it feels familiar and professional in the demo.
46. As a user, I want to see clear validation messages next to the fields that are wrong, so that I know exactly what to fix.
47. As a user, I want to see a clear message when something fails on the server, so that I know my change was not saved.
48. As a user, I want to see a loading indicator while data loads, so that I know the app is working.
49. As a user, I want an empty state with a "create" action when a list has no records, so that I know what to do next.
50. As a user, I want to see a "not found" page when I open a customer or job that doesn't exist, so that I'm not left looking at a broken page.
51. As a user, I want each customer and job detail page to have its own URL, so that I can bookmark it or share it with a teammate.
52. As a user, I want the browser back button to work as expected between lists and detail pages, so that navigation feels natural.
53. As a user, I want to reach the app at a public Azure URL, so that I can use and demo it without running anything locally.

### Developer

54. As a developer, I want Customer and Job types shared between client and server, so that the API contract can't silently drift.
55. As a developer, I want to run the client and server locally with a single command, so that I can develop quickly.
56. As a developer, I want the database connection string to come from an environment variable, so that local and Azure environments use the same code and secrets stay out of the repo.
57. As a developer, I want automated API tests that run against an in-memory MongoDB, so that I can verify the backend without touching Atlas.
58. As a developer, I want automated tests for the key frontend forms and pages, so that I can change the UI safely.
59. As a developer, I want a health-check endpoint, so that Azure (and I) can check that the API is up.
60. As a developer, I want a consistent error response format from the API, so that the frontend can show errors in a uniform way.

## Implementation Decisions

### Stack and repository layout

- Monorepo using npm workspaces with three packages:
  - **client**: React + TypeScript, built with Vite, React Router for routing, and Trimble Modus (Modus Web Components through their React wrapper) for UI.
  - **server**: Node.js + Express + TypeScript, with Mongoose as the MongoDB ODM.
  - **shared**: TypeScript types and constants used by both, including the Customer and Job shapes, the job status list, and the API error shape.
- A root-level script starts the client and server together for local development. In development the Vite dev server proxies `/api` requests to Express.
- Data is stored in **MongoDB Atlas** (a free cluster is fine for phase 1). The connection string is provided through a `MONGODB_URI` environment variable, and the port through `PORT`. A local `.env` file is used in development and must not be committed.

### Deployment (Azure)

- A single **Azure App Service** (Linux, Node LTS) hosts the app. Express serves the REST API under `/api` and serves the production build of the React app for every other route, falling back to the SPA entry so client-side routes work on refresh.
- Using one service for both means there are no CORS concerns and only one thing to deploy.
- `MONGODB_URI` is configured as an App Service application setting.
- The Atlas cluster's network access list must allow the App Service's outbound IP addresses.
- Deployment is done manually (for example, a zip deploy of the built output). A CI/CD pipeline is out of scope.

### Data model

**Customer**
- `name`: string, required, trimmed, non-empty
- `company`: string, optional
- `email`: string, optional; if present, must be a valid email format
- `phone`: string, optional, free-form
- `address`: optional embedded object with `street`, `city`, `state`, `postalCode` and `country` (all optional strings)
- `notes`: string, optional
- `createdAt` / `updatedAt`: timestamps managed automatically

**Job**
- `title`: string, required, trimmed, non-empty
- `customer`: reference to a Customer, required; the referenced customer must exist
- `status`: one of `scheduled`, `in_progress`, `done`, `cancelled`; required, defaults to `scheduled`. Any status can be changed to any other status (transitions are not enforced).
- `description`: string, optional
- `scheduledStart` / `scheduledEnd`: dates, optional; if both are present, the end must not be before the start
- `siteAddress`: optional embedded object with the same shape as the customer address
- `price`: number, optional, must be ≥ 0, in USD. Shown in the UI with USD currency formatting.
- `createdAt` / `updatedAt`: timestamps managed automatically

**Site address default:** when the job form opens for a new job, or when the user selects a customer, the frontend copies that customer's address into the job's site address field. The value is then stored on the job as its own copy. Later changes to the customer's address do not change existing jobs.

**Indexes:** an index on Job `customer` (for the customer-detail lookup and the delete check) and on Job `status` (for filtering).

### REST API contract

Every endpoint is under `/api` and uses JSON.

- `GET /api/health`: returns OK when the server and database connection are healthy.
- **Customers**
  - `GET /api/customers`: returns all customers (no pagination).
  - `GET /api/customers/:id`: returns one customer; 404 if not found.
  - `POST /api/customers`: creates a customer; 201 with the created record; 400 on validation errors.
  - `PATCH /api/customers/:id`: partial update; 400 on validation errors, 404 if not found.
  - `DELETE /api/customers/:id`: 204 on success; 404 if not found; **409 Conflict** if the customer has any jobs.
- **Jobs**
  - `GET /api/jobs`: returns all jobs. Optional query filters: `status` and `customerId`. Each job includes a summary of its customer (id and name) so lists can show the customer name without extra requests.
  - `GET /api/jobs/:id`: returns one job with its customer summary; 404 if not found.
  - `POST /api/jobs`: creates a job; 201; 400 on validation errors, including when the customer doesn't exist.
  - `PATCH /api/jobs/:id`: partial update (including status and customer changes); 400 or 404 as appropriate.
  - `DELETE /api/jobs/:id`: 204 on success; 404 if not found.
- An id that isn't a valid MongoDB ObjectId returns 404, not 500.
- **Error shape** (defined in shared): `{ error: { message: string, fields?: Record<string, string> } }`. `fields` maps field names to validation messages for 400 responses, so the frontend can show them next to the relevant inputs.
- Validation happens on the server, which is the source of truth. The client mirrors the simple rules (required fields, email format, end ≥ start, price ≥ 0) for immediate feedback.

### Backend structure

- Express app factory, separate from the process entry point. Tests build the app against an in-memory database; production builds it against Atlas.
- Separate router modules for customers, jobs and health, plus a central error-handling middleware. The middleware converts validation, not-found, invalid-id and conflict errors into the shared error shape and status codes.
- Mongoose models for Customer and Job carry the schema-level validation.

### Frontend structure

- **Routes:** customers list, customer detail, new customer, edit customer, jobs list, job detail, new job (accepts an optional pre-selected customer), edit job, and a not-found route. The root redirects to the customers list.
- **Layout:** Modus app shell with a side navigation (Customers, Jobs) and a main content area.
- A thin, typed **API client module** wraps `fetch` for every endpoint and turns error responses into a typed error that carries the shared error shape. Pages load data through small custom hooks built on that client. No global state library is used.
- **Sorting and status filtering** are done on the client, because lists are not paginated and all records are loaded. The status filter on the jobs list is reflected in the URL query string so the filtered view can be shared.
- Delete actions use a Modus confirmation dialog. When a customer delete is blocked (409), the dialog shows the server's explanation.
- Customer and job forms are reusable components shared by their create and edit pages.

### Testing

- **Server:** Vitest + Supertest against the Express app, using an in-memory MongoDB. Cover CRUD for both resources, the validation rules, the 409 on deleting a customer with jobs, the `status` and `customerId` filters, invalid and unknown ids returning 404, and the error response shape.
- **Client:** Vitest + React Testing Library with the API client module mocked. Cover the customer form and job form (required fields, validation messages, and site address pre-filled from the customer), the jobs list status filter, and the blocked customer delete message.

## Out of Scope

- Authentication, user accounts, roles or per-user data. Phase 1 is a single shared, open workspace.
- Pagination, server-side sorting and free-text search.
- A dashboard or reporting (counts, revenue totals, charts).
- Calendar or scheduling views, technician or crew assignment, and route planning.
- Quotes, invoices, payments, taxes and multiple currencies.
- Enforced status workflows or status history.
- Soft delete or archiving, and audit logs.
- File attachments and photos.
- Email or SMS notifications.
- Import or export (CSV, etc.) and integrations with other Trimble or third-party products.
- Map or geocoding of addresses.
- Mobile apps and offline support. The web app only needs to work in modern desktop browsers.
- Any AI or "Jarvis" assistant features, which are for later phases.
- CI/CD pipelines and infrastructure-as-code for Azure.

## Further Notes

- **Security risk of a public deployment without auth:** because phase 1 has no login, anyone who finds the Azure URL can read, change and delete all data. For the hackathon demo this is acceptable only with **fictional data**. Before real customer data is used, add authentication (for example Trimble Identity or Azure App Service built-in authentication). Restricting access to the App Service is a cheap stop-gap.
- **Modus in tests:** Modus components are web components, which may not fully render or behave in jsdom. Client tests should check behavior through accessible roles and labels, and may need light mocks for Modus components that don't work in jsdom.
- The Modus documentation MCP server is available in this environment and should be used for correct component usage during implementation.
- No pagination is a deliberate trade-off for demo-scale data (hundreds of records at most). Revisit it if datasets grow.
- The next step is to break this PRD into an implementation plan of vertical slices (for example with the `prd-to-plan` skill), starting with a thin end-to-end slice: create and list customers, deployed to Azure.
