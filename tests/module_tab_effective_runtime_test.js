const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const html = fs.readFileSync('index.html', 'utf8');
function functionSource(name, next) {
  const start = html.indexOf('function ' + name);
  assert(start >= 0, name + ' declaration exists');
  const end = html.indexOf('function ' + next, start + 1);
  assert(end > start, name + ' declaration can be sliced');
  return html.slice(start, end);
}
function scriptAfter(marker) {
  const markerAt = html.indexOf(marker);
  assert(markerAt >= 0, marker + ' exists');
  const start = html.indexOf('<script', markerAt);
  const body = html.indexOf('>', start) + 1;
  const end = html.indexOf('</script>', body);
  return html.slice(body, end);
}
function scriptById(id) { return scriptAfter(`<script id="${id}"`); }

const elements = new Map();
function element(id) {
  if (!elements.has(id)) elements.set(id, {
    id, value: '', style: {}, innerHTML: '', classList: {
      hidden: false, active: false,
      add(v) { this[v] = true; }, remove(v) { this[v] = false; },
      toggle(v, on) { this[v] = on; }, contains(v) { return !!this[v]; }
    }, removeAttribute() {}, remove() {}
  });
  return elements.get(id);
}
['dashboard','projects','contacts','tasks','settings','archive','projectsTable','contactsTable','tasksTable','settingsBox','archiveBox',
 'projectSearch','projectSort','contactSearch','contactSort','taskSearch','taskProjectFilter','taskFilter','taskStatusFilter','taskDateFilter','taskArchiveFilter','archiveSearch','archiveFilter']
  .forEach(element);
const sections = ['dashboard','projects','contacts','tasks','settings','archive'].map(element);
const buttons = sections.map(s => element('btn_' + s.id));

let successHandler, failureHandler;
const requests = [];
const renders = {dashboard:0, projects:0, contacts:0, tasks:0, settings:0, archive:0};
const sandbox = {
  console, Date, setTimeout(fn){ fn(); }, clearTimeout(){}, alert(){},
  window: null, DATA: {currentUser:{}, system:{}}, SETTINGS_TAB: 'other', CAL_VIEW:'month', CAL_DATE:new Date(),
  __BH_LOADED_MODULES__: {}, __BH_LOADING_MODULE__: {}, ARCHIVE_TAB:'contacts',
  document: {
    documentElement:{style:{setProperty(){}}},
    getElementById: element,
    querySelectorAll(sel){ if(sel === 'main section') return sections; if(sel === 'nav button') return buttons; return []; },
    querySelector(sel){ return sel.includes('module-loading') ? null : null; },
    addEventListener(){}
  },
  currentToken(){ return 'token'; }, clearToken(){ sandbox.tokenCleared = true; }, showLogin(){ sandbox.loginShown = true; },
  closeM(){ sandbox.modalClosed = (sandbox.modalClosed || 0) + 1; },
  renderDashboard(){ renders.dashboard++; }, tableProjects(){ renders.projects++; }, tableContacts(){ renders.contacts++; },
  tableTasks(){ renders.tasks++; }, renderSettings(){ renders.settings++; }, renderArchive(type){ renders.archive++; sandbox.archiveType = type; },
  applySecurityUI(){ sandbox.securityCalls = (sandbox.securityCalls || 0) + 1; },
  mergeData_Build13_2(d){ Object.assign(sandbox.DATA, d); },
  CRM_newPerfRequest_(){ return {requestId:'r',started:0}; }, CRM_perfNow_(){ return 1; }, CRM_perfElapsed_(){ return 1; },
  CRM_perfLog_(){}, CRM_payloadBytes_(){ return 1; }, CRM_logServerDiagnostics_(){},
  greetingByHour(){ return 'hi'; }, esc(v){ return String(v); }, normalizeLogoUrl(v){return v;},
  render(){}, setCalendarView(){}, renderCalendarDashboard(){},
  google:{script:{run:{
    withSuccessHandler(fn){ successHandler=fn; return this; },
    withFailureHandler(fn){ failureHandler=fn; return this; },
    קבלת_מודול_Build13_2(token,module){ requests.push(module); }
  }}}
};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext([
  functionSource('ensureModule_Build13_2','showModuleLoading_Build13_4'),
  functionSource('showModuleLoading_Build13_4','hideModuleLoading_Build13_4'),
  functionSource('hideModuleLoading_Build13_4','loadModule_Build13_2'),
  functionSource('loadModule_Build13_2','renderModule_Build13_2'),
  functionSource('renderModule_Build13_2','refreshCore'),
  scriptAfter('<!-- FINAL PATCH'),
  scriptById('BH_TOP_LEVEL_TAB_RESET'),
  scriptById('BH_ASSIGNMENT_DOMAIN_BRANDING')
].join('\n'), sandbox);

const effectiveEnsure = sandbox.ensureModule_Build13_2;
const ensureCalls = [];
sandbox.ensureModule_Build13_2 = function(module){
  ensureCalls.push(module);
  return effectiveEnsure.apply(this, arguments);
};

// The actual inline handlers must resolve the final window.tab after every override.
for (const id of ['projects','contacts','tasks','archive','settings']) {
  assert(new RegExp(`onclick="tab\\('${id}',this\\)"`).test(html), id + ' inline handler uses global final tab');
}

