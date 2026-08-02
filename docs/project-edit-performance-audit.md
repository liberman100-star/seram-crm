# Project edit performance audit

## Effective pre-change route

The late `window.saveProject` assignment is the effective browser handler. Inline
Save buttons resolve that global at click time, so earlier `saveProject`
declarations and assignments are overridden. For an existing project it called
`שמירת_פרויקט`, whose final definition was the performance wrapper around the
established business save function. The server returned only the saved project
ID. The success callback then called `refreshCore`, followed by
`openProjectCard`.

`refreshCore` called `קבלת_נתוני_ליבה_Build13`, replaced the complete `DATA`
object, merged lazy-module data, rendered the shell, dashboard, projects,
contacts, tasks, settings when authorized, calendar and calendar controls, and
only then reopened the project card.

## Editable fields and derivations

The effective edit form accepts project name, description, city, type, status,
assignment domain (when authorized), responsible owner, tags and Drive folder.
Creation/update timestamps and creator are server-owned. Required/custom field
configuration can constrain the named fields, but the current project form does
not submit arbitrary dynamic custom-field values. The canonical row must
therefore replace the old row; an open merge would risk retaining fields that
the server removed or normalized.

Project data is consumed by project tables/cards/search/tooltips and dashboard
active-project summaries. Project ownership and assignment domain participate
in project visibility. The canonical Core route also uses project visibility to
filter links and related contacts. Tasks are filtered by authorization, and the
calendar enrichment derives creator/calendar owner, color key, allowed project
IDs and creator filters from projects and their ownership. Consequently name,
owner, assignment-domain or visibility changes can affect task/card labels,
calendar labels/filters and dashboard counts even though the task rows were not
directly edited.

## Collection classification

| Collection | Classification after an edit | Reason |
| --- | --- | --- |
| `projects` | Must update | Canonical row and server visibility decision. |
| `tasks` | Potentially stale; canonical replacement required | Authorization and project enrichment can change. |
| `calendarTasks` | Potentially stale; canonical replacement required | Project visibility and calendar owner enrichment can change. |
| `contacts` | Potentially stale; canonical replacement required | Visible related-contact set can change with project visibility. |
| `links` | Potentially stale; canonical replacement required | Core filters links to visible projects. |
| `dashboard` | Must update | Counts and active-project/task summaries are computed after filtering. |
| `calendarCreatorsAllowed`, `calendarCreatorPermission` | Must update | Derived from canonical calendar tasks and permissions. |
| `archive` | Unchanged | Archive/delete/restore/close are outside this route. |
| `system`, `realSettings`, categories/fields | Unchanged | Project edit does not mutate configuration or branding. |

## Equivalence risks and server authority

Changing responsible owner or assignment domain can remove the project from, or
add it to, the current user's visible set. It can also alter visible tasks,
calendar access, links, contacts, allowed project IDs, dashboard counts and
customer-domain filtering. The browser cannot safely reproduce any of those
decisions. The edit endpoint therefore saves through the existing business
function and obtains its response collections through the same final Core route
used by `refreshCore`, including session, record authorization and selected
customer-domain filtering.

## Canonical response and local rendering

The edit-only response includes route/version identity, project ID, request
sequence, timestamp, canonical project, visibility and an explicit `insert`,
`replace`, `remove` or `unchanged` decision. It also supplies canonical
replacement collections for tasks, calendar tasks, contacts and links, plus the
dashboard and calendar permission metadata. The browser validates the complete
response, prepares copies, and publishes `DATA` only after all validation
succeeds.

Normal success renders only the project table, dashboard, task table, calendar
and calendar controls, then opens the canonical project card if it remains
visible. It does not render the shell, settings or contacts table and does not
change the active module. Scroll position is restored; calendar view, date and
filter globals are not modified.

## Fallback and race policy

There is one in-flight edit per project ID, a monotonically increasing sequence,
stale-response rejection, duplicate-callback protection and one guarded
fallback. Session expiry uses the established idle/session-login route.
Transport failure, invalid/incomplete canonical responses, explicit full
invalidation and local patch exceptions reconcile with one `refreshCore`.
Busy state uses `BH_UI_setBusy` with `שומר...` and is released once on every
terminal path. Create Project delegates unchanged to the previous handler.
