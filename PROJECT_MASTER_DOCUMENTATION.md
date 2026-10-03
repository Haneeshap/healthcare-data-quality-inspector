# QualiCare — Project Master Documentation

## 1. Executive Summary & Architecture

### Product purpose

QualiCare is a local healthcare appointment-data quality inspector. It accepts appointment data in CSV format, checks it against a small set of structural and field-level rules, saves the uploaded dataset and its findings, and provides a dashboard for reviewing and exporting those findings.

The practical value is a fast, repeatable first-pass review before downstream use of appointment data. The current implementation is intentionally narrow: it analyzes one appointment-oriented CSV schema and does not modify source data or connect to an electronic health record, external service, or production healthcare environment.

### Technology stack

| Layer | Implementation |
|---|---|
| Web client | Next.js 16 App Router, React 19, TypeScript 5 |
| UI and icons | Hand-authored CSS in `globals.css`; Lucide React icons |
| API | NestJS 12, TypeScript 6, Express platform |
| CSV parsing | `csv-parse/sync` |
| Persistence | Prisma 6 with SQLite |
| Backend tests and lint | Vitest 4, Oxlint |
| Frontend lint | ESLint 9 with the Next.js configuration |

The frontend is a single client-rendered dashboard page. The API separates HTTP handling, dataset orchestration, CSV parsing, validation, and database access into NestJS modules and services. SQLite is the only configured database provider in the Prisma schema.

### Conceptual architecture and data flow

```text
Browser
  |
  | Next.js App Router page (dashboard, local UI state)
  | fetch() to http://localhost:3000
  v
NestJS API (default port 3000; CORS allows http://localhost:3001)
  |
  +-- GET /                         -> starter health-like greeting ("Hello World!")
  +-- /datasets                     -> DatasetController
        |
        +-- POST /upload            -> validate upload and 5 MiB size limit
        |                              -> parse CSV -> analyzeRecords()
        |                              -> Prisma interactive transaction
        |                                 Dataset + DataRecord + DataIssue rows
        +-- GET /                   -> newest datasets and relation counts
        +-- GET /:id                -> dataset, all records, ordered issues
                                             |
                                             v
                                      SQLite database
                                      DATABASE_URL

Browser dashboard:
  load dataset list -> choose a dataset -> show counts and issues
  upload CSV -> refresh list -> load uploaded dataset
  filter/search issues locally -> export selected dataset issues as CSV
```

For a normal local run, start the backend first on port 3000. The frontend's `next dev` command also defaults to port 3000; when it finds that port occupied by the API, Next.js normally selects the next available port, 3001, which matches the backend's hard-coded CORS origin. This is a convention, not a configured frontend port or API URL, and should be made explicit/configurable before deployment.

## 2. Codebase Directory Map

The repository is split into independently managed frontend and backend applications. There is no root `package.json` or root-level command runner.

```text
.
|-- apps/
|   |-- backend/
|   |   |-- prisma/
|   |   |   |-- migrations/
|   |   |   |-- schema.prisma
|   |   |   |-- dev.db
|   |   |   `-- migration_lock.toml
|   |   |-- src/
|   |   |   |-- generated/prisma/       (generated client; ignored by backend .gitignore)
|   |   |   |-- prisma/
|   |   |   |-- quality/
|   |   |   |-- app.controller.ts
|   |   |   |-- app.module.ts
|   |   |   |-- app.service.ts
|   |   |   `-- main.ts
|   |   |-- test/
|   |   |-- dist/                       (tracked compiled backend output)
|   |   `-- package.json
|   `-- frontend/
|       |-- public/                     (default Next.js starter assets)
|       `-- src/app/
|           |-- globals.css
|           |-- globals.backup.css
|           |-- layout.tsx
|           `-- page.tsx
|-- sample-data/
|   |-- appointments.csv
|   `-- incomplete.csv
`-- docs/                               (no tracked project documentation currently)
```

### Backend files

