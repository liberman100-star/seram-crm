const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const server = fs.readFileSync('V2.GS.txt', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');

function functionSource(name) {
  const start = server.indexOf(`function ${name}(`);
  assert(start >= 0, `missing ${name}`);
  const brace = server.indexOf('{', start);
  let depth = 0;
  for (let i = brace; i < server.length; i++) {
    if (server[i] === '{') depth++;
    if (server[i] === '}' && --depth === 0) return server.slice(start, i + 1);
  }
  throw new Error(`unterminated ${name}`);
}

function htmlFunctionSource(name) {
  const start = html.lastIndexOf(`function ${name}(`);
  assert(start >= 0, `missing client function ${name}`);
  const brace = html.indexOf('{', start);
  let depth = 0;
  for (let i = brace; i < html.length; i++) {
    if (html[i] === '{') depth++;
    if (html[i] === '}' && --depth === 0) return html.slice(start, i + 1);
  }
  throw new Error(`unterminated client function ${name}`);
}

function lastWindowFunctionSource(name) {
  const marker = `window.${name} = function(`;
  const start = html.lastIndexOf(marker);
  assert(start >= 0, `missing client assignment ${name}`);
  const brace = html.indexOf('{', start);
  let depth = 0;
  for (let i = brace; i < html.length; i++) {
    if (html[i] === '{') depth++;
    if (html[i] === '}' && --depth === 0) return html.slice(start, i + 2);
  }
  throw new Error(`unterminated client assignment ${name}`);
}

const context = { console };
vm.createContext(context);
['BH_calendarMembersForTask_', 'BH_calendarOwnerForTask_', 'BH_calendarColorIndex_', 'BH_taskCreatorForSave_']
  .forEach(name => vm.runInContext(functionSource(name), context));

const task = { 'יוצר': 'C', 'אחראי': 'D' };
const project = { 'יוצר': 'A', 'אחראי': 'B' };
assert.deepStrictEqual(Array.from(context.BH_calendarMembersForTask_(task, project)), ['A', 'B', 'C', 'D']);
assert.deepStrictEqual(
  Array.from(context.BH_calendarMembersForTask_({ 'יוצר': 'Same', 'אחראי': ' same ' }, { 'יוצר': 'Same', 'אחראי': 'SAME' })),
  ['Same']
);

const twoMembers = context.BH_calendarMembersForTask_({ 'יוצר': 'User', 'אחראי': 'User' }, { 'יוצר': 'Manager' });
assert.deepStrictEqual(Array.from(twoMembers), ['Manager', 'User']);
const event = { id: 'one', date: '2026-08-17', calendarMembers: Array.from(twoMembers) };
const events = [event];
assert.strictEqual(events.filter(e => e.calendarMembers.includes('Manager')).length, 1);
assert.strictEqual(events.filter(e => e.calendarMembers.includes('User')).length, 1);
assert.strictEqual(events.length, 1, 'show all must not duplicate an event per member');

assert.strictEqual(context.BH_taskCreatorForSave_(null, 'Authenticated User'), 'Authenticated User');
assert.strictEqual(context.BH_taskCreatorForSave_({ 'יוצר': 'Original' }, 'Editor'), 'Original');
assert.strictEqual(context.BH_taskCreatorForSave_({}, 'Editor'), '', 'unknown historical creator must stay unknown');

const full = functionSource('BH14_העשרת_נתוני_יומן_');
const fast = functionSource('BH_FAST_enrichCalendar_');
assert(full.includes('BH_calendarMembersForTask_'));
assert(fast.includes('BH_calendarMembersForTask_'));
assert(!full.includes('copy["יוצר אירוע"] ='));
assert(!fast.includes('copy["יוצר אירוע"]=') );

assert(html.includes('return BH_calendarMembers(t).includes(selected);'));
assert(html.includes("${canAll ? '<option value=\"all\">הצג הכל</option>' : ''}"));
assert(html.includes("if(selected === 'all') return canAll;"));
assert(!/BH_creatorBadge\(t\)[\s\S]{0,120}taskCalendarTitleHtml\(t\)/.test(html));
assert(html.includes('<b>נוצר ע״י:</b>'));

// Client authorization regression: membership count never grants "show all".
const clientContext = {
  window: {BH_SELECTED_CALENDAR_OWNER: 'all'},
  DATA: {
    calendarTasks: [{id: 'event', 'תאריך': '2026-08-17', calendarMembers: ['A', 'B'], 'שעה': '09:00'}],
    calendarCreatorPermission: {mode: 'allowed'}
  },
  fmtDateISO: () => '2026-08-17',
  BH_ensureCalendarFilter: () => {}
};
vm.createContext(clientContext);
vm.runInContext(htmlFunctionSource('BH_calendarOwner'), clientContext);
vm.runInContext(htmlFunctionSource('BH_calendarMembers'), clientContext);
vm.runInContext(lastWindowFunctionSource('calendarTasksForDate'), clientContext);
assert.strictEqual(clientContext.window.calendarTasksForDate({}).length, 0, 'forged all is denied without canAll');
clientContext.window.BH_SELECTED_CALENDAR_OWNER = 'B';
assert.strictEqual(clientContext.window.calendarTasksForDate({}).length, 1, 'named member filter remains multi-member aware');
clientContext.DATA.calendarCreatorPermission.mode = 'all';
clientContext.window.BH_SELECTED_CALENDAR_OWNER = 'all';
assert.strictEqual(clientContext.window.calendarTasksForDate({}).length, 1, 'canAll returns each authorized event once');

// Runtime equivalence: Full Core and Fast Opening enrich the same authorized row
// with identical membership, without changing historical creator fields.
const sourceTask = {
  'מזהה משימה': 'T1', 'מזהה פרויקט': 'P1', 'תאריך': '2026-08-17',
  'יוצר': 'C', 'אחראי': 'D', 'יוצר אירוע': 'legacy-value'
};
const sourceProject = {'מזהה פרויקט': 'P1', 'יוצר': 'A', 'אחראי': 'B'};
const fullContext = {
  console,
  SHEETS: {PROJECTS: 'projects', LINKS: 'links'},
  readSheet_: name => name === 'projects' ? [sourceProject] : [],
  BH_AD_userHasProjectDomain_: () => false,
  BH15_ערך_שווה_: (a, b) => String(a || '').toLowerCase() === String(b || '').toLowerCase()
};
vm.createContext(fullContext);
['BH_calendarMembersForTask_', 'BH_calendarColorIndex_', 'BH14_העשרת_נתוני_יומן_']
  .forEach(name => vm.runInContext(functionSource(name), fullContext));
const fullPayload = fullContext.BH14_העשרת_נתוני_יומן_({tasks: [sourceTask]}, {role: 'מנהל ראשי', isOwner: true});

const fastContext = {
  console,
  BH_FAST_calendarProjects_: () => ({P1: sourceProject})
};
vm.createContext(fastContext);
['BH_calendarMembersForTask_', 'BH_calendarColorIndex_', 'BH_FAST_enrichCalendar_']
  .forEach(name => vm.runInContext(functionSource(name), fastContext));
const fastPayload = fastContext.BH_FAST_enrichCalendar_([sourceTask], {role: 'מנהל ראשי', isOwner: true});
assert.deepStrictEqual(Array.from(fullPayload.tasks[0].calendarMembers), ['A', 'B', 'C', 'D']);
assert.deepStrictEqual(Array.from(fastPayload.tasks[0].calendarMembers), ['A', 'B', 'C', 'D']);
assert.strictEqual(fullPayload.tasks[0]['יוצר'], 'C');
assert.strictEqual(fastPayload.tasks[0]['יוצר'], 'C');
assert.strictEqual(fullPayload.tasks[0]['יוצר אירוע'], 'legacy-value');
assert.strictEqual(fastPayload.tasks[0]['יוצר אירוע'], 'legacy-value');

console.log('calendar multi-membership runtime assertions passed');
