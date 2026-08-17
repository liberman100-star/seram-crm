# Module load pipeline audit (Build 13.2)

## Effective definitions before the change

The effective lazy-loading declarations are the Build 13.2 functions in `index.html`:

- `ensureModule_Build13_2` renders an already-loaded module or delegates to `loadModule_Build13_2`.
- `loadModule_Build13_2` owns the per-module loading guard, waiter queue, RPC, authentication checks, merge, and render sequence.
- `mergeData_Build13_2` merges module keys, protects active collections from archive payloads, and updates loaded-module flags.
- `renderShell_Build13_2` merges its argument and renders shell/dashboard/security UI. It remains part of opening/full-core handling, not successful module loading.
- `renderModule_Build13_2` dispatches projects, contacts, tasks, settings, or the selected archive type.
- The effective `render` is the original full render wrapped first by the final-brand/calendar wrapper and later by the assignment-domain branding wrapper.
- The effective `tab` is the Build 13.2 lazy tab wrapped by the final UI tab implementation, the top-level reset wrapper, and the assignment-domain branding wrapper. Inline navigation handlers invoke that effective `tab`; archive and settings sub-tabs invoke their dedicated renderers.

No later assignment overrides the five named Build 13.2 module functions. The later `window.render`, `window.tab`, table, dashboard, calendar, and settings wrappers remain effective at their respective call sites.

## Root cause and old route

The successful module callback merged the response, called `renderShell_Build13_2` (which merged it again and rendered Dashboard), rendered all three business tables and Settings, rendered Dashboard again, and finally dispatched the requested module. Thus a request could rebuild the requested table twice, every unrelated table once, Settings once (for an authorized user), Dashboard twice, and Calendar twice through Dashboard.

Old route:

`RPC -> merge -> shell (merge + dashboard) -> projects -> contacts -> tasks -> settings -> dashboard -> requested module`

## New route and dependency map

New route:

`RPC -> validate -> minimal dependency snapshot -> one merge/publish -> dependency coordinator -> requested module once -> optional dependent Dashboard/Calendar`

The coordinator uses payload key presence plus changed references, without cloning or serializing `DATA`:

| Payload | Always rendered | Conditional dependent surfaces | Never rendered as a side effect |
| --- | --- | --- | --- |
| Projects | Projects table/filters/counters embodied by its renderer | Dashboard only when a new `dashboard` key is merged | Contacts, Tasks, Settings |
| Contacts | Contacts table/filters | Dashboard only when a new `dashboard` key is merged | Projects, Tasks, Settings |
| Tasks | Tasks table | Dashboard for a new `dashboard`; otherwise Calendar for changed tasks/calendar/creator-permission references | Projects, Contacts, Settings |
| Settings | Settings and its security UI | None | Business tables, Dashboard |
| Archive | `DATA.archive` and the current archive type | None | Active business tables and active collections |

Dashboard owns Calendar rendering in the effective implementation, so the coordinator does not call Calendar a second time when Dashboard is rendered.

## State, concurrency, and failure

The successful callback no longer calls shell, `tab`, navigation/reset helpers, modal helpers, or core refresh/load. Therefore the active section, document scroll, search/filter controls, Calendar view/date/filter, open modal/card, Settings tab, Archive type, and focus outside the replaced requested-module content are left in place. Archive dispatch uses `window.ARCHIVE_TAB` rather than forcing Projects.

The existing `__BH_LOADING_MODULE__` guard and per-module waiter queue remain authoritative. A duplicate request queues its callback and sends no RPC; successful completion drains every callback once. Missing tokens, domain selection, expired sessions, invalid payloads, and transport failures clear loading UI/state and do not mark invalid/failed modules as loaded.

## Static render comparison

Counts below describe the successful callback for the first load. “Conditional” is at most one render and only when the payload contains the dependency.

| Requested module | Requested render before -> after | Merge before -> after | Shell before -> after | Dashboard before -> after | Unrelated business/settings renders before -> after |
| --- | ---: | ---: | ---: | ---: | ---: |
| Projects | 2 -> 1 | 2 -> 1 | 1 -> 0 | 2 -> 0/1 conditional | Contacts + Tasks + Settings: 3 -> 0 |
| Contacts | 2 -> 1 | 2 -> 1 | 1 -> 0 | 2 -> 0/1 conditional | Projects + Tasks + Settings: 3 -> 0 |
| Tasks | 2 -> 1 | 2 -> 1 | 1 -> 0 | 2 -> 0/1 conditional | Projects + Contacts + Settings: 3 -> 0 |
| Settings | 2 -> 1 for authorized users | 2 -> 1 | 1 -> 0 | 2 -> 0 | Projects + Contacts + Tasks: 3 -> 0 |
| Archive | 1 -> 1 | 2 -> 1 | 1 -> 0 | 2 -> 0 | Projects + Contacts + Tasks + Settings: 4 -> 0 |

## Instrumentation

Every success, invalid-payload result, and transport failure emits `CRM_MODULE_RENDER_PERF`. It contains only the module name, merge/render durations, Dashboard/Calendar/Shell booleans, aggregate render counts, fallback boolean, and result. It never logs a token, identity, record, or payload. Normal success always reports `shellRendered: false`.
