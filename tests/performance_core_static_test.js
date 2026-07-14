const fs = require('fs');
const assert = require('assert');
const gs = fs.readFileSync('V2.GS.txt','utf8');
const html = fs.readFileSync('index.html','utf8');
const audit = fs.readFileSync('PERFORMANCE_AUDIT.md','utf8');
function has(src, re, msg){ assert(re.test(src), msg); }
function notHas(src, re, msg){ assert(!re.test(src), msg); }
has(gs, /var __BH_REQUEST_ROWS__ = null/, 'request-scoped sheet cache exists');
has(gs, /Object\.prototype\.hasOwnProperty\.call\(__BH_REQUEST_ROWS__, name\)/, 'readSheet_ reuses request rows');
has(gs, /BH_PERF_AUDIT_ENABLED = false/, 'performance audit logging is disabled by default');
has(gs, /preserves the canonical payload unchanged/, 'server comment states canonical payload is preserved');
has(gs, /return data;\s*\}\);\s*\};\s*\n\s*var BH_perf_originalModuleFinal_/, 'core wrapper returns canonical data unchanged');
notHas(gs, /BH_trimInitialCorePayload_/, 'core payload trimming is not present');
notHas(gs, /deferredDatasets/, 'core payload does not add deferred contract markers');
has(html, /__BH_CORE_REFRESH_WAITERS__ = window\.__BH_CORE_REFRESH_WAITERS__ \|\| \[\]/, 'central refresh callback queue exists');
has(html, /if\(window\.__BH_CORE_REFRESHING__\)\{\s*if\(typeof after === 'function'\) window\.__BH_CORE_REFRESH_WAITERS__\.push\(after\);\s*return;\s*\}/, 'simultaneous refresh queues callback without second request');
has(html, /const waiters = \(primaryAfter \? \[primaryAfter\] : \[\]\)\.concat\(window\.__BH_CORE_REFRESH_WAITERS__ \|\| \[\]\)/, 'primary and queued callbacks are drained together after success');
has(html, /renderCalendarDashboard[\s\S]*?const waiters =/, 'callbacks execute only after DATA update and rendering');
has(html, /waiters\.forEach\(cb=>\{\s*try\{ cb\(\); \}catch\(err\)\{ console\.log\(err\); \}\s*\}\)/, 'callback errors are isolated');
has(html, /withFailureHandler\(e=>\{\s*window\.__BH_CORE_REFRESHING__ = false;\s*window\.__BH_CORE_REFRESH_WAITERS__ = \[\];\s*alert\(e\.message\);/, 'failure clears queue and permits later refresh');
has(html, /BH_isCustomerDomainSelectionRequired[\s\S]*?window\.__BH_CORE_REFRESH_WAITERS__ = \[\];[\s\S]*?BH_showCustomerDomainDialog/, 'domain selection clears refresh queue before dialog');
has(html, /\.קבלת_מודול_Build13_2\(token, module\)/, 'lazy module loading uses existing module endpoint');
has(html, /mergeData_Build13_2\(d\);\s*renderShell_Build13_2\(d\);[\s\S]*?__BH_LOADED_MODULES__\[module\] = true;/, 'module endpoint response shape remains compatible with existing handler');
has(html, /function load\(forceDashboard=true\)\{[\s\S]*?__BH_CORE_LOADING__ = true[\s\S]*?if\(!token\)\{\s*window\.__BH_CORE_LOADING__ = false;[\s\S]*?withSuccessHandler\(d=>\{\s*window\.__BH_CORE_LOADING__ = false;[\s\S]*?withFailureHandler\(e=>\{\s*window\.__BH_CORE_LOADING__ = false;/, 'load guard clears on token, success/domain/unauthorized, and failure paths');
has(html, /__BH_CORE_LOADING__/, 'duplicate initial core request guard exists');
has(html, /__BH_CORE_REFRESHING__/, 'duplicate refresh guard exists');
has(audit, /No new initial-core datasets were moved to lazy loading/, 'audit documents no new deferred core datasets');
console.log('performance core static assertions passed');
