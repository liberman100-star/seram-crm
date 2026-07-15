const fs = require('fs');
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
assert(!/SHEETS\.TASKS|SHEETS\.CONTACTS|TASK_NOTES|הרשאות|מיתוג תחומי שיוך/.test(minimal), 'minimal discovery does not read broad datasets');
assert(/BH_CAD_isActivePortalLink_/.test(minimal) && /מורשה צפייה בפורטל/.test(gs), 'portal visibility is enforced');
assert(/בארכיון/.test(minimal), 'archived projects are excluded');

const apply = gs.slice(gs.indexOf('function BH13_4_applyCustomerDomainIfNeeded_'), gs.indexOf('var BH13_4_originalOpening_'));
assert(!/קבלת_נתוני_מערכת_מלאים_Build10_/.test(apply), 'customer shell/domain filter does not call full CRM loader');
assert(/domains\.length === 1[\s\S]*BH_CAD_setSessionDomain_/.test(apply), 'single-domain customer auto-selection persists session');
assert(/domains\.length > 1 && !selected[\s\S]*BH_CAD_domainRequiredPayload_/.test(apply), 'multi-domain customer gate is preserved');
assert(/domains\.indexOf\(selected\) === -1/.test(apply), 'selected domain is validated');
assert(/payload && payload\.auth && payload\.auth\.allowed === true && \(payload\.projects \|\| payload\.tasks \|\| payload\.links\)/.test(apply), 'full-payload filtering is not blindly applied to shell payloads');

const shell = bodyOf('BH13_4_customerShellPayload_');
['auth','system','rootBranding','defaultBranding','currentUser','canSeeSettings','canSeeDashboard','canSeeArchive','actionPermissions','dashboard','loadedModules'].forEach(k=>assert(shell.includes(k), 'shell preserves '+k));

assert(/if\(!token\)\{\s*window\.__BH_CORE_LOADING__ = false;\s*window\.__BH_CORE_LOAD_WAITERS__ = \[\];/.test(html), 'missing token clears load waiters');
assert(/if\(!d \|\| !d\.auth \|\| d\.auth\.allowed !== true\)\{\s*window\.__BH_CORE_LOAD_WAITERS__ = \[\];/.test(html), 'unauthorized result clears load waiters');
assert(/BH_isCustomerDomainSelectionRequired[\s\S]*window\.__BH_CORE_LOAD_WAITERS__ = \[\]/.test(html), 'domain selection clears load waiters');
assert(/function loadModule_Build13_2\(module, after\)/.test(html), 'module waiters have explicit callback argument');
assert(/if\(!token\)\{\s*__BH_LOADING_MODULE__\[module\] = false;\s*hideModuleLoading_Build13_4\(module\);\s*window\.__BH_MODULE_WAITERS__\[module\] = \[\];/.test(html), 'missing token cleans module state');
assert(/BH_isCustomerDomainSelectionRequired[\s\S]*window\.__BH_MODULE_WAITERS__\[module\] = \[\]/.test(html), 'domain selection clears module waiters');
assert(/withFailureHandler\(e=>\{\s*__BH_LOADING_MODULE__\[module\] = false;\s*hideModuleLoading_Build13_4\(module\);\s*window\.__BH_MODULE_WAITERS__\[module\] = \[\];/.test(html), 'module failure unlocks retry and clears waiters');
assert(/BH13_4_מדידת_ליבה_מול_פתיחה/.test(gs) && /BH_AD_requireSuperAdminToken_/.test(gs), 'super-admin aggregate diagnostic exists');
console.log('customer shell minimal assertions passed');
