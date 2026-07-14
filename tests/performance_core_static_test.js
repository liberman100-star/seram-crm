const fs = require('fs');
const assert = require('assert');
const gs = fs.readFileSync('V2.GS.txt','utf8');
const html = fs.readFileSync('index.html','utf8');
function has(src, re, msg){ assert(re.test(src), msg); }
has(gs, /var __BH_REQUEST_ROWS__ = null/, 'request-scoped sheet cache exists');
has(gs, /Object\.prototype\.hasOwnProperty\.call\(__BH_REQUEST_ROWS__, name\)/, 'readSheet_ reuses request rows');
has(gs, /BH_PERF_AUDIT_ENABLED = false/, 'performance audit logging is disabled by default');
has(gs, /notes:\s*\[\]/, 'initial payload excludes task notes');
has(gs, /projectNotes:\s*\[\]/, 'initial payload excludes project notes');
has(gs, /timeline:\s*\[\]/, 'initial payload excludes timeline');
has(gs, /permissions:\s*\{\}/, 'initial payload excludes permission matrix');
has(gs, /delete out\.domainBrandingAdmin/, 'non-admin module payload excludes domain branding admin rows');
has(html, /\.קבלת_מודול_Build13_2\(token, module\)/, 'lazy module loading uses module endpoint');
has(html, /__BH_CORE_LOADING__/, 'duplicate initial core request guard exists');
has(html, /__BH_CORE_REFRESHING__/, 'duplicate refresh guard exists');
console.log('performance core static assertions passed');
