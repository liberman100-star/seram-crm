const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');
const start = html.indexOf('function loadModule_Build13_2');
const end = html.indexOf('function refreshCore', start);
const source = `let __BH_LOADING_MODULE__ = {};\n${html.slice(start, end)}`;
let success;
let failure;
let rpcCount = 0;
const calls = {};
const bump = name => { calls[name] = (calls[name] || 0) + 1; };
const runner = {
  withSuccessHandler(fn){ success = fn; return this; },
  withFailureHandler(fn){ failure = fn; return this; },
  קבלת_מודול_Build13_2(){ rpcCount++; }
};
const sandbox = {
  window:null, console:{log(){}}, DATA:{projects:[{id:'old'}], contacts:[], tasks:[], dashboard:{}},
  document:{getElementById(){ return null; }, querySelector(){ return null; }},
  google:{script:{run:runner}}, currentToken:()=> 'TOKEN', showModuleLoading_Build13_4(){}, hideModuleLoading_Build13_4(){},
  CRM_newPerfRequest_:()=>({requestId:'r1',started:0}), CRM_perfNow_:(()=>{ let n=0; return ()=>++n; })(),
  CRM_perfElapsed_:()=> '1ms', CRM_perfLog_(){}, CRM_logServerDiagnostics_(){}, CRM_payloadBytes_:()=> 1,
  BH_isCustomerDomainSelectionRequired:()=> false, clearToken(){}, showLogin(){}, alert(){ bump('alert'); },
  hasValidModulePayload_Build13_2:(module,d)=>!!(d.loadedModules && d.loadedModules[module] && Object.prototype.hasOwnProperty.call(d,module)),
  mergeData_Build13_2(d){ bump('merge'); Object.keys(d).forEach(k=>{ if(k !== 'loadedModules' && k !== 'auth') sandbox.DATA[k]=d[k]; }); sandbox.window.DATA=sandbox.DATA; },
  tableProjects(){ bump('projects'); }, tableContacts(){ bump('contacts'); }, tableTasks(){ bump('tasks'); },
  renderSettings(){ bump('settings'); }, renderArchive(type){ calls.archiveType=type; bump('archive'); },
  renderDashboard(){ bump('dashboard'); bump('calendar'); }, renderCalendarDashboard(){ bump('calendar'); }, applySecurityUI(){ bump('security'); }
};
sandbox.window = sandbox;
sandbox.__BH_LOADED_MODULES__ = {};
vm.createContext(sandbox);
vm.runInContext(source, sandbox);

let waiterOne = 0;
let waiterTwo = 0;
sandbox.loadModule_Build13_2('projects', ()=>waiterOne++);
sandbox.loadModule_Build13_2('projects', ()=>waiterTwo++);
assert.strictEqual(rpcCount, 1, 'duplicate in-flight module request is blocked');
success({auth:{allowed:true},loadedModules:{projects:true},projects:[]});
assert.strictEqual(calls.merge, 1, 'payload is merged once');
assert.strictEqual(calls.projects, 1, 'requested table renders once');
assert.strictEqual(calls.contacts || 0, 0, 'contacts do not render for projects');
assert.strictEqual(calls.tasks || 0, 0, 'tasks do not render for projects');
assert.strictEqual(calls.settings || 0, 0, 'settings do not render for projects');
assert.strictEqual(calls.dashboard || 0, 0, 'dashboard does not render without dashboard payload');
assert.deepStrictEqual([waiterOne,waiterTwo], [1,1], 'each queued callback runs exactly once');

for(const module of ['contacts','tasks','settings']){
  const before = Object.assign({}, calls);
  const payload = {auth:{allowed:true},loadedModules:{[module]:true},[module]:[]};
  if(module === 'settings'){ delete payload.settings; payload.realSettings={categories:[]}; sandbox.hasValidModulePayload_Build13_2=()=>true; }
  sandbox.loadModule_Build13_2(module);
  success(payload);
  assert.strictEqual((calls[module] || 0) - (before[module] || 0), 1, `${module} renders once`);
}
assert.strictEqual(calls.projects, 1, 'other modules never rerender projects');

const calendarBefore = calls.calendar || 0;
sandbox.__BH_LOADED_MODULES__.tasks = false;
sandbox.hasValidModulePayload_Build13_2=()=>true;
sandbox.loadModule_Build13_2('tasks');
success({auth:{allowed:true},loadedModules:{tasks:true},tasks:[{id:'t'}],calendarTasks:[{id:'t'}],dashboard:{lateTasks:[]}});
assert.strictEqual(calls.dashboard, 1, 'task dashboard dependency renders at most once');
assert.strictEqual((calls.calendar || 0) - calendarBefore, 1, 'dashboard-owned calendar renders once');

sandbox.window.ARCHIVE_TAB = 'contacts';
sandbox.loadModule_Build13_2('archive');
success({auth:{allowed:true},loadedModules:{archive:true},archive:[]});
assert.strictEqual(calls.archiveType, 'contacts', 'archive active type is preserved');

sandbox.__BH_LOADED_MODULES__.projects = false;
sandbox.loadModule_Build13_2('projects');
failure(new Error('transport'));
assert.strictEqual(vm.runInContext('__BH_LOADING_MODULE__.projects', sandbox), false, 'transport failure clears loading state');

sandbox.loadModule_Build13_2('projects');
sandbox.hasValidModulePayload_Build13_2=(module,d)=>!!(d.loadedModules && d.loadedModules[module] && Object.prototype.hasOwnProperty.call(d,module));
success({auth:{allowed:true},loadedModules:{projects:true}});
assert.strictEqual(sandbox.__BH_LOADED_MODULES__.projects, false, 'invalid payload is not marked loaded');
console.log('module_load_pipeline_runtime_test: OK');
