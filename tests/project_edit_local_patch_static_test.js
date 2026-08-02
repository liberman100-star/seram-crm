const assert = require('assert');
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const server = fs.readFileSync('V2.GS.txt', 'utf8');
const patch = html.slice(html.indexOf('<!-- Build 16: canonical local patch'));

assert.match(patch, /if\(!id\) return previousSaveProject\.apply/, 'Create Project retains its prior refresh route');
assert.match(patch, /pendingByProject\[id\]/, 'duplicate edits are protected per project');
assert.match(patch, /latestSequenceByProject\[id\]/, 'project edits have sequence and stale-response protection');
assert.match(patch, /BH_UI_setBusy\(null, 'שומר\.\.\.'\)/, 'central busy mechanism uses the required text');
assert.match(patch, /if\(fallbackStarted\) return;[\s\S]*?refreshCore\(\)/, 'fallback is single-shot');
assert.doesNotMatch(patch, /withSuccessHandler\([^)]*refreshCore/, 'normal edit success does not refresh Core');
assert.match(patch, /DATA = next;[\s\S]*?global\.DATA = next/, 'validated copies are published atomically');
assert.match(patch, /projectDecision === 'insert'[\s\S]*?projectDecision === 'replace'/, 'insert and replace are server driven');
assert.match(patch, /decision === 'remove'/, 'remove is server driven');
assert.match(patch, /decision === 'unchanged'/, 'unchanged is server driven');
assert.match(patch, /affectedTasks/, 'canonical task enrichment replaces the task collection');
assert.match(patch, /affectedCalendarTasks/, 'canonical calendar enrichment replaces the calendar collection');
assert.match(patch, /renderDashboard\(\)/, 'dashboard is selectively rendered');
assert.match(patch, /tableProjects\(\)/, 'project list is selectively rendered');
assert.match(patch, /tableTasks\(\)/, 'task labels are selectively rendered');
assert.match(patch, /renderCalendarDashboard\(\)/, 'calendar is selectively rendered');
assert.doesNotMatch(patch, /renderSettings|renderShell|tableContacts/, 'unrelated settings, shell and contacts table are not rendered');
assert.match(patch, /scrollState[\s\S]*?scrollTo/, 'scroll position is restored without changing the active module');
assert.match(patch, /if\(completed\) return/, 'duplicate callbacks are ignored and busy cleanup is single-shot');

assert.match(server, /function שמירת_פרויקט_קנונית_Build16/, 'dedicated edit endpoint exists');
assert.match(server, /const core = קבלת_נתוני_ליבה_Build13/, 'response is derived through canonical Core authorization');
assert.match(server, /projectDecision:projectDecision/, 'server owns the project visibility decision');
assert.match(server, /affectedTasks:core\.tasks/, 'server returns canonical affected tasks');
assert.match(server, /affectedCalendarTasks:core\.calendarTasks/, 'server returns canonical affected calendar tasks');
assert.match(server, /dashboard:core\.dashboard/, 'server returns canonical dashboard');
assert.match(server, /fullInvalidation:true/, 'unsafe domain routing explicitly requests full invalidation');

// Existing approved local-patch routes remain present.
assert.match(html, /BH_saveTaskEditLocal\(id, request\)/, 'Edit Task remains a local patch');
assert.match(html, /window\.doneTask = id=>mutateStatus/, 'Done remains a local patch');
assert.match(html, /window\.reactivateTask = id=>mutateStatus/, 'Reactivate remains a local patch');

console.log('project_edit_local_patch_static_test: OK');