- `apps/backend/src/main.ts` creates the Nest application, permits browser requests only from `http://localhost:3001`, and listens on `process.env.PORT` or port `3000`.
- `apps/backend/src/app.module.ts` loads environment configuration globally and registers the Prisma and quality modules alongside the starter root controller.
- `apps/backend/src/app.controller.ts` and `app.service.ts` implement `GET /`, returning the starter text `Hello World!`; this is not a detailed health-check endpoint.
- `apps/backend/src/quality/quality.module.ts` wires the dataset controller and service to the Prisma module.
- `apps/backend/src/quality/dataset.controller.ts` exposes CSV upload and dataset read routes.
- `apps/backend/src/quality/dataset.service.ts` validates parsed input, computes findings, writes dataset/record/issue data in a transaction, and queries persisted datasets.
- `apps/backend/src/quality/csv-parser.service.ts` converts CSV text to string-valued records using `csv-parse/sync`.
- `apps/backend/src/quality/quality.service.ts` contains the required-column and record-level validation rules.
- `apps/backend/src/prisma/prisma.module.ts` exports the shared database service; `prisma.service.ts` connects on module initialization and disconnects on teardown.
- `apps/backend/prisma/schema.prisma` is the source of truth for the three persisted models and their relations.
- `apps/backend/prisma/migrations/` contains the initial schema migration and a follow-up migration adding issue row number and severity.
- `apps/backend/prisma.config.ts` points Prisma to the schema/migration paths and reads the required `DATABASE_URL` environment variable.
- `apps/backend/src/quality/*.spec.ts` holds unit and sample-data integration tests. `apps/backend/test/app.e2e-spec.ts` holds the separate Nest root-route end-to-end test.
- `apps/backend/dist/` contains tracked compiled JavaScript and source maps; it is build output, not the source of truth. Generated Prisma client source is ignored and must be generated as part of database/client setup.
- `apps/backend/README.md` is still the generic NestJS starter README; it does not describe this app's API, schema, or database setup.

### Frontend files

- `apps/frontend/src/app/page.tsx` is the entire dashboard and its client-side behavior: API calls, upload handling, UI state, filtering, and report export.
- `apps/frontend/src/app/layout.tsx` supplies the root document, Geist font variables, global stylesheet, and page metadata. The metadata still has the starter title `Create Next App` and description `Generated by create next app`.
- `apps/frontend/src/app/globals.css` defines the dashboard theme, layout, tables, states, animations, and breakpoints at 1100 px, 760 px, and 450 px.
- `apps/frontend/src/app/globals.backup.css` is a tracked alternate/backup stylesheet; the active layout imports only `globals.css`.
- `apps/frontend/next.config.ts` currently contains no custom Next.js configuration.
- `apps/frontend/public/` contains default Next.js/Vercel SVG assets; the page does not use them as application-specific assets.
- `apps/frontend/README.md` is the generic create-next-app guide and currently suggests opening port 3000, which conflicts with the API's default port.
- `apps/frontend/AGENTS.md` contains local Next.js agent guidance. `CLAUDE.md` is tracked but only refers to that file.

### Sample data

- `sample-data/appointments.csv` contains eight appointment records, including one invalid email, one impossible calendar date, one unrecognized status, one missing required patient ID, and one repeated appointment ID. The integration test expects exactly five findings.
- `sample-data/incomplete.csv` has only `patient_name` and `patient_email`, so it exercises missing required header reporting rather than representing the required appointment schema.

## 3. Component & Core Logic Breakdown

### Frontend dashboard

There are no separate reusable React components, custom hooks, context providers, or client-side state libraries at present. `Home` in `page.tsx` is a client component and owns all browser state:

| State | Purpose |
|---|---|
| `datasets` | Dataset list returned by `GET /datasets` |
| `selectedDataset` | Full dataset details and issue list returned by `GET /datasets/:id` |
| `loading` | Initial dataset-list loading state |
| `uploading` | Disables the upload input and changes its label while an upload is in progress |
| `error`, `success` | Dismissible inline feedback |
| `search`, `severityFilter` | Client-side issue table filters |

