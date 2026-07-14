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
has(gs, /return data;\s*\}\);\s*\};\s*\n\s*var BH_perf_originalModuleFinal_/, 'core wrapper returns canonical data unchanged');
notHas(gs, /BH_trimInitialCorePayload_/, 'core payload trimming is not present');
notHas(gs, /deferredDatasets/, 'core payload does not add deferred contract markers');
has(html, /\.קבלת_מודול_Build13_2\(token, module\)/, 'lazy module loading uses existing module endpoint');
has(html, /__BH_CORE_LOADING__/, 'duplicate initial core request guard exists');
has(html, /__BH_CORE_REFRESHING__/, 'duplicate refresh guard exists');
has(audit, /No new initial-core datasets were moved to lazy loading/, 'audit documents no new deferred core datasets');
console.log('performance core static assertions passed');
