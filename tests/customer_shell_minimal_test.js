const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const gs = fs.readFileSync('V2.GS.txt','utf8');
const html = fs.readFileSync('index.html','utf8');
function bodyOf(name){
  const idx = gs.indexOf('function '+name);
  assert(idx >= 0, name+' exists');
  const next = gs.indexOf('\nfunction ', idx + 10);
  return gs.slice(idx, next < 0 ? gs.length : next);
}
const minimal = bodyOf('BH_CAD_availableDomainsForCustomerMinimal_');
assert(/readSheet_\(SHEETS\.LINKS\)/.test(minimal), 'minimal discovery reads links');
assert(/readSheet_\(SHEETS\.PROJECTS\)/.test(minimal), 'minimal discovery reads projects');
assert(/readSheet_\("הגדרות_ערכים"\)/.test(gs.slice(gs.indexOf('function BH_CAD_activeDomainSetMinimal_'), gs.indexOf('function BH_CAD_isActivePortalLink_'))), 'minimal discovery reads active domain options');
assert(!/SHEETS\.CONTACTS|TASK_NOTES|הרשאות/.test(minimal), 'minimal discovery does not read broad datasets');
assert(/BH_CAD_isActivePortalLink_/.test(minimal) && /מורשה צפייה בפורטל/.test(gs), 'portal visibility is enforced');
assert(/בארכיון/.test(minimal), 'archived projects are excluded');

const apply = gs.slice(gs.indexOf('function BH13_4_applyCustomerDomainIfNeeded_'), gs.indexOf('var BH13_4_originalOpening_'));
assert(!/קבלת_נתוני_מערכת_מלאים_Build10_/.test(apply), 'customer shell/domain filter does not call full CRM loader');
assert(/domains\.length === 1[\s\S]*BH_CAD_setSessionDomain_/.test(apply), 'single-domain customer auto-selection persists session');
assert(/domains\.length > 1 && !selected[\s\S]*BH_CAD_domainRequiredPayload_/.test(apply), 'multi-domain customer gate is preserved');
assert(/domains\.indexOf\(selected\) === -1/.test(apply), 'selected domain is validated');
assert(/payloadType === "openingShell"/.test(apply) && /projectPayloadTypes/.test(apply), 'payload type controls filtering rather than empty-array truthiness');
assert(/payloadType === "contacts"[\s\S]*BH13_4_filterContactsModuleForCustomer_/.test(apply), 'contacts module has dedicated customer narrowing');

const shell = bodyOf('BH13_4_customerShellPayload_');
['auth','system','rootBranding','defaultBranding','currentUser','canSeeSettings','canSeeDashboard','canSeeArchive','actionPermissions','dashboard','loadedModules'].forEach(k=>assert(shell.includes(k), 'shell preserves '+k));
assert(!/projects:0, contacts:0, tasks:0/.test(shell), 'customer shell does not return fake zero dashboard');