On mount, the page loads the dataset list. Selecting a row fetches the corresponding details. Uploading a CSV posts a `FormData` field named `file`; after success, the page refreshes the list and opens the newly created dataset. The list shows record and issue counts, while the summary and issue table reflect only the selected dataset. Search matches the lower-cased field, issue type, and description; severity selection supports all, errors, or warnings. Report export creates a CSV in the browser from all issues in the selected dataset, not just the currently filtered rows.

The page contains dashboard, dataset, and issue anchors. The Settings link points to `#settings`, but there is no matching settings section or settings behavior. The displayed local-environment indicators are static text and are not a live API-health signal.

### CSV parser

`parseCsv` uses the synchronous `csv-parse` parser with:

- `columns: true`: the first row supplies object keys.
- `skip_empty_lines: true`: blank input lines are ignored.
- `trim: true`: surrounding whitespace on cell values is trimmed.
- `bom: true`: a UTF-8 byte-order mark is accepted.
- `relax_column_count: false`: records with inconsistent column counts are rejected.

The parser returns each CSV record as `Record<string, string>`. It does not infer types or enforce an allowed-column list.

### Quality analyzer

`analyzeRecords` first normalizes available header names by trimming and lower-casing them. It then applies these rules:

1. **Required columns:** `patient_id`, `appointment_id`, `appointment_date`, and `appointment_status`. Each absent column produces one dataset-level `MISSING_COLUMN` error with a null row number.
2. **Required values:** for required columns that exist, empty/whitespace-only values produce a per-record `MISSING_VALUE` error.
3. **Email format:** a non-empty `patient_email` must match the simple expression `^[^\s@]+@[^\s@]+\.[^\s@]+$`; invalid values are `INVALID_EMAIL` errors. Email is not a required column.
4. **Date format and calendar validity:** a non-empty `appointment_date` must be a real date in exact `YYYY-MM-DD` form; invalid values are `INVALID_DATE` errors.
5. **Appointment status:** non-empty status values are lower-cased and must be one of `scheduled`, `completed`, `cancelled`, or `no_show`; otherwise the analyzer returns `INVALID_STATUS`.
6. **Duplicate appointment ID:** non-empty IDs are trimmed and compared case-insensitively across the uploaded dataset. Each subsequent duplicate produces a `DUPLICATE_RECORD` warning.

Record-level row numbers are currently computed as record index plus two (header is treated as row one). The analyzer does not attempt automatic correction: it stores human-readable suggestions only.

### Dataset service and transaction

`DatasetService.createFromCsv` rejects whitespace-only input, parse failures, and parsed files with no data rows. It analyzes records before entering a Prisma interactive transaction. Within the transaction it creates one `Dataset`, creates a `DataRecord` for every CSV record, creates a `DataIssue` for every finding, and returns counts by severity. An issue with a row number is linked to the corresponding created record using `rowNumber - 2`; dataset-level missing-column findings have a null `recordId`.

Dataset listing sorts by `uploadedAt` descending and includes relation counts. Dataset detail fetches every record and every issue, ordering issues by row number ascending. A missing dataset ID results in a Nest `NotFoundException`.

### HTTP API surface

| Method and path | Behavior | Important details |
|---|---|---|
| `GET /` | Returns `Hello World!` | Nest starter route; not a structured health/readiness response |
| `POST /datasets/upload` | Parses and analyzes a CSV, persists its dataset and findings | Multipart field `file`; original filename must end in `.csv`; 5 MiB upload limit |
| `GET /datasets` | Lists datasets newest first | Includes `_count.records` and `_count.issues` |
| `GET /datasets/:id` | Returns dataset details | Integer route parameter; includes all records and issues |

Successful upload returns `datasetId`, `filename`, `totalRows`, `totalIssues`, `errors`, and `warnings`. Empty files, malformed CSV, and missing data rows are rejected with a bad-request response; invalid upload extension and missing multipart file are also rejected. No update/delete endpoint or issue-resolution endpoint is implemented.

