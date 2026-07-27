const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');
const server = fs.readFileSync('V2.GS.txt', 'utf8');

function functionSource(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `missing function ${name}`);
  const brace = source.indexOf('{', start);
  let depth = 0;
  for (let i = brace; i < source.length; i++) {
    if (source[i] === '{') depth++;
    if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`unterminated function ${name}`);
}

// Exercise the same recursive server normalizer on a complete representative
// contract, including both task copies and nested metadata.
const serverSandbox = {
  formatValue_(value, field) {
    if (Object.prototype.toString.call(value) !== '[object Date]') return value;
    const pad = n => String(n).padStart(2, '0');
    return `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}` +
      (field === 'עדכון אחרון' ? ` ${pad(value.getUTCHours())}:${pad(value.getUTCMinutes())}` : '');
  }
};
vm.createContext(serverSandbox);
vm.runInContext(functionSource(server, 'BH_normalizeTaskMutationValue_'), serverSandbox);
vm.runInContext(functionSource(server, 'BH_assertTaskMutationSerializable_'), serverSandbox);

for (const action of ['done', 'reactivate']) {
  const rawDate = new Date(Date.UTC(2026, 6, 27, 13, 42));
  const raw = {
    ok: true, entity: 'task', action, taskId: 'T1',
    record: {'מזהה משימה':'T1', 'עדכון אחרון':rawDate},
    updatedAt: rawDate,
    affected: {calendar:true, nested:[{checkedAt:rawDate}]},
    calendarRecord: {'מזהה משימה':'T1', 'עדכון אחרון':rawDate},
    invalidations: []
  };
  const normalized = serverSandbox.BH_normalizeTaskMutationValue_(raw, '');
  serverSandbox.BH_assertTaskMutationSerializable_(normalized, 'response');
  const serialized = JSON.stringify(normalized);
  const roundTrip = JSON.parse(serialized);
  assert.strictEqual(roundTrip.record['עדכון אחרון'], '2026-07-27 13:42');
  assert.strictEqual(roundTrip.updatedAt, roundTrip.record['עדכון אחרון']);
  assert.strictEqual(roundTrip.calendarRecord['עדכון אחרון'], roundTrip.updatedAt);
  (function noDates(value) {
    assert.notStrictEqual(Object.prototype.toString.call(value), '[object Date]');
    if (value && typeof value === 'object') Object.values(value).forEach(noDates);
  })(normalized);
}

