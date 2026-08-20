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

const rawDate = new Date(Date.UTC(2026, 7, 13, 14, 35));
const headers = ['מזהה משימה', 'תאריך', 'עדכון אחרון', 'כותרת', 'משך פגישה', 'מיקום', 'בארכיון'];
const rawRows = [
  ['T-1', rawDate, rawDate, 'בדיקת פתיחה', 30, '', ''],
  ['T-2', '', '', 'ללא תאריך', 0, null, '']
];
const sheet = {
  getLastColumn: () => headers.length,
  getLastRow: () => rawRows.length + 1,
  getRange(row, column, rowCount, columnCount) {
    let values;
    if (row === 1) values = [headers.slice(column - 1, column - 1 + columnCount)];
    else values = rawRows.slice(row - 2, row - 2 + rowCount).map(r => r.slice(column - 1, column - 1 + columnCount));
    return {getValues: () => values};
  }
};
const sandbox = {
  Date, Array, Object, String, Number, Math,
  SHEETS: {TASKS: 'tasks', PROJECTS: 'projects', CONTACTS: 'contacts'},
  CONFIG: {TIMEZONE: 'UTC'},
  Utilities: {formatDate(value, timezone, pattern) {
    assert.strictEqual(timezone, 'UTC');
    const pad = n => String(n).padStart(2, '0');
    const date = `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}`;
    if (pattern === 'yyyy-MM-dd HH:mm') return `${date} ${pad(value.getUTCHours())}:${pad(value.getUTCMinutes())}`;
    return date;
  }},
  getSS_: () => ({getSheetByName: name => name === 'tasks' ? sheet : null}),
  __BH_REQUEST_PERF__: null,
  פעולות_מותרות_Build11_2_: () => ({canSeeSettings:true, canSeeDashboard:true, canSeeArchive:true, canSeeTimeline:true, canCreate:true, canEdit:true, canDelete:true, readOnly:false}),
  מיתוג_מערכת_Build7_: () => ({name:'CRM'}),
  calcDashboard_: () => ({openTasks:1}),
  BH_DB_attachCoreBranding_: data => data
};
vm.createContext(sandbox);
for (const name of ['formatValue_', 'BH_calendarMembersForTask_', 'BH_calendarOwnerForTask_', 'BH_calendarColorIndex_', 'BH_FAST_currentUser_', 'BH_FAST_trackRangeRead_', 'BH_FAST_sheetShape_', 'BH_FAST_column_', 'BH_FAST_fullRows_', 'BH_FAST_activeSummary_', 'BH_FAST_taskSummary_', 'BH_FAST_calendarProjects_', 'BH_FAST_enrichCalendar_', 'BH_FAST_shellForPrivilegedUser_']) {
  vm.runInContext(functionSource(name), sandbox);
}

const payload = sandbox.BH_FAST_shellForPrivilegedUser_({email:'admin@example.com', role:'מנהל ראשי', allowed:true});
assert.strictEqual(payload.payloadType, 'openingShell');
assert.strictEqual(Array.isArray(payload.tasks), true);
assert.strictEqual(Array.isArray(payload.calendarTasks), true);
assert.strictEqual(payload.tasks.length, 1, 'only dated tasks are included in the opening shell');
assert.strictEqual(payload.tasks[0]['תאריך'], '2026-08-13', 'date uses the canonical readSheet_ date representation');
assert.strictEqual(payload.tasks[0]['עדכון אחרון'], '2026-08-13 14:35', 'timestamp uses the canonical readSheet_ representation');
assert.strictEqual(payload.tasks[0]['כותרת'], 'בדיקת פתיחה');
assert.strictEqual(payload.tasks[0]['משך פגישה'], 30);
assert.strictEqual(payload.tasks[0]['מיקום'], '');
assert.strictEqual(payload.calendarTasks[0], payload.tasks[0], 'the existing shared dated-task projection is preserved');
const serialized = JSON.stringify(payload);
assert.doesNotThrow(() => JSON.parse(serialized));
assert.strictEqual(serialized.includes('[Ljava.lang.Object;'), false);

// This is the opening contract used by the browser before deciding whether Full Core fallback is needed.
const openingIsValid = d => !!(d && d.auth && d.auth.allowed === true && d.payloadType === 'openingShell' &&
  d.schemaVersion === 1 && d.loadedModules && d.loadedModules.dashboard === true &&
  Array.isArray(d.tasks) && Array.isArray(d.calendarTasks));
assert.strictEqual(openingIsValid(payload), true, 'valid JSON-safe opening does not require Full Core fallback');
console.log('fast opening JSON-safe runtime assertions passed');
