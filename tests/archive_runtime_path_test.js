const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const html = fs.readFileSync('index.html', 'utf8');
function sliceFn(name, next){
  const start = html.indexOf('function ' + name);
  assert(start >= 0, name + ' exists');
  const end = next ? html.indexOf('function ' + next, start + 1) : html.indexOf('\nfunction ', start + 10);
  assert(end > start, name + ' has end');
  return html.slice(start, end);
}

let successHandler;
const code = [
  'var window = {}; var DATA = {}; window.DATA = DATA; var __BH_LOADED_MODULES__ = {}; var __BH_LOADING_MODULE__ = {};',
  'var renderArchiveCalls = []; var projectsRendered = 0; var contactsRendered = 0; var tasksRendered = 0; var settingsRendered = 0; var dashboardRendered = 0;',
  'function currentToken(){ return "token"; } function hideModuleLoading_Build13_4(){} function showModuleLoading_Build13_4(){} function clearToken(){} function showLogin(){}',
  'function tableProjects(){ projectsRendered++; } function tableContacts(){ contactsRendered++; } function tableTasks(){ tasksRendered++; } function renderSettings(){ settingsRendered++; } function renderDashboard(){ dashboardRendered++; } function renderShell_Build13_2(d){ mergeData_Build13_2(d); } function applySecurityUI(){}',
  'var google = { script: { run: { withSuccessHandler(fn){ successHandler = fn; return this; }, withFailureHandler(){ return this; }, קבלת_מודול_Build13_2(){} } } };',
  'function canSeeArchive(){ return true; }',
  'function esc(v){ return String(v || ""); }',
  'var archiveContent = { innerHTML: "" };',
  'function tableHtml(rows){ return rows.length ? "ROWS:" + rows.map(r => r["מזהה משימה"] || r["מזהה פרויקט"] || r["מזהה איש קשר"]).join(",") : "אין נתונים להצגה"; }',
  'function renderArchive(type){ renderArchiveCalls.push(type || "projects"); return renderArchiveOriginal(type || "projects"); }',
  sliceFn('mergeData_Build13_2', 'hasRealModuleData_Build13_2'),
  sliceFn('hasRealModuleData_Build13_2', 'markLoadedModulesFromFullCore_Build13_2'),
  sliceFn('archivedRowsFor', 'renderArchive').replace('function archivedRowsFor', 'function archivedRowsFor'),
  sliceFn('renderArchive', 'restoreArchive').replace('function renderArchive', 'function renderArchiveOriginal'),
  sliceFn('loadModule_Build13_2', 'renderModule_Build13_2'),
  sliceFn('renderModule_Build13_2', 'refreshCore')
].join('\n');

const sandbox = { successHandler };
vm.createContext(sandbox);
vm.runInContext(code, sandbox);

const sourceTasks = [
  {'מזהה משימה':'ARCH_ACTIVE_PROJECT','מזהה פרויקט':'ACTIVE_P','בארכיון':'כן'},
  {'מזהה משימה':'ARCH_SPACES','מזהה פרויקט':'ACTIVE_P','בארכיון':' כן '},
  {'מזהה משימה':'ACTIVE','מזהה פרויקט':'ACTIVE_P','בארכיון':''}
];
const snapshot = JSON.stringify(sourceTasks);
const archivePayload = {
  auth:{allowed:true},
  loadedModules:{archive:true},
  projects:[],
  contacts:[],
  tasks: sourceTasks.filter(t => String(t['בארכיון'] || '').trim() === 'כן')
};

sandbox.DATA = { archive: { tasks: [] }, tasks: [{'מזהה משימה':'ACTIVE','בארכיון':''}] };
sandbox.window.DATA = sandbox.DATA;
sandbox.loadModule_Build13_2('archive');
assert.strictEqual(sandbox.__BH_LOADING_MODULE__.archive, true, 'archive async load starts');
assert.strictEqual(sandbox.renderArchiveCalls.length, 0, 'archive is not rendered before async payload returns');

sandbox.successHandler(archivePayload);
assert.strictEqual(JSON.stringify(sandbox.DATA.archive.tasks.map(t => t['מזהה משימה']).sort()), JSON.stringify(['ARCH_ACTIVE_PROJECT','ARCH_SPACES']), 'async merge replaces stale DATA.archive.tasks with archive module tasks');
assert.strictEqual(JSON.stringify(sourceTasks), snapshot, 'async merge path does not mutate source rows');
assert.strictEqual(JSON.stringify(sandbox.archivedRowsFor('tasks').map(t => t['מזהה משימה']).sort()), JSON.stringify(['ARCH_ACTIVE_PROJECT','ARCH_SPACES']), 'archivedRowsFor returns archive cache tasks after async load');
assert(sandbox.renderArchiveCalls.includes('projects'), 'loadModule success renders the loaded archive module');

sandbox.renderArchiveOriginal('tasks');
assert(!/אין נתונים להצגה/.test(sandbox.archiveContent.innerHTML), 'renderer does not show empty state when archived rows exist');
assert(/ARCH_ACTIVE_PROJECT/.test(sandbox.archiveContent.innerHTML), 'archived task linked to an active project is rendered');
assert(!/ACTIVE(?!_PROJECT)/.test(sandbox.archiveContent.innerHTML), 'active tasks remain excluded');

console.log('archive runtime path assertions passed');