function buildClient() {
  const runners = [];
  let refreshes = 0;
  const button = {
    disabled: false,
    getAttribute: () => "doneTask('T1')",
    setAttribute(name, value) { if (name === 'aria-busy') this.busy = value; }
  };
  const run = {
    withSuccessHandler(fn) { this.success = fn; return this; },
    withFailureHandler(fn) { this.failure = fn; return this; },
    סימון_משימה_בוצעה() { runners.push({success:this.success, failure:this.failure}); },
    החזרת_משימה_לפעילה() { runners.push({success:this.success, failure:this.failure}); }
  };
  const sandbox = {
    DATA: {}, Date, Math, Array, Object, String, Number, isNaN,
    performance: {now: () => 1},
    console: {info() {}},
    document: {
      querySelectorAll: () => [button],
      getElementById: () => null
    },
    modal: {classList:{contains:() => true}},
    modalBox: {getAttribute:() => ''},
    renderTaskCard() {},
    parseDateOnly: value => new Date(value),
    canEdit: () => true,
    currentToken: () => 'token',
    alert(message) { this.lastAlert = message; },
    scrollX: 0, scrollY: 0, scrollTo() {},
    refreshCore(callback) { refreshes++; if (callback) callback(); },
    google: {script:{run}}
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  const patch = (html.match(/<script id="BH_TASK_STATUS_PATCH">([\s\S]*?)<\/script>/) || [])[1];
  vm.runInContext(patch, sandbox);
  return {sandbox, runners, button, refreshes:() => refreshes};
}

function result(updatedAt, status='בוצע') {
  return {
    ok:true, entity:'task', action:'done', taskId:'T1', updatedAt,
    record:{'מזהה משימה':'T1', 'סטטוס':status, 'עדכון אחרון':updatedAt},
    affected:{calendarVisible:true},
    calendarRecord:{'מזהה משימה':'T1', 'סטטוס':status, 'עדכון אחרון':updatedAt},
    invalidations:[]
  };
}

{
  const {sandbox} = buildClient();
  sandbox.DATA = {dashboard:{}, tasks:[{'מזהה משימה':'T1','סטטוס':'פתוח','עדכון אחרון':'2026-07-27 13:40'}], calendarTasks:[]};
  assert.strictEqual(sandbox.applyTaskStatusMutationPatch(result('2026-07-27 13:42')), true, 'newer response must patch');
  assert.strictEqual(sandbox.DATA.tasks[0]['סטטוס'], 'בוצע');
}
{
  const {sandbox} = buildClient();
  sandbox.DATA = {dashboard:{}, tasks:[{'מזהה משימה':'T1','סטטוס':'פתוח','עדכון אחרון':'2026-07-27 13:42'}], calendarTasks:[]};
  assert.strictEqual(sandbox.applyTaskStatusMutationPatch(result('2026-07-27 13:42')), true, 'equal response must patch');
}
for (const invalid of [null, 'not-a-date']) {
  const {sandbox} = buildClient();
  sandbox.DATA = {dashboard:{}, tasks:[{'מזהה משימה':'T1','סטטוס':'פתוח','עדכון אחרון':'2026-07-27 13:40'}], calendarTasks:[]};
  assert.strictEqual(sandbox.applyTaskStatusMutationPatch(result(invalid)), false);
  assert.strictEqual(sandbox.__BH_TASK_PATCH_LAST_REASON__, 'invalidUpdatedAt');
}
{
  const {sandbox} = buildClient();
  sandbox.DATA = {dashboard:{}, tasks:[{'מזהה משימה':'T1','סטטוס':'פתוח','עדכון אחרון':'2026-07-27 13:43'}], calendarTasks:[]};
  assert.strictEqual(sandbox.applyTaskStatusMutationPatch(result('2026-07-27 13:42')), false, 'older response must not patch');
  assert.strictEqual(sandbox.DATA.tasks[0]['סטטוס'], 'פתוח');
  assert.strictEqual(sandbox.__BH_TASK_PATCH_LAST_REASON__, 'staleResponse');
  assert.strictEqual(sandbox.applyTaskStatusMutationPatch(result('2026-07-27 13:44'), {sequence:1, latestSequence:2}), false, 'reversed local response must not patch');
}
{
  const client = buildClient();
  client.sandbox.DATA = {dashboard:{}, tasks:[{'מזהה משימה':'T1','סטטוס':'פתוח','עדכון אחרון':'2026-07-27 13:40'}], calendarTasks:[]};
  client.sandbox.doneTask('T1');
  client.runners[0].success(result('2026-07-27 13:42'));
  assert.strictEqual(client.refreshes(), 0, 'valid success must not trigger fallback');
  assert.strictEqual(client.sandbox.DATA.tasks[0]['סטטוס'], 'בוצע');
}
{
  const client = buildClient();
  client.sandbox.DATA = {dashboard:{}, tasks:[{'מזהה משימה':'T1','סטטוס':'פתוח','עדכון אחרון':'2026-07-27 13:43'}], calendarTasks:[]};
  client.sandbox.doneTask('T1');
  client.runners[0].success(result('2026-07-27 13:42'));
  assert.strictEqual(client.refreshes(), 1, 'stale success must trigger fallback');
  assert.strictEqual(client.sandbox.DATA.tasks[0]['סטטוס'], 'פתוח', 'stale success must not patch first');
}
{
  const client = buildClient();
  client.sandbox.DATA = {dashboard:{}, tasks:[{'מזהה משימה':'T1','סטטוס':'פתוח','עדכון אחרון':'2026-07-27 13:40'}], calendarTasks:[]};
  client.sandbox.doneTask('T1');
  assert.strictEqual(client.button.disabled, true);
  client.runners[0].failure(new Error('transport'));
  client.runners[0].failure(new Error('transport again'));
  assert.strictEqual(client.refreshes(), 1, 'transport fallback must be single-shot');
  assert.strictEqual(client.button.disabled, false, 'transport fallback must clear busy state');
}

console.log('task status patch runtime assertions passed');
