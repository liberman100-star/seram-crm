const assert = require('assert');
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const server = fs.readFileSync('V2.GS.txt', 'utf8');
const patch = (html.match(/<script id="BH_TASK_STATUS_PATCH">([\s\S]*?)<\/script>/) || [])[1] || '';

assert.ok(patch, 'the effective task-status patch coordinator must exist');
assert.match(patch, /window\.doneTask\s*=.*mutateStatus/, 'done must use the patch coordinator');
assert.match(patch, /window\.reactivateTask\s*=.*mutateStatus/, 'reactivate must use the patch coordinator');
assert.match(patch, /if\(patched\)[\s\S]*?return;[\s\S]*?fallback\(/, 'full refresh fallback must only follow a rejected patch');
assert.match(patch, /pending\[id\]/, 'duplicate status mutations must be blocked');
assert.match(patch, /DATA\.calendarTasks\.splice/, 'calendar removal must be supported');
assert.match(patch, /DATA\.calendarTasks\.push/, 'calendar insertion must be supported');
assert.doesNotMatch(patch, /tableProjects\s*\(/, 'projects must not render during a status patch');
assert.doesNotMatch(patch, /tableContacts\s*\(/, 'contacts must not render during a status patch');
[
  'taskStatusMutation.serverRoundTrip',
  'taskStatusMutation.patchClient',
  'taskStatusMutation.totalToInteractive',
  'taskStatusMutation.fallbackUsed',
  'taskStatusMutation.action'
].forEach(metric => assert.ok(patch.includes(metric), `missing instrumentation ${metric}`));

assert.match(server, /function BH_taskStatusMutationResult_\(/, 'server response builder must exist');
assert.match(server, /function BH_normalizeTaskMutationValue_\(/, 'recursive canonical response normalization must exist');
assert.match(server, /function BH_assertTaskMutationSerializable_\(/, 'recursive Date guard must exist');
assert.match(server, /ok:\s*true[\s\S]*?entity:\s*"task"[\s\S]*?taskId:[\s\S]*?record:/, 'server contract must contain the canonical task fields');
assert.match(server, /משימה_מותרת_לפתיחה_Build11_2_\(user, task\)/, 'response must repeat read authorization');
assert.match(server, /BH_AD_assertCreatorWrite_\(user, task, "משימה"\)/, 'write authorization must remain enforced');
assert.match(server, /return BH_taskStatusMutationResult_\(user, task, "done"\)/, 'done must return a patch response');
assert.match(server, /return BH_taskStatusMutationResult_\(user, task, "reactivate"\)/, 'reactivate must return a patch response');
assert.match(patch, /localVersion\.comparable>responseVersion\.comparable/, 'newer local records must reject stale responses');
assert.match(patch, /sequence\)<Number\(requestContext\.latestSequence/, 'local request sequencing must reject reversed responses');
assert.match(patch, /fallback\('transportFailure'/, 'transport failures must reconcile through fallback');
assert.match(patch, /if\(fallbackStarted\) return/, 'fallback must be single-shot');

console.log('task status patch static assertions passed');
