const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const server = fs.readFileSync('V2.GS.txt', 'utf8');
function functionSource(name) {
  const start = server.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `missing function ${name}`);
  const brace = server.indexOf('{', start);
  let depth = 0;
  for (let i = brace; i < server.length; i++) {
    if (server[i] === '{') depth++;
    if (server[i] === '}' && --depth === 0) return server.slice(start, i + 1);
  }
  throw new Error(`unterminated function ${name}`);
}

const projectHeaders = ['מזהה פרויקט', 'יוצר', 'אחראי', 'שם פרויקט', 'בארכיון'];
const projectRows = [
  ['P1', 'אברהם', 'אחר', 'אחד', ''],
  ['P2', '', 'משה', 'שניים', ''],
  ['P3', '', '', 'שלושה', ''],
  ['P4', '', '', 'ארבעה', ''],
  ['P5', '', '', 'חמישה', '']
];
const taskHeaders = ['מזהה משימה', 'מזהה פרויקט', 'תאריך', 'יוצר', 'יוצר אירוע', 'אחראי', 'בארכיון'];
const taskRows = [
  ['T1', 'P1', '2026-08-16', 'משתמש', '', 'אברהם ליברמן מנהל', ''],
  ['T2', 'P2', '2026-08-16', '', '', '', ''],
  ['T3', 'P3', '2026-08-16', '', 'דוד', 'משה', ''],
  ['T4', 'P4', '2026-08-16', 'משה', '', 'משה', ''],
  ['T5', 'P5', '2026-08-16', '', '', '', '']
];
function sheet(headers, rows) {
  return {
    getLastColumn: () => headers.length,
    getLastRow: () => rows.length + 1,
    getRange(row, column, rowCount, columnCount) {
      const values = row === 1
        ? [headers.slice(column - 1, column - 1 + columnCount)]
        : rows.slice(row - 2, row - 2 + rowCount).map(r => r.slice(column - 1, column - 1 + columnCount));
      return {getValues: () => values};
    }
  };
}
const sheets = {tasks: sheet(taskHeaders, taskRows), projects: sheet(projectHeaders, projectRows), contacts: sheet([], [])};
const sandbox = {
  Array, Object, String, Number, Math, Date, Set,
  SHEETS: {TASKS:'tasks', PROJECTS:'projects', CONTACTS:'contacts'},
  getSS_: () => ({getSheetByName: name => sheets[name] || null}),
  formatValue_: value => value == null ? '' : value,
  __BH_REQUEST_PERF__: null,
  פעולות_מותרות_Build11_2_: () => ({canSeeSettings:true, canSeeDashboard:true}),
  מיתוג_מערכת_Build7_: () => ({}),
  calcDashboard_: () => ({}),
  BH_DB_attachCoreBranding_: data => data
};
vm.createContext(sandbox);
[
  'BH_calendarMembersForTask_', 'BH_calendarOwnerForTask_', 'BH_calendarColorIndex_', 'BH_FAST_currentUser_', 'BH_FAST_trackRangeRead_',
  'BH_FAST_sheetShape_', 'BH_FAST_column_', 'BH_FAST_fullRows_', 'BH_FAST_activeSummary_',
  'BH_FAST_taskSummary_', 'BH_FAST_calendarProjects_', 'BH_FAST_enrichCalendar_', 'BH_FAST_shellForPrivilegedUser_'
].forEach(name => vm.runInContext(functionSource(name), sandbox));

const legacyExpected = ['אברהם', 'משה', 'דוד', 'משה', 'ללא יוצר'];
taskRows.forEach((row, index) => {
  const task = Object.fromEntries(taskHeaders.map((header, i) => [header, row[i]]));
  const project = Object.fromEntries(projectHeaders.map((header, i) => [header, projectRows[index][i]]));
  assert.strictEqual(sandbox.BH_calendarOwnerForTask_(task, project), legacyExpected[index], `legacy precedence case ${index + 1}`);
});

const payload = sandbox.BH_FAST_shellForPrivilegedUser_({email:'owner@example.com', role:'מנהל ראשי', isOwner:true});
const expected = ['אברהם', 'משה', 'משה', 'משה', 'ללא יומן'];
assert.deepStrictEqual(Array.from(payload.tasks, task => task['יומן']), expected);
for (let index = 0; index < payload.tasks.length; index++) {
  const task = payload.tasks[index];
  assert.strictEqual(task['יוצר אירוע'], taskRows[index][4], 'calendar enrichment preserves legacy field');
  assert.strictEqual(Array.isArray(task.calendarMembers), true);
  assert.strictEqual(task['תג יומן'], task['יומן']);
  assert.strictEqual(task.calendarKey, task['יומן']);
  assert.strictEqual(Number.isInteger(task.calendarColorIndex), true);
}
assert.strictEqual(payload.calendarCreatorPermission.mode, 'all');
assert.strictEqual(Array.isArray(payload.calendarCreatorsAllowed), true);
['אברהם', 'אחר', 'משתמש', 'אברהם ליברמן מנהל', 'משה'].forEach(owner => assert.ok(payload.calendarCreatorsAllowed.includes(owner)));
assert.strictEqual(payload.calendarCreatorPermission.mode === 'all', true, 'existing client contract can render הצג הכל');
assert.strictEqual(Array.isArray(payload.tasks), true);
assert.strictEqual(Array.isArray(payload.calendarTasks), true);
const serialized = JSON.stringify(payload);
assert.doesNotThrow(() => JSON.parse(serialized));
assert.strictEqual(serialized.includes('[Ljava.lang.Object;'), false);
assert.strictEqual(server.includes('BH_perf_originalCore_(token)'), false, 'test fixture does not introduce a Full Core call');
console.log('fast opening calendar runtime assertions passed');