### Database service and application entry point

`PrismaService` subclasses the generated Prisma client and connects/disconnects with Nest module lifecycle hooks. `AppModule` loads `.env` configuration using global Nest `ConfigModule` and composes the Prisma and quality modules. Prisma's own configuration separately reads `DATABASE_URL` for CLI/migration operations.

## 4. Data Models & State Management

### Persisted models

| Model | Fields | Relations and indexes |
|---|---|---|
| `Dataset` | `id` (autoincrement integer), `filename` (string), `uploadedAt` (datetime, defaults to now), `totalRows` (integer, defaults to 0) | Has many `DataRecord` and `DataIssue`; parent deletion cascades to both |
| `DataRecord` | `id`, `datasetId`, nullable `recordIdentifier`, `recordData` (JSON-serialized CSV row stored as text) | Belongs to `Dataset`; has many `DataIssue`; index on `(datasetId, recordIdentifier)` |
| `DataIssue` | `id`, `datasetId`, nullable `recordId`, nullable `rowNumber`, nullable `field`, `issueType`, `severity` (defaults to `ERROR`), `description`, nullable `suggestedCorrection`, `status` (defaults to `OPEN`) | Belongs to `Dataset`; optional `DataRecord` relation uses `SetNull` on record deletion; index on `(datasetId, status)` |

The schema uses SQLite and declares severity and status as strings, not database enums. The current analyzer emits `ERROR` and `WARNING`; issue status is initialized to `OPEN` and is not changed by the application. The database has no user, organization, tenant, audit-history, rule-configuration, or corrected-record model.

The initial migration creates the three tables and indexes. The second migration adds nullable `rowNumber` and `severity` with the `ERROR` default to `DataIssue`.

### State ownership

- **Durable state:** datasets, raw record JSON, and findings in SQLite through Prisma.
- **Transient state:** all dashboard selection, loading, alert, search, and severity-filter state is held in React `useState` within the single dashboard component. Reloading the page refetches server state; there is no cross-page or browser-persisted state store.
- **Configuration:** API URL and allowed CORS origin are hard-coded in application source. The database URL is environment-provided as `DATABASE_URL`; no project-level `.env.example` or root setup guide is present.

## 5. Current Implementation Status

The following capabilities are implemented end to end in source. Backend behavior is supported by unit/integration tests; the frontend and backend production builds completed successfully during documentation review.

- CSV upload from the dashboard with browser-side `.csv` extension selection and server-side extension/size checks.
- CSV parsing with header-based records, BOM handling, whitespace trimming, blank-line skipping, and strict column-count validation.
- Detection of the four required columns and empty values in those columns.
- Detection of invalid non-empty email values, impossible or wrongly formatted dates, unknown appointment statuses, and repeated appointment IDs.
- Persistence of dataset metadata, each source record, and each finding in a transaction.
- Dataset history ordered newest first, relation counts, and retrieval of a selected dataset's records and findings.
- Dashboard dataset/record totals, selected-dataset error and warning totals, issue summary visualization, issue search, severity filtering, and browser-generated issue-report CSV export.
- Sample appointment data and parser/analyzer regression tests. The backend Vitest suite completed with **14 tests passing across 4 test files**.
- Backend TypeScript/Nest build completed successfully; frontend Next.js production build completed successfully.

These checks establish that the current local implementation builds and its covered backend logic passes tests. They do **not** establish production readiness, compliance, operational reliability, or coverage of every frontend/API edge case.

## 6. Known Issues, Tech Debt & Visual Bugs

### Confirmed behavior and usability gaps

