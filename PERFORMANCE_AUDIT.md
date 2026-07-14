# CRM load-performance audit

## Scope correction

This optimization preserves the observable contract of `קבלת_נתוני_ליבה_Build13`. The initial payload structure is not redesigned: datasets that existing initial-render paths may expect remain available from the canonical core loader.

Performance improvements in this PR are limited to:

1. Request-scoped Sheet row caching.
2. Eliminating duplicate spreadsheet reads within one Apps Script request.
3. Preventing duplicate concurrent `load` / `refreshCore` calls on the client.
4. Using the already-existing module lazy-load endpoint for module navigation instead of routing those lazy requests back through the full core endpoint.

## Highest-cost paths found

Focused inspection of the current initial load path showed that `קבלת_נתוני_ליבה_Build13` delegates through the full data loader and customer-domain wrapper. That path can repeatedly request the same Sheets during one server execution, including sessions, projects, contacts, links, tasks, task notes, settings, field settings, role permissions, user permissions, branding, and domain-branding rows.

The highest-cost categories were:

1. Spreadsheet reads of large core sheets (`פרויקטים`, `אנשי קשר`, `שיוכים`, `משימות`).
2. Repeated helper-level `readSheet_` calls for settings, branding, permissions, and customer-domain evaluation during a single core request.
3. Client-side duplicate top-level core calls caused by unguarded `load` / `refreshCore` paths.
4. Module navigation that was intended to be lazy but called the full core endpoint.

Production personal-data logging remains disabled by default. The timing hooks are controlled by `BH_PERF_AUDIT_ENABLED`, which defaults to `false`, and log only aggregate timings/read counts/payload byte size when explicitly enabled.

## Before / after

| Metric | Before | After |
| --- | ---: | ---: |
| Initial core spreadsheet reads | Repeated read calls possible for the same sheet during one representative owner/customer-domain load | One physical `readSheet_` call per sheet name per wrapped core/module request; repeated helper calls reuse `__BH_REQUEST_ROWS__` |
| Initial payload contents | Canonical `קבלת_נתוני_ליבה_Build13` payload | Same canonical `קבלת_נתוני_ליבה_Build13` payload |
| Initial payload size | Canonical payload size | Same payload contract; no dataset is removed, renamed, or omitted from core |
| Server execution timing | Dominated by repeated Sheet reads and full payload construction | Request-scoped row cache removes duplicate Sheet IO within the request; instrumentation records aggregate timing when enabled |
| Client render timing | Initial render could overlap with an immediate duplicate full refresh; lazy module navigation could call full core | `load` and `refreshCore` have duplicate in-flight guards; module navigation calls the already-existing module endpoint |

## Datasets moved to lazy loading

No new initial-core datasets were moved to lazy loading in this corrected change. Existing lazy module/card endpoints continue to handle data that was already loaded lazily before this PR.

## Remaining bottlenecks

- Apps Script still reads the base Sheets required to build the canonical authorized core payload and preserve Assignment Domain/customer-domain filtering.
- Payload size is unchanged by design because backward compatibility of `קבלת_נתוני_ליבה_Build13` is required.
- Google Sheets API latency remains an external bottleneck; the request-scoped cache reduces duplicate reads but cannot eliminate the first read of a large sheet.

## PR #21 finalization on current main

The PR #21 performance patch is intentionally limited to the request-scoped `readSheet_` cache, disabled-by-default aggregate perf hooks, unchanged canonical core payload, existing module endpoint loading, duplicate initial-load guard, and queued `refreshCore` callbacks. No current-main functional fixes from PR #20 are replaced or reverted by this performance layer.
