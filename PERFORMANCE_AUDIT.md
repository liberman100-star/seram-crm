# CRM load-performance audit

## Diagnosis
The old live path called `קבלת_נתוני_ליבה_Build13`, which returns the full CRM payload before the dashboard is usable. That payload includes projects, contacts, links, full tasks, settings and permissions. The request-scoped read cache reduced duplicate reads within one Apps Script execution, but it did not reduce the initial JSON payload or defer module datasets.

## Instrumentation
Temporary instrumentation is present but disabled by default with `BH_PERF_AUDIT_ENABLED = false`. When enabled for one request it logs:
- total execution time per endpoint wrapper;
- physical Sheet reads by sheet name;
- auth/current-user timing;
- permissions/domain-filter timing;
- module build timing for projects, contacts, tasks, settings and archive;
- final JSON payload byte size.

## Measured baseline from code-path inspection
A production Apps Script timing run must enable `BH_PERF_AUDIT_ENABLED` for a single request. Before this change the initial route called full core and payload size was the full serialized CRM state: projects + contacts + links + tasks + settings + permissions. Physical reads included at least sessions, projects, contacts, links, tasks, task notes, settings, field settings, role permissions, user permissions, branding and domain branding.

## New loading flow
### Stage 1 fast initial shell
The client now calls `קבלת_נתוני_פתיחה_Build13_2` on login. The initial shell contains auth/current user, branding, dashboard totals, dated task/calendar records needed by the dashboard, navigation flags and permission flags.

### Stage 2 lazy modules
Deferred datasets:
- projects: loaded only by the Projects tab;
- contacts: loaded only by the Contacts tab;
- full task table with project/contact lookup data: loaded only by the Tasks tab;
- settings/admin data: loaded only by Settings and still rejects unauthorized users;
- archive records: loaded only by Archive;
- project/contact/task card details: loaded through dedicated card endpoints.

## Authorization rules
Every lazy endpoint validates the auth token, applies role permissions via the existing user filter, applies Assignment Domain restrictions, applies selected-domain customer filtering, and preserves existing archive behavior unless the Archive module is explicitly requested.

## Expected before/after report
- Old initial request: full `קבלת_נתוני_ליבה_Build13` time and full payload bytes from instrumentation.
- New initial shell: `קבלת_נתוני_פתיחה_Build13_2` time and shell payload bytes from instrumentation.
- Sheet reads before/after: compare `reads` in the `PERF_AUDIT` log entries.
- Deferred datasets: projects, contacts, links, full tasks, settings/admin and archive.