const start = gs.indexOf('function BH_CAD_activeDomainSetMinimal_');
const end = gs.indexOf('var BH13_4_originalOpening_');
const code = gs.slice(start, end);
function runScenario({projects, links, tasks, settings, sessionDomain=''}){
  const writes = [];
  const sandbox = {
    console,
    SHEETS:{LINKS:'links', PROJECTS:'projects', TASKS:'tasks'},
    BH_AD_CATEGORY:'תחום שיוך', BH_AD_DEFAULT:'ללא שיוך', BH_CAD_SESSION_FIELD:'תחום שיוך פעיל',
    readSheet_(name){ return ({links, projects, tasks, 'הגדרות_ערכים':settings}[name] || []).map(r=>Object.assign({}, r)); },
    BH_AD_projectDomain_(p){ return String((p && p['תחום שיוך']) || 'ללא שיוך').trim(); },
    BH_DB_brandingForDomain_(d){ return {name:'brand '+d}; },
    BH_DB_defaultBranding_(){ return {name:'default'}; },
    פעולות_מותרות_Build11_2_(){ return {canSeeSettings:false, canSeeDashboard:true, canSeeArchive:false, canSeeTimeline:false, canCreate:false, canEdit:false, canDelete:false, readOnly:true}; },
    calcDashboard_(ps, cs, ts){
      const today = new Date(); today.setHours(0,0,0,0);
      const open = ts.filter(t=>!['בוצע','בוטל'].includes(t['סטטוס']||''));
      const toDate = t => { if(!t['תאריך']) return null; const d = new Date(t['תאריך']); d.setHours(0,0,0,0); return d; };
      return {projectsCount:ps.length, contactsCount:cs.length, tasksCount:ts.length,
        lateTasks:open.filter(t=>{const d=toDate(t); return d && d<today;}),
        todayTasks:open.filter(t=>{const d=toDate(t); return d && d.getTime()===today.getTime();}),
        weekTasks:[], activeProjects:ps.slice(0,5)};
    },
    קבלת_משתמש_מסשן_Build7_(){ return {allowed:true, role:'לקוח', contactId:'C1'}; },
    BH_CAD_session_(){ return {'תחום שיוך פעיל':sessionDomain}; },
    BH_CAD_setSessionDomain_(token, domain){ writes.push(domain); sessionDomain = domain; return true; },
    BH_CAD_domainRequiredPayload_(user, domains){ return {auth:{allowed:true, domainSelectionRequired:true}, customerDomainSelection:{required:true, domains}, currentUser:user}; },
    BH_CAD_applySelectedDomainFilter_(payload){ payload.appliedFullFilter = true; return payload; }
  };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  const out = sandbox.BH13_4_applyCustomerDomainIfNeeded_(null, 'T', 'openingShell');
  return {out, writes};
}
const todayIso = new Date().toISOString().slice(0,10);
const yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1); const yesterdayIso = yesterday.toISOString().slice(0,10);
const settings = [{'סוג ערך':'תחום שיוך','ערך':'A','פעיל':'כן'}, {'סוג ערך':'תחום שיוך','ערך':'B','פעיל':'כן'}];
const one = runScenario({settings, projects:[{'מזהה פרויקט':'P1','תחום שיוך':'A'}], links:[{'מזהה פרויקט':'P1','מזהה איש קשר':'C1','מורשה צפייה בפורטל':'כן'}], tasks:[{'מזהה משימה':'T1','מזהה פרויקט':'P1','תאריך':todayIso,'סטטוס':'פתוח'}, {'מזהה משימה':'T2','מזהה פרויקט':'P1','תאריך':yesterdayIso,'סטטוס':'פתוח'}]});
assert.strictEqual(one.out.dashboard.projectsCount, 1, 'customer with one visible project gets projects=1');
assert.strictEqual(one.out.dashboard.tasksCount, 2, 'authorized task total is real');
assert.strictEqual(one.out.dashboard.todayTasks.length, 1, 'today total is correct');
assert.strictEqual(one.out.dashboard.lateTasks.length, 1, 'late total is correct');
assert.deepStrictEqual(one.out.calendarTasks.map(t=>t['מזהה משימה']).sort(), ['T1','T2'], 'calendarTasks contains selected-domain authorized dated tasks');
assert.strictEqual(one.out.loadedModules.dashboard, true, 'dashboard marked loaded with real computed data');
assert.strictEqual(one.writes[0], 'A', 'single domain auto-selects');
const two = runScenario({settings, projects:[{'מזהה פרויקט':'P1','תחום שיוך':'A'}, {'מזהה פרויקט':'P2','תחום שיוך':'B'}], links:[{'מזהה פרויקט':'P1','מזהה איש קשר':'C1','מורשה צפייה בפורטל':'כן'}, {'מזהה פרויקט':'P2','מזהה איש קשר':'C1','מורשה צפייה בפורטל':'כן'}], tasks:[]});
assert(two.out.auth.domainSelectionRequired, 'two-domain customer receives gate before dashboard data');
assert(!two.out.loadedModules, 'gate is not marked as loaded dashboard');
const selectedA = runScenario({settings, sessionDomain:'A', projects:[{'מזהה פרויקט':'P1','תחום שיוך':'A'}, {'מזהה פרויקט':'P2','תחום שיוך':'B'}], links:[{'מזהה פרויקט':'P1','מזהה איש קשר':'C1','מורשה צפייה בפורטל':'כן'}, {'מזהה פרויקט':'P2','מזהה איש קשר':'C1','מורשה צפייה בפורטל':'כן'}], tasks:[{'מזהה משימה':'TA','מזהה פרויקט':'P1','תאריך':todayIso,'סטטוס':'פתוח'}, {'מזהה משימה':'TB','מזהה פרויקט':'P2','תאריך':todayIso,'סטטוס':'פתוח'}]});
assert.deepStrictEqual(selectedA.out.calendarTasks.map(t=>t['מזהה משימה']), ['TA'], 'selected domain A excludes domain B tasks');

assert(/if\(!token\)\{\s*window\.__BH_CORE_LOADING__ = false;\s*window\.__BH_CORE_LOAD_WAITERS__ = \[\];/.test(html), 'missing token clears load waiters');
assert(/if\(!d \|\| !d\.auth \|\| d\.auth\.allowed !== true\)\{\s*window\.__BH_CORE_LOAD_WAITERS__ = \[\];/.test(html), 'unauthorized result clears load waiters');
assert(/BH_isCustomerDomainSelectionRequired[\s\S]*window\.__BH_CORE_LOAD_WAITERS__ = \[\]/.test(html), 'domain selection clears load waiters');
assert(/function loadModule_Build13_2\(module, after\)/.test(html), 'module waiters have explicit callback argument');
assert(/withFailureHandler\(e=>\{\s*__BH_LOADING_MODULE__\[module\] = false;\s*hideModuleLoading_Build13_4\(module\);\s*window\.__BH_MODULE_WAITERS__\[module\] = \[\];/.test(html), 'module failure unlocks retry and clears waiters');
console.log('customer shell minimal assertions passed');
