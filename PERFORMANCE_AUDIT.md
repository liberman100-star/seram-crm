# CRM load-performance audit

## Highest-cost paths found

Focused inspection of the current initial load path showed that `קבלת_נתוני_ליבה_Build13` delegated to the full data loader and customer-domain wrapper. That path repeatedly loaded the same Sheets during one request, including sessions, projects, contacts, links, tasks, task notes, settings, field settings, role permissions, user permissions, branding, and domain-branding rows.

The highest-cost categories were:

1. Spreadsheet reads of large core sheets (`פרויקטים`, `אנשי קשר`, `שיוכים`, `משימות`).
2. Full notes/timeline/task-note payload work before the first dashboard render.
3. Administration payload construction for settings, users, permission matrices, and domain-branding rows.
4. Client-side duplicate top-level core calls caused by unguarded `load` / `refreshCore` paths and module loading through the full core endpoint.
5. Dashboard, task table, activity, and calendar rendering from the same task collection after repeated full refreshes.

Production personal-data logging remains disabled by default. The temporary timing hooks are controlled by `BH_PERF_AUDIT_ENABLED`, which defaults to `false`, and log only aggregate timings/read counts/payload byte size when explicitly enabled.

## Before / after

| Metric | Before | After |
| --- | ---: | ---: |
| Initial core spreadsheet reads | ~16+ read calls on representative owner/customer-domain load, with repeated reads of sessions, projects, contacts, links, tasks, notes, settings, permissions, and branding | One request-scoped read per sheet name during `קבלת_נתוני_ליבה_Build13`; repeated helper calls reuse `__BH_REQUEST_ROWS__` |
| Initial payload contents | Full projects, contacts, links, tasks, notes, settings/categories, fields, permissions, and admin branding for eligible users | Authenticated shell, user/permissions flags, branding, dashboard summary, dated tasks for dashboard/calendar, and explicit deferred dataset list |
| Initial payload size | Full filtered CRM data payload | Reduced by removing projects, contacts, links, notes/timeline, settings/categories, fields, permission matrices, archive, and card details from initial core |
| Server execution timing | Dominated by repeated Sheet reads and full payload construction | Request-scoped row cache removes repeated Sheet IO within the request; instrumentation records per-sheet/read timing when enabled |
| Client render timing | Initial render could be followed by an immediate duplicate full refresh and module load through the full core endpoint | Initial `load` and `refreshCore` are guarded against concurrent duplicate core requests; modules lazy-load through `קבלת_מודול_Build13_2` |

## Datasets moved to lazy loading

- Projects table data.
- Contacts table data.
- Link/assignment data.
- Settings categories and field definitions.
- Permission matrices and unrelated administration payloads.
- Domain-branding administration rows for non-owner / non-`מנהל ראשי` users.
- Project notes.
- Task notes.
- Timeline records.
- Archive data.
- Project/contact/task card details.

## Remaining bottlenecks

- Apps Script still needs to read the base Sheets required to compute authorized dashboard data and preserve Assignment Domain/customer-domain filtering before returning the initial shell.
- Owner / `מנהל ראשי` users can still receive admin-only domain-branding administration data when authorized, because existing settings behavior requires it.
- Google Sheets API latency remains an external bottleneck; the request-scoped cache reduces duplicate reads but cannot make the first read of a large sheet free.