function clickAndSucceed(module) {
  sandbox.tab(module, element('btn_' + module));
  assert.strictEqual(ensureCalls.filter(x => x === module).length, 1, module + ' effective tab calls ensureModule');
  assert.strictEqual(requests.filter(x => x === module).length, 1, module + ' first click sends one RPC');
  assert.strictEqual(renders[module], 0, module + ' does not directly render before RPC');
  successHandler({auth:{allowed:true}, loadedModules:{[module]:true}, [module]:[]});
  assert.strictEqual(renders[module], 1, module + ' renders once after RPC');
}
for (const module of ['projects','contacts','tasks']) clickAndSucceed(module);

sandbox.tab('settings', element('btn_settings'));
assert.strictEqual(ensureCalls.filter(x => x === 'settings').length, 1, 'settings effective tab calls ensureModule');
assert.strictEqual(sandbox.SETTINGS_TAB, 'categories', 'settings reset happens before module render');
assert.strictEqual(requests.filter(x => x === 'settings').length, 1, 'settings sends one RPC');
successHandler({auth:{allowed:true}, loadedModules:{settings:true}, realSettings:{categories:[]}});
assert.strictEqual(renders.settings, 1, 'settings renders once without clickSettingsTab double render');

sandbox.ARCHIVE_TAB = 'tasks';
sandbox.tab('archive', element('btn_archive'));
assert.strictEqual(ensureCalls.filter(x => x === 'archive').length, 1, 'archive effective tab calls ensureModule');
assert.strictEqual(sandbox.ARCHIVE_TAB, 'projects', 'archive wrapper resets active archive type');
assert.strictEqual(requests.filter(x => x === 'archive').length, 1, 'archive sends one RPC');
successHandler({auth:{allowed:true}, loadedModules:{archive:true}, projects:[], contacts:[], tasks:[]});
assert.strictEqual(renders.archive, 1, 'archive renders after its payload');
assert.strictEqual(sandbox.archiveType, 'projects', 'archive renderer receives active ARCHIVE_TAB');
assert.deepStrictEqual({projects:renders.projects,contacts:renders.contacts,tasks:renders.tasks}, {projects:1,contacts:1,tasks:1}, 'archive load does not render active collections');

sandbox.tab('projects', element('btn_projects'));
assert.strictEqual(requests.filter(x => x === 'projects').length, 1, 'loaded module second click sends no RPC');
assert.strictEqual(renders.projects, 2, 'loaded module uses renderModule only');

const requestCountBeforeDashboard = requests.length;
sandbox.tab('dashboard', element('btn_dashboard'));
assert.strictEqual(requests.length, requestCountBeforeDashboard, 'dashboard sends no module RPC');
assert.strictEqual(ensureCalls.includes('dashboard'), false, 'dashboard bypasses ensureModule');
assert.strictEqual(renders.dashboard, 1, 'dashboard preserves direct dashboard behavior');

// A rapid duplicate click shares the in-flight request and only the response renders.
sandbox.__BH_LOADED_MODULES__.contacts = false;
sandbox.tab('contacts', element('btn_contacts'));
sandbox.tab('contacts', element('btn_contacts'));
assert.strictEqual(requests.filter(x => x === 'contacts').length, 2, 'two rapid clicks add only one new contacts RPC');
successHandler({auth:{allowed:true},loadedModules:{contacts:true},contacts:[]});
assert.strictEqual(sandbox.__BH_LOADING_MODULE__.contacts, false, 'success clears loading state');

sandbox.__BH_LOADED_MODULES__.tasks = false;
sandbox.tab('tasks', element('btn_tasks'));
failureHandler({message:'network'});
assert.strictEqual(sandbox.__BH_LOADING_MODULE__.tasks, false, 'transport failure clears loading state');

sandbox.__BH_LOADED_MODULES__.projects = false;
sandbox.tab('projects', element('btn_projects'));
successHandler({auth:{allowed:true},projects:[]});
assert.notStrictEqual(sandbox.__BH_LOADED_MODULES__.projects, true, 'invalid payload is not marked loaded');
assert.strictEqual(sandbox.__BH_LOADING_MODULE__.projects, false, 'invalid payload leaves loading state clean');

sandbox.__BH_LOADED_MODULES__.archive = false;
sandbox.tab('archive', element('btn_archive'));
successHandler({auth:{allowed:false,reason:'expired'}});
assert.strictEqual(sandbox.tokenCleared, true, 'expired session clears token');
assert.strictEqual(sandbox.loginShown, true, 'expired session follows canonical login path');

assert(/else if\(\{projects:1,contacts:1,tasks:1,settings:1,archive:1\}\[id\]\) ensureModule_Build13_2\(id\)/.test(scriptAfter('<!-- FINAL PATCH')), 'late implementation delegates every lazy module to ensureModule');
assert(!/if\(id==='(?:projects|contacts|tasks|settings|archive)'\)\s*(?:tableProjects|tableContacts|tableTasks|renderSettings|renderArchive)/.test(scriptAfter('<!-- FINAL PATCH')), 'late tab has no direct module renderer bypass');
console.log('effective module tab runtime assertions passed');
