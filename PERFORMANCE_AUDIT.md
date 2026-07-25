# CRM load-performance audit

## Diagnosis
The old live path called `קבלת_נתוני_ליבה_Build13`, which returns the full CRM payload before the dashboard is usable. That payload includes projects, contacts, links, full tasks, settings and permissions. The request-scoped read cache reduced duplicate reads within one Apps Script execution, but it did not reduce the initial JSON payload or defer module datasets.

## Instrumentation
Temporary instrumentation is present but disabled by default with `BH_PERF_AUDIT_ENABLED = false`. When enabled for one request it logs only aggregate timings, physical Sheet read counts and payload byte size; it does not log record contents.

A callable super-admin-only diagnostic, `BH13_4_מדידת_ליבה_מול_פתיחה(token)`, measures one old full-core execution and one new fast-shell execution and returns only:
- total milliseconds;
- physical Sheet read count by sheet name;
- serialized payload byte size.

## Customer fast-shell correction
Customer domain discovery for the initial shell first uses `BH_CAD_availableDomainsForCustomerMinimal_(contactId)`. For the domain gate it reads only:
- `שיוכים` for active portal-visible links for the authenticated customer contact id;
- `פרויקטים` for the linked project ids and their Assignment Domain values, excluding archived projects;
- `הגדרות_ערכים` for active Assignment Domain options.

After a single domain is auto-selected or a stored selected domain is valid, the real customer dashboard shell additionally reads `משימות` and returns only tasks linked to the selected-domain visible projects, including dated records needed by the initial dashboard/calendar. It does not read notes, timeline, settings administration, permissions administration, full contact lists, or card details. Multi-domain customers still receive the selection gate before normal dashboard data is exposed.

## New loading flow
### Stage 1 fast initial shell
The client calls `קבלת_נתוני_פתיחה_Build13_2` on login. The initial shell contains auth/current user, branding, real authorized dashboard totals, dated task/calendar records required by the initial dashboard where applicable, navigation flags and permission flags. `loadedModules.dashboard` is set only after those dashboard values are actually computed.

### Stage 2 lazy modules
Deferred datasets:
- projects: loaded only by the Projects tab;
- contacts: loaded only by the Contacts tab;
- full task table with project/contact lookup data: loaded only by the Tasks tab;
- settings/admin data: loaded only by Settings and still rejects unauthorized users;
- archive records: loaded only by Archive;
- project/contact/task card details: loaded through dedicated card endpoints.

## Authorization rules
Every lazy endpoint validates the auth token, applies role permissions via the existing user filter, applies Assignment Domain restrictions, applies selected-domain customer filtering only to payloads that include project-related collections, and preserves existing archive behavior unless the Archive module is explicitly requested.

## Measurement status
Actual live production before/after numbers were not obtained from this repository environment because the Apps Script service and production spreadsheet cannot be executed locally. Use `BH13_4_מדידת_ליבה_מול_פתיחה(token)` with a super-admin token in Apps Script to obtain verified production totals without exposing record contents.

## Production rollout and fallback
`CRM_FAST_SHELL_DEFAULT_MODE` is `privileged`: the first rollout applies to a cached owner or primary administrator. Operations can set `window.CRM_FAST_SHELL_MODE` to `on` or `off` before startup. A transport failure or a response that fails the versioned opening-shell schema triggers exactly one direct full-core fallback; the fallback does not call the shell again. A successful shell never starts a background full-core request. Mutation `refreshCore` behavior is intentionally unchanged.

The expected startup request count is one server call in both the successful old and new paths (two only on fallback). The old response contains every core collection; the shell contains dashboard aggregates and dated calendar tasks, so its returned-record count and serialized bytes scale with initial calendar records rather than all CRM records. Exact byte/read comparisons must be collected against production with the existing diagnostic because repository tests have no spreadsheet access.

## Manual verification checklist
The deploy owner must exercise: owner, primary administrator, manager, regular user, customer (including the domain gate), a user with no projects, and a large dataset; browser refresh and post-email-code login; first and second opening of every module; and an intentionally failed/malformed shell confirming one full-core fallback. Verify branding, user name, dashboard totals, initial calendar, navigation permissions, and absence of pre-selection customer data. This checklist requires the deployed Apps Script and production spreadsheet and therefore cannot be completed in the repository-only test environment.
