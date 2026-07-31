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
const helper = gs.slice(gs.indexOf('function BH13_4_isArchivedValue_'), gs.indexOf('var BH13_4_originalModule_'));
const sandbox = { console, BH_AD_projectDomain_(p){ return String((p && p['תחום שיוך']) || '').trim(); } };
vm.createContext(sandbox);
vm.runInContext([fn('BH13_4_isArchivedValue_'), helper].join('\n'), sandbox);
const data = {
  projects:[
    {'מזהה פרויקט':'ACTIVE','בארכיון':'לא'},
    {'מזהה פרויקט':'ARCH','בארכיון':'כן'}
  ],
  tasks:[
    {'מזהה משימה':'OLD_YES','מזהה פרויקט':'ACTIVE','בארכיון':'כן'},
    {'מזהה משימה':'OLD_SPACES','מזהה פרויקט':'ACTIVE','בארכיון':'  כן  '},
    {'מזהה משימה':'OLD_BOOL','מזהה פרויקט':'ACTIVE','בארכיון':true},
    {'מזהה משימה':'ARCH_PROJECT','מזהה פרויקט':'ARCH','בארכיון':'כן'},
    {'מזהה משימה':'ACTIVE_TASK','מזהה פרויקט':'ACTIVE','בארכיון':'לא'},
    {'מזהה משימה':'BLANK_TASK','מזהה פרויקט':'ACTIVE','בארכיון':''}
  ],
  contacts:[],
  links:[]
};
const archive = sandbox.BH13_4_archivePayloadFromCanonical_({auth:{allowed:true}}, data, {role:'מנהל ראשי'});
assert.strictEqual(archive.loadedModules.archive, true, 'archive module is explicitly marked loaded');
assert.deepStrictEqual(archive.tasks.map(t => t['מזהה משימה']).sort(), ['ARCH_PROJECT','OLD_BOOL','OLD_SPACES','OLD_YES'], 'archive payload includes historical task rows directly from tasks sheet and excludes active rows');
assert.strictEqual(data.tasks.find(t => t['מזהה משימה'] === 'OLD_SPACES')['בארכיון'], '  כן  ', 'normalization does not mutate source rows');
console.log('task archive history assertions passed');
