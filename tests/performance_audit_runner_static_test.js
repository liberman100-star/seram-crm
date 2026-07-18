const fs = require('fs');
const assert = require('assert');

const runner = fs.readFileSync('PerformanceAuditRunner.GS.txt', 'utf8');
const gs = fs.readFileSync('V2.GS.txt', 'utf8');

assert(/function BH_PERF_RUN_EXISTING_AUDIT\(\)/.test(runner), 'manual audit runner must exist');
assert(/BH13_4_מדידת_ליבה_מול_פתיחה\(token\)/.test(runner), 'runner must reuse the existing canonical diagnostic');
assert(/קבלת_משתמש_מסשן_Build7_\(token\)/.test(runner), 'runner must validate the selected session token');
assert(/BH_coreAllowedAdmin_\(user\)/.test(runner), 'runner must require owner or super-admin access');
assert(/readSheet_\("סשנים"\)/.test(runner), 'runner must resolve a stored active session');
assert(/דו״ח ביצועים/.test(runner), 'runner must write the requested report sheet');

assert(!/readSheet_\s*=/.test(runner), 'runner must not replace readSheet_');
assert(!/קבלת_נתוני_ליבה_Build13\s*=/.test(runner), 'runner must not wrap or replace the production core endpoint');
assert(!/BH_PERF_AUDIT_ENABLED\s*=/.test(runner), 'runner must not change the global audit flag');
assert(!/קבלת_נתוני_מערכת_מלאים_Build10_\s*\(/.test(runner), 'runner must not bypass the canonical authenticated diagnostic');

assert(/function BH13_4_מדידת_ליבה_מול_פתיחה\(token\)/.test(gs), 'existing diagnostic must remain available in V2');
assert(/var BH_PERF_AUDIT_ENABLED = false/.test(gs), 'existing audit logging must remain disabled by default');

console.log('performance audit runner static assertions passed');
