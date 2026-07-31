const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const gs = fs.readFileSync('V2.GS.txt','utf8');

const start = gs.indexOf('function BH14_העשרת_נתוני_יומן_');
const end = gs.indexOf('function התקנת_הרשאות_יומן_Build15', start);
assert(start >= 0 && end > start, 'calendar enrichment permission helper block exists');
const code = gs.slice(start, end);

const sandbox = {
  SHEETS: {PROJECTS:'פרויקטים', LINKS:'שיוכים'},
  readSheet_(name){
    if(name === 'פרויקטים') return [{ 'מזהה פרויקט':'P1', 'בארכיון':'' }];
    if(name === 'שיוכים') return [];
    return [];
  },
  BH15_ערך_שווה_(a,b){ return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase(); },
  BH_AD_userHasProjectDomain_(){ return false; }
};
vm.createContext(sandbox);
vm.runInContext(code, sandbox);

const data = {
  tasks: [
    {'מזהה משימה':'ARCHIVED_TASK','מזהה פרויקט':'P1','בארכיון':'כן'},
    {'מזהה משימה':'ACTIVE_TASK','מזהה פרויקט':'P1','בארכיון':''}
  ]
};
const out = sandbox.BH14_העשרת_נתוני_יומן_(data, {role:'מנהל ראשי', isOwner:true, name:'Owner'});

assert.deepStrictEqual(
  out.tasks.map(t => t['מזהה משימה']).sort(),
  ['ACTIVE_TASK','ARCHIVED_TASK'],
  'super admin canonical task permissions preserve archived tasks for archive payload construction'
);
assert.deepStrictEqual(
  out.calendarTasks.map(t => t['מזהה משימה']),
  ['ACTIVE_TASK'],
  'calendar tasks still exclude archived tasks'
);
console.log('archive superadmin canonical permission assertions passed');