- **Dataset-level findings have no row number.** Missing-column issues are stored with `rowNumber: null`. The frontend `Issue` type declares a number and the table renders `#${issue.rowNumber}`, so these findings appear as `#null` (or an equivalent null rendering) rather than being identified as dataset-level.
- **Reported row numbers are approximate for general CSV files.** The analyzer derives row numbers from parsed-record index plus two. Since blank lines are skipped and quoted fields can span physical lines, reported numbers can diverge from physical CSV line numbers for those inputs.
- **No issue workflow exists.** The UI displays `OPEN` status but cannot resolve, dismiss, annotate, or edit a finding. Suggestions are explanatory text only; source records are never corrected.
- **Settings and navigation are partly decorative.** Settings points to a missing `#settings` target; the profile, local-workspace, connection, and assistance presentation is static and has no account/settings/health functionality.
- **No dataset detail loading indicator or stale-request protection.** Selecting datasets triggers a request without a dedicated loading state or cancellation/version guard. Rapid selections can transiently show stale results if requests complete out of order.
- **No pagination or server-side filtering.** Dataset details return all records and all findings and the frontend renders the full issue list. Large accepted files can produce large database responses and browser-rendering costs.
- **Upload limit and write strategy constrain scale.** Upload is capped at 5 MiB and the service inserts each record and issue individually, sequentially, inside one transaction. This is reasonable for a small local utility but can make near-limit datasets slow.
- **CSV record identifier extraction assumes exact lowercase header spelling.** Validation accepts case/whitespace-normalized headers, but persistence reads `record.appointment_id` directly. A CSV using a valid normalized variant such as `Appointment_ID` can pass analyzer checks while storing a null record identifier.
- **Export row value mismatch and filter behavior:** report export intentionally takes all selected-dataset issues rather than the filtered table, and dataset-level nullable row numbers serialize through string conversion as `"null"`. The export does not include the raw record or dataset filename.
- **Frontend metadata and onboarding documentation are stale.** The HTML title/description remain create-next-app defaults; both app READMEs are framework starter documentation. The frontend README suggests port 3000 although that is also the backend's default port.
- **Sample synthetic-data boundary is only a UI statement.** The footer says “Synthetic data only,” but the application does not technically prevent real patient data from being uploaded or persisted. Do not treat this as a privacy or compliance safeguard.

### Validation and maintainability findings

- Frontend `npm run lint` currently fails with one ESLint error: `react-hooks/set-state-in-effect` at the mount effect that calls `loadDatasets()` in `apps/frontend/src/app/page.tsx`. The production build still passed TypeScript and Next.js compilation, but the lint finding should be resolved before making lint a clean CI gate.
- API URL (`http://localhost:3000`) and backend CORS origin (`http://localhost:3001`) are hard-coded. They are not configurable for staging, alternate local ports, HTTPS, or deployment.
- CORS permits one exact local origin only; deployment requires an explicit origin policy. No authentication or authorization is implemented, so the current “local workspace” is not a multi-user or internet-facing deployment model.
- `GET /` is the Nest starter greeting rather than a readiness check that verifies database connectivity. No structured logging, metrics, tracing, health endpoint, or error-monitoring integration is configured.
- Schema fields `severity` and `status` are free-form strings. The frontend duplicates API response shapes manually; notably its issue type currently treats nullable server fields as non-null.
- The root has no unified workspace scripts, setup guide, or environment template. Backend README, frontend README, frontend metadata, starter root API route, and tracked `dist/` output should be reviewed as the project moves beyond local development.

## 7. Next Steps & Development Roadmap

### P0 — Make local and deployed configuration reliable

1. **Externalize origins and ports.** Introduce validated backend configuration for the listening port and allowed frontend origins, and a public frontend API-base setting. Document the expected local ports instead of relying on Next.js to select 3001 as a side effect.
2. **Provide reproducible database setup.** Add a safe environment example naming `DATABASE_URL`, document Prisma client generation and migration application, and verify the documented commands from a clean checkout. Do not publish secrets or real patient data in the template.
3. **Establish a data-handling boundary before real use.** Decide whether this remains synthetic/local-only or will accept real healthcare data. If real data is in scope, add a reviewed authentication/authorization and privacy/security design before exposing the service; the present UI copy is not enforcement.
4. **Restore a clean lint gate.** Refactor initial data loading so it complies with React's effect lint rule, then require frontend lint alongside backend lint and build in CI.

