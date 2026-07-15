const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const gs = fs.readFileSync('V2.GS.txt','utf8');
function fn(name){
  const idx = gs.indexOf('function '+name);
  assert(idx >= 0, name+' exists');
  const next = gs.indexOf('\nfunction ', idx + 10);
  return gs.slice(idx, next < 0 ? gs.length : next);
}
const wrapper = gs.slice(gs.indexOf('קבלת_מודול_Build13_2 = function'), gs.indexOf('function BH13_4_measureEndpointAggregate_'));
assert(/BH13_4_archivePayloadFromCanonical_[\s\S]*BH13_4_applyCustomerDomainIfNeeded_/.test(wrapper), 'archive payload is built before final customer-domain narrowing');
assert(!/out = BH13_4_applyCustomerDomainIfNeeded_[\s\S]*if\(module === 'archive'/.test(wrapper), 'selected-domain result is not overwritten after filtering');
const helper = gs.slice(gs.indexOf('function BH13_4_archivePayloadFromCanonical_'), gs.indexOf('var BH13_4_originalModule_'));
assert(/links: isCustomer \? archiveLinks : \[\]/.test(helper), 'customer archive keeps canonical archive links for visibility derivation');
assert(/relatedContactIds/.test(helper), 'customer archive derives contact visibility from archive links');

const code = [
  fn('BH_CAD_projectIdFromRow_'),
  fn('BH_CAD_taskIdFromRow_'),
  fn('BH_CAD_contactIdFromRow_'),
  fn('BH_CAD_assertNotBroadened_'),
  fn('BH_CAD_filterProjectRelatedCollections_'),
  fn('BH_CAD_applySelectedDomainFilter_'),
  helper
].join('\n');
const sandbox = {
  console,
  BH_AD_projectDomain_(p){ return String((p && p['תחום שיוך']) || '').trim(); },
  BH_CAD_SESSION_FIELD:'תחום שיוך פעיל',
  calcDashboard_(p,c,t){ return {projectsCount:p.length, contactsCount:c.length, tasksCount:t.length}; },
  BH_DB_brandingForDomain_(){ return null; },
  BH_DB_defaultBranding_(){ return {}; }
};
vm.createContext(sandbox);
vm.runInContext(code, sandbox);
const data = {
  projects:[
    {'מזהה פרויקט':'PA','תחום שיוך':'A','בארכיון':'כן'},
    {'מזהה פרויקט':'PB','תחום שיוך':'B','בארכיון':'כן'},
    {'מזהה פרויקט':'PX','תחום שיוך':'A','בארכיון':''}
  ],
  tasks:[
    {'מזהה משימה':'TA','מזהה פרויקט':'PA','בארכיון':'כן'},
    {'מזהה משימה':'TB','מזהה פרויקט':'PB','בארכיון':'כן'},
    {'מזהה משימה':'TX','מזהה פרויקט':'PX','בארכיון':'כן'}
  ],
  contacts:[
    {'מזהה איש קשר':'C1','בארכיון':'כן'},
    {'מזהה איש קשר':'CA','בארכיון':'כן'},
    {'מזהה איש קשר':'CB','בארכיון':'כן'},
    {'מזהה איש קשר':'CU','בארכיון':'כן'}
  ],
  links:[
    {'מזהה פרויקט':'PA','מזהה איש קשר':'CA'},
    {'מזהה פרויקט':'PA','מזהה איש קשר':'C1'},
    {'מזהה פרויקט':'PB','מזהה איש קשר':'CB'},
    {'מזהה פרויקט':'PX','מזהה איש קשר':'CU'}
  ]
};
const user = {role:'לקוח', contactId:'C1'};
const archive = sandbox.BH13_4_archivePayloadFromCanonical_({auth:{allowed:true}}, data, user);
const filtered = sandbox.BH_CAD_applySelectedDomainFilter_(archive, user, 'A');
assert.deepStrictEqual(filtered.projects.map(p=>p['מזהה פרויקט']), ['PA'], 'customer selected domain A cannot see archived project from domain B');
assert.deepStrictEqual(filtered.tasks.map(t=>t['מזהה משימה']), ['TA'], 'archived task from domain B is excluded');
assert(!filtered.contacts.some(c=>c['מזהה איש קשר']==='CB' || c['מזהה איש קשר']==='CU'), 'unrelated archived contacts are excluded');
assert(filtered.contacts.some(c=>c['מזהה איש קשר']==='C1'), 'customer own archived contact is preserved when canonically present');
assert(filtered.links.every(l=>l['מזהה פרויקט']==='PA'), 'archive payload contains no unauthorized links');
const managerArchive = sandbox.BH13_4_archivePayloadFromCanonical_({auth:{allowed:true}}, data, {role:'מנהל'});
assert.deepStrictEqual(managerArchive.projects.map(p=>p['מזהה פרויקט']).sort(), ['PA','PB'], 'manager/admin archive behavior is unchanged before customer narrowing');
assert.strictEqual(JSON.stringify(managerArchive.links), '[]', 'non-customer archive keeps prior empty-links behavior');
console.log('customer archive assertions passed');
