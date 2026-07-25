const assert = require('assert');
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const server = fs.readFileSync('V2.GS.txt', 'utf8');

const clientStart = html.indexOf('Build 15.1 – Targeted task-status mutations');
assert(clientStart >= 0, 'targeted client implementation is missing');
const client = html.slice(clientStart, html.indexOf('</script>', clientStart));
assert(client.includes('CRM_TARGETED_TASK_STATUS_MUTATIONS'), 'feature flag is missing');
assert(client.includes('if(state.pending) return'), 'double-click guard is missing');
assert(client.includes('latest.sequence!==sequence'), 'stale-response guard is missing');
assert(client.includes('DATA.tasks=CRM_taskStatusReplace_'), 'DATA.tasks is not merged');
assert(client.includes('DATA.calendarTasks=CRM_taskStatusReplace_'), 'DATA.calendarTasks is not merged');
assert(client.includes('CRM_taskStatusDashboard_(entity,id)'), 'dashboard delta is not merged');
assert(client.includes('renderTaskCard({task:entity'), 'open card is not rendered in place');
assert(client.includes('window.CRM_TARGETED_TASK_STATUS_MUTATIONS===false'), 'legacy flag-off route is missing');

const successStart = client.indexOf('withSuccessHandler(function(response)');
const failureStart = client.indexOf('withFailureHandler(function(e)', successStart);
const targetedSuccess = client.slice(successStart, failureStart);
assert(!targetedSuccess.includes('refreshCore'), 'active success route must not refresh core');
assert(!targetedSuccess.includes('openTaskCard'), 'active success route must not reopen the card');
assert(!targetedSuccess.includes('load('), 'active success route must not load core');

const serverStart = server.indexOf('Build 15.1 – Targeted task-status mutations');
assert(serverStart >= 0, 'targeted server implementation is missing');
const targetedServer = server.slice(serverStart);
for (const field of ['ok:true', "mutation:mutation", "entityType:'task'", 'entity:entity', 'dashboardDelta:', 'calendarItem:', 'version:', 'updatedAt:', 'permissions:', 'telemetry:']) {
  assert(targetedServer.includes(field), `response field is missing: ${field}`);
}
for (const metric of ['total','serverRoundTrip','merge','render','responseBytes','serverCalls','sheetReads','rowsRead','targetedFallback','fullCoreFallback']) {
  assert(targetedServer.includes(`mutation.taskStatus.${metric}`), `telemetry metric is missing: ${metric}`);
}
assert(targetedServer.includes("BH_FAST_fullRows_(shape,SHEETS.TASKS,[row]"), 'canonical task is not reread by targeted row');
console.log('targeted task status mutation assertions passed');
