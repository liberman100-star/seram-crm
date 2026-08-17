# Dashboard and CREATE mutation audit (Build 17)

## Effective production paths before the change

* **Dashboard:** both the navigation button and branding invoke the late-effective `goDashboard()`, which invoked `hardRefresh()`. That opens the deployed URL at `_top`; browser startup then calls `load()`, clears in-memory lazy-module state, and invokes Fast Opening (with Full Core only as its guarded fallback).
* **Task CREATE:** the late task editor override called `saveTask("")`, then `שמירת_משימה`, and its success handler called `refreshCore()` before opening the task card. Tasks, calendar tasks, dashboard aggregates, and calendar creator metadata were stale until that refresh. Existing task-edit decision/patch semantics showed that these collections can be replaced canonically without rerendering projects or contacts.
* **Contact CREATE:** the late assignment-domain `saveContact("")` called `שמירת_איש_קשר`; success called `refreshCore()` and then opened the contact card. Contacts and dashboard aggregates were stale. A contact with a system permission can also change security-sensitive user/permission lists.
* **Project CREATE:** the final project-edit wrapper delegated creation to the prior save function, which called `שמירת_פרויקט`; success called `refreshCore()` and then opened the card. Projects, dashboard aggregates, and potentially links were stale. Existing project-edit patching supplied the safe model for server-authoritative replacements.

## Effective paths after the change

Dashboard navigation calls `tab('dashboard', button)`. The established lazy router renders Dashboard from current `DATA` and does not touch the module cache; initial startup remains unchanged.

Each normal CREATE makes one entity-specific canonical RPC. The server performs the established authenticated save and returns the visible canonical record plus the affected dashboard and calendar/link metadata. The client patches only the entity dependencies and rerenders only loaded/affected surfaces. It never marks an unloaded module as loaded. Invalid contracts and explicit `fullInvalidation` share a one-shot Full Core fallback. Session expiry uses the existing idle-session handler (or canonical token-clear/login path), and per-entity in-flight guards, response sequence validation, duplicate-callback suppression, and busy cleanup protect races and failures.

Task responses include `record`, optional `calendarRecord`, `dashboardPatch`, and only newly affected calendar creators; canonical calendar enrichment preserves `calendarMembers`. Contact responses include `record` and a count-only `dashboardPatch`; creation of a login-capable contact explicitly requests full invalidation rather than fabricating permission state. Project responses include `record`, `affectedLinks`, and a count/active-project `dashboardPatch`, preserving the established save route's owner/responsible-user rules.

## Review correction: narrow server path

Build 17 no longer invokes the Full Core builder inside a canonical CREATE RPC. Each established save can return its just-persisted JSON-safe row. Task creation performs only a narrow project-ID lookup for calendar membership and calculates a dashboard delta from the new task; contact creation returns its row and count delta; project creation returns its row, an empty affected-link set for the existing no-link create behavior, and its count/active-project delta. The browser applies these deltas to its already-authorized current Dashboard. System-user contact creation remains an explicit client-side Full Core invalidation exception.
