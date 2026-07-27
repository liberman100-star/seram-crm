# Refresh Core mutation audit (post-PR #98 follow-up)

## Root cause and selection

The effective late `window.saveTask` override saved both new and existing tasks and, on
success, called `refreshCore()`. That endpoint replaces `DATA`, renders the shell,
dashboard, projects, contacts, tasks, settings and calendar, and only then reopens the
task. Editing a task changes one authorized task row (and its calendar/dashboard
projections); it does not change projects, contacts, settings, permissions or the
shell. The selected route is therefore **editing an existing task**. It is a common
daily action, the full-core cost is high, the server already constructs the complete
row, and replacing that row is bounded and low-risk. Creation remains on its existing
full refresh in this change because safely inserting into every visibility-dependent
collection is a separate route.

Scores use a relative 1–5 scale: frequency × full-core cost × improvement potential ÷
local-patch risk. They are code-informed estimates, not production telemetry.

## Effective mutation paths

| Operation | Effective client → server | Full core after success? | Actual data changed | Required UI | More server data? | Frequency | Cost | Patch risk | Score |
|---|---|---:|---|---|---:|---:|---:|---:|---:|
| Create task | `window.saveTask` → `שמירת_משימה` | Yes | new task row | tasks, dashboard, calendar, new card | canonical row + visibility placement | 5 | 5 | 3 | 4 | 31.3 |
| **Edit task (selected)** | `window.saveTask` → `שמירת_משימה` | **Before: yes; after: no** | one task row | tasks, dashboard, calendar, open card | canonical authorized task row | 5 | 5 | 5 | 2 | **62.5** |
| Archive/delete task | `delTask` → `מחיקת_משימה` | Yes | task archive state/collections | tasks, dashboard, calendar, card | archive placement | 3 | 5 | 3 | 3 | 15.0 |
| Reassign task | task edit → `שמירת_משימה` | Yes before; selected edit patch after | task project/contact/owner fields | same task surfaces | canonical task | 3 | 5 | 5 | 3 | 25.0 |
| Add task note | `saveTaskNote` → `שמירת_הערת_משימה` | No (`openTaskCard` fetch only) | note row + task updated timestamp | open task card/timeline | notes/card payload | 5 | 1 | 2 | 2 | 5.0 |
| Complete/reactivate task | `doneTask` / `reactivateTask` → matching endpoints | PR #98 route; excluded | task status/timestamp | task surfaces | canonical task | 5 | 5 | 5 | 1 | already optimized |
| Create project | `saveProject` → `שמירת_פרויקט` | Yes | new project | projects/dashboard/card | canonical row + visibility | 3 | 5 | 3 | 4 | 11.3 |
| Edit project | `saveProject` → `שמירת_פרויקט` | Yes | one project | projects/dashboard/card; dependent labels | canonical project/dependencies | 4 | 5 | 4 | 3 | 26.7 |
| Archive/restore/close project | archive handlers → project archive/restore endpoints | Yes | project/archive and dependent visibility | project/archive/dashboard | archive/dependency result | 2 | 5 | 3 | 4 | 7.5 |
| Add project note | project note handler → project-note endpoint | Yes via helper/card refresh path | note/timeline row | project card/timeline | canonical notes/timeline | 3 | 5 | 4 | 2 | 30.0 |
| Create contact | `saveContact` → `שמירת_איש_קשר` | Yes | new contact | contacts/dashboard/card | canonical row + visibility | 3 | 5 | 3 | 4 | 11.3 |
| Edit contact | `saveContact` → `שמירת_איש_קשר` | Yes | one contact | contacts/dashboard/card and labels | canonical contact | 4 | 5 | 4 | 3 | 26.7 |
| Archive/restore contact | archive handlers → contact archive/restore endpoints | Yes | contact/archive and links | contacts/archive/dashboard | dependency result | 2 | 5 | 3 | 4 | 7.5 |
| Link contact to project | `saveLink` → `שמירת_שיוך` | Yes | link row | project/contact cards and visibility | canonical link/visibility | 3 | 5 | 3 | 4 | 11.3 |
| Unlink | `delLink` → `מחיקת_שיוך` | Yes | link removal | project/contact cards and visibility | invalidated visibility | 2 | 5 | 2 | 5 | 4.0 |
| Selection/settings changes | settings save/toggle/delete handlers → Build6 endpoints | Yes | categories/options/system fields | settings and affected forms | full metadata | 1 | 5 | 2 | 5 | 2.0 |
| Users/roles/permissions | permission/calendar/user handlers → Build8+ endpoints | Yes or `load()` | authorization/visibility | security UI and all visible data | full authorized payload | 1 | 5 | 1 | 5 | 1.0 |
| Calendar invite | `sendCalendarInvite` → `שליחת_זימון_יומן_למשימה_Build11` | Yes | task event id/timestamp + external event | task/card/calendar | canonical task/external result | 2 | 5 | 3 | 4 | 7.5 |

The audit also checked the base `render`, `load`, `getCore`-style Apps Script core
endpoints, the late `refreshCore` wrapper, inline callbacks, window assignments,
duplicate render/card definitions, archive callbacks and helper-mediated refreshes.
Late assignments were treated as authoritative.

## Selected local patch map and contract

The authenticated server response reuses the effective Full Core pipeline and returns
`canonicalTask`, `canonicalCalendarRecord`, explicit task/calendar visibility and
insert/replace/remove decisions, canonical dashboard buckets, calendar creator state,
invalidations, sequence/version and `fullInvalidation`. The client executes those
decisions without calculating visibility or calendar ownership. This preserves the
Core enrichment fields and supports membership changes in both `DATA.tasks` and
`DATA.calendarTasks`; it does not mutate projects, contacts, links, permissions, notes,
filters or settings.

The task table, dashboard, calendar and open task card render. No shell, project,
contact or settings render runs. Existing calendar date/view/filter state and active
module remain intact. The edit modal becomes the canonical task card after success;
unrelated application state and page scroll are not reset.

A single guarded fallback calls `refreshCore` for a missing/invalid/old response,
missing canonical row, local patch failure, explicit full invalidation, or non-session
transport failure. Session expiry clears the canonical token and uses the existing
`showLogin` flow without a refresh. Per-task pending state blocks duplicate in-flight
requests; sequence checks reject late results; busy state is cleared on every terminal
path.

Instrumentation logs route, server and patch durations, fallback flag/reason,
sequence/version, and success only. It never logs tokens, identity fields, task/note
content, or records.