### P1 — Correct data semantics and usability

1. **Represent dataset-level findings explicitly.** Make nullable row numbers part of the frontend/API contract and render missing-column findings as dataset-level rather than `#null`; cover that path in API/UI tests and report export.
2. **Track source row positions accurately.** Preserve physical CSV line numbers (including skipped blank lines and quoted multiline cells), or document and label record-index numbering so users do not mistake it for a physical line number.
3. **Normalize schema lookup consistently.** Use the same case/whitespace-insensitive field lookup when extracting `recordIdentifier`, with tests for normalized headers.
4. **Add issue lifecycle operations only with defined semantics.** If the product needs remediation, define valid status transitions and APIs (for example, open/resolved), expose them in the UI, and preserve an audit trail rather than leaving every issue permanently `OPEN`.
5. **Replace starter-facing surfaces.** Add a real health/readiness endpoint, update page metadata and both READMEs, and remove or implement the dead Settings navigation and static connection claims.
6. **Expand end-to-end coverage.** Cover upload success and failure, persistence, dataset listing/detail, missing dataset IDs, schema-missing findings, and browser rendering for nullable/API response fields. The current Vitest run covers backend unit/integration tests; the separate `test:e2e` suite has not been validated as part of this review.

### P2 — Scale analysis and support additional workflows

1. **Add bounded dataset and issue reads.** Introduce pagination and server-side search/severity filtering, and make dataset detail omit or page through raw record payloads when the dashboard only needs issue data.
2. **Batch database writes and profile large CSVs.** Replace sequential per-row inserts with tested bulk operations or bounded chunks while preserving transaction consistency; benchmark parsing, analysis, persistence, and response size at and above realistic workload targets before changing the 5 MiB limit.
3. **Make validation rules extensible.** Define a versioned, documented rule/schema profile rather than expanding hard-coded appointment checks ad hoc. Keep the current rule behavior stable with regression fixtures.
4. **Improve export and review ergonomics.** Include explicit dataset-level rows and dependable line references in exports, decide whether export should follow active filters, and test quoting, empty values, and CSV injection-safe output.
5. **Build operational safeguards if deployment is pursued.** Add CI for both applications, database migration checks, structured logs and request correlation, backup/restore guidance for SQLite (or a reviewed server database migration), and an explicit deployment/retention model.

## Local Development & Verification

There is no root-level package script; install and run each application from its own directory.

```powershell
# Backend
Set-Location apps\backend
npm install
# Set DATABASE_URL in the environment or an ignored .env file before Prisma operations.
npm run start:dev

# In another terminal, start the frontend after the backend.
Set-Location apps\frontend
npm install
npm run dev
```

With the backend occupying port 3000, Next.js normally uses port 3001, which is the only origin currently allowed by backend CORS. Confirm the printed Next.js URL rather than assuming the port. The UI's API base remains hard-coded to `http://localhost:3000`.

Available project scripts:

| Directory | Command | Purpose |
|---|---|---|
| `apps/backend` | `npm run start:dev` | Watch-mode NestJS API |
| `apps/backend` | `npm run build` | Compile NestJS backend |
| `apps/backend` | `npm test` | Run Vitest `*.spec.ts` tests |
| `apps/backend` | `npm run test:e2e` | Run separate `*.e2e-spec.ts` tests |
| `apps/backend` | `npm run lint` | Oxlint on `src/` and `test/` |
| `apps/frontend` | `npm run dev` | Next.js development server |
| `apps/frontend` | `npm run build` | Optimized Next.js production build |
| `apps/frontend` | `npm run lint` | ESLint |

The checked-in sample fixtures are intended for synthetic test/demo data. The API's current database location depends on `DATABASE_URL`; the checked-in `apps/backend/prisma/dev.db` is an existing SQLite file, not a substitute for documenting environment-specific database configuration.
