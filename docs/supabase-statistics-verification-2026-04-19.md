# Supabase Verification: Statistics V2 and History Notes

Date: 2026-04-19

## Scope

This verification covers the remote Supabase project used by the Laundry web app, with focus on:

- `history`
- `history_items`
- statistics aggregation for the new `/api/statistics` endpoint
- the `notes` field path in history records

## What was verified

### 1. Schema alignment

Remote checks confirmed:

- `history` exists
- `history_items` exists
- the application code expects `history.notes`
- the remote database currently does **not** have `history.notes`

Impact:

- the original history detail path could not rely on `history.notes` from the remote table
- a compatibility fallback was required in code until the migration is applied remotely

### 2. Relationship integrity

Runtime validation confirmed that deleting a `history` row also deletes its related `history_items` rows.

Practical result:

- `history_items.history_id -> history.id` is already behaving as cascade delete in the live project

### 3. Statistics API consistency

The new web route:

- `/api/statistics`

was validated against live data using the same Supabase project.

Checked cases:

- `7d`
- `30d`
- one `custom` range

Result:

- the API response matched the manual aggregation from `history + history_items`

### 4. Missing SQL function

The remote database currently does **not** have:

- `public.get_statistics_aggregates(start_date date, end_date date, type_filter text)`

Impact:

- the web API uses a safe fallback path
- if the RPC does not exist, the server aggregates from repository data instead

### 5. History notes bug

The bug root cause was not only UI.

The main issue in the live project is:

- the remote database does not yet expose `history.notes`

Fix implemented in code:

- history reads now use explicit field selection instead of broad selection
- the repository tries the `notes` column first
- if `history.notes` is missing remotely, the repository falls back to an internal note bridge stored in `notes`
- history detail UI already reads `selected.notes`, so once the repository returns the value, the modal renders it correctly

## Code changes tied to this verification

### Repository

File:

- `C:\Users\Paulo Henrique\Downloads\laundry-main\laundry-main\packages\data\src\index.ts`

Relevant changes:

- explicit `history` field selection
- fallback query when `history.notes` is missing
- internal note sync and recovery helpers
- filtering of internal fallback notes out of the notes board
- explicit type filter normalization

### Statistics API

File:

- `C:\Users\Paulo Henrique\Downloads\laundry-main\laundry-main\apps\web\src\app\api\statistics\route.ts`

Relevant changes:

- tries `get_statistics_aggregates(...)`
- falls back to repository-based aggregation when RPC is missing
- preserves authenticated user scope via bearer token

### Migration

File:

- `C:\Users\Paulo Henrique\Downloads\laundry-main\laundry-main\supabase\migrations\20260419_statistics_v2_api.sql`

What it adds:

- `history.notes`
- backfill from fallback note rows
- supporting indexes
- guarded foreign key creation
- `get_statistics_aggregates(...)`

## What is still pending on the remote Supabase project

This machine does not currently have a working Supabase admin path for applying schema changes directly.

That means the following is still pending on the remote project:

- apply `20260419_statistics_v2_api.sql`

Until that migration is applied remotely:

- statistics still work through the API fallback
- history notes still work through the internal compatibility fallback
- but the database is not yet in its intended final shape

## Recommended execution order in Supabase

1. Open the SQL editor in the remote Supabase project.
2. Run the audit file:
   - `C:\Users\Paulo Henrique\Downloads\laundry-main\laundry-main\supabase\verification\statistics_audit.sql`
3. Confirm:
   - `history.notes` missing or present
   - relevant indexes status
   - orphan count
   - RPC status
4. Apply:
   - `C:\Users\Paulo Henrique\Downloads\laundry-main\laundry-main\supabase\migrations\20260419_statistics_v2_api.sql`
5. Re-run the audit file.

## Acceptance status

### Already satisfied in code

- data save/read path remains functional
- history notes are returned to the UI through a compatibility path
- statistics API returns correct aggregates
- no destructive data operation was introduced
- performance is improved by preferring aggregated API data and by adding DB indexes in the migration

### Still dependent on remote migration execution

- definitive `history.notes` column in production
- definitive SQL RPC-backed statistics path in production
- final index state in the remote database
