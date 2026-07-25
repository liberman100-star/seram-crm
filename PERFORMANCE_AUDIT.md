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
`CRM_FAST_SHELL_DEFAULT_MODE` is `privileged`, but the browser no longer decides eligibility from `CRM_USER_INFO`. Unless mode is explicitly `off`, every startup makes one opening request and the authenticated server decides whether the user receives the compact shell or the canonical full payload in that same response. `on` requests fast-shell testing but never bypasses server authentication, record authorization, or the customer domain gate. Transport/schema failure triggers exactly one direct full-core fallback; success never starts background full core. Mutation `refreshCore` remains unchanged.

## Physical reads in the privileged shell
The previous implementation called `readSheet_` for all Projects, Contacts and Tasks rows (and Links for non-primary roles) and only reduced serialization. The corrected privileged shell performs narrow range reads instead:
- Projects: headers, the Archive column for an exact active count, and at most five full rows used by `activeProjects`.
- Contacts: headers and the Archive column only, for the dashboard count; no contact records are built.
- Tasks: headers plus Date and Archive columns, followed by full-row reads only for active dated tasks required by late/today/week lists and the initial calendar.
- Links, notes, settings, fields, raw permissions and archive datasets: no opening read.

Google Sheets has no indexed date/role query in the current schema, so the Date and Archive columns still require a column scan. Every targeted range read records its physical-call count, row count and duration in `performanceDiagnostics.reads`, `sheetRowsRead`, and `readDurations`. Customer fast mode retains the existing selected-domain path: Links and Projects are necessary to establish portal-visible project IDs/domain access, and Tasks are then filtered to those IDs. A multi-domain customer receives only the domain gate before those dashboard records.

The expected startup request count is one in normal operation (two only after a failed/malformed opening response). Serialized records now scale with active dated tasks plus five project cards, while scanned cells scale with the narrow count/date columns rather than every cell of every core table. Exact production totals remain available through the existing diagnostic.

## Manual verification checklist
The deploy owner must exercise: owner in a new browser with no `CRM_USER_INFO`, stale cached role, primary administrator, manager, regular user, customer before/after domain selection, a user with no projects, and a large dataset; browser refresh and post-email-code login; first and second opening of every module; mode `off`; and intentionally failed/malformed shell fallback. Verify branding, user name, exact dashboard/calendar values, navigation permissions, Sheet-read diagnostics, and absence of pre-selection customer data. These checks require deployed Apps Script and the production spreadsheet and cannot be completed in the repository-only environment.
