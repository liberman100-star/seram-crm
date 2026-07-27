const fs = require('fs');
const assert = require('assert');
const html = fs.readFileSync('index.html', 'utf8');
const gs = fs.readFileSync('V2.GS.txt', 'utf8');

function has(re, message){ assert(re.test(html), message); }
has(/if\(!id\)\{[\s\S]*?refreshCore[\s\S]*?return;[\s\S]*?BH_saveTaskEditLocal\(id, request\)/, 'only create retains full refresh; edit uses local route');
has(/if\(!replaceById\(DATA\.tasks, task\)\) throw/, 'canonical task replaces the local task');
has(/Array\.isArray\(DATA\.calendarTasks\).*replaceById/, 'calendar projection is patched when present');
has(/tableTasks\(\);[\s\S]*?renderDashboard\(\);[\s\S]*?renderCalendarDashboard[\s\S]*?renderTaskCard/, 'task-dependent views render');
has(/pending\[key\]\) return false/, 'duplicate in-flight edit is blocked');
has(/state\.sequence < \(latestApplied\[key\] \|\| 0\)/, 'late response cannot overwrite a newer result');
has(/finally\{ delete pending\[key\]; setBusy\(false\); \}/, 'success and patch failures clear pending and busy state');
has(/withFailureHandler[\s\S]*?delete pending\[key\];[\s\S]*?setBusy\(false\)/, 'transport failure clears pending and busy state');
has(/if\(state\.fallback\) return;[\s\S]*?refreshCore/, 'fallback is single-shot');
has(/sessionExpired\(error\)[\s\S]*?canonicalLogout[\s\S]*?return;[\s\S]*?fallbackOnce/, 'session expiry logs out and never falls into refresh');
has(/console\.info\('CRM_MUTATION_PERF'/, 'safe focused instrumentation exists');
assert(!/function BH_saveTaskEditLocal[\s\S]*?tableProjects\(\)/.test(html), 'project view is not rendered by local patch');
assert(!/function BH_saveTaskEditLocal[\s\S]*?tableContacts\(\)/.test(html), 'contact view is not rendered by local patch');
assert(/if \(!data\.clientSequence\) return id;[\s\S]*?canonicalTask[\s\S]*?formatValue_/.test(gs), 'server returns formatted canonical task only for optimized contract');
assert(/updatedAt: String\(canonicalTask\["עדכון אחרון"\]/.test(gs), 'contract exposes canonical updatedAt');
assert(/sequence: Number\(data\.clientSequence/.test(gs), 'contract echoes sequence');
assert(!/\.github\/workflows/.test(require('child_process').execSync('git diff --name-only').toString()), 'workflow files are unchanged');
console.log('task_edit_local_patch_test: OK');
