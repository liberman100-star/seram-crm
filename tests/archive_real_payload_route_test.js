const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const gs = fs.readFileSync('V2.GS.txt','utf8');

const start = gs.indexOf('function BH13_4_isArchivedValue_');
const end = gs.indexOf('function BH13_4_measureEndpointAggregate_', start);
assert(start >= 0 && end > start, 'archive module wrapper block exists');
const code = gs.slice(start, end);

const sheets = {
  'פרויקטים': [
    {'מזהה פרויקט':'ACTIVE_P','תחום שיוך':'A','בארכיון':'לא'},
    {'מזהה פרויקט':'ARCH_P','תחום שיוך':'A','בארכיון':'כן'}
  ],
  'אנשי קשר': [],
  'שיוכים': [],
  'משימות': [
    {'מזהה משימה':'ARCH_TRUE_TEXT','מזהה פרויקט':'ACTIVE_P','כותרת':'archived from real route','בארכיון':'TRUE'},
    {'מזהה משימה':'ARCH_ONE_TEXT','מזהה פרויקט':'ACTIVE_P','כותרת':'archived numeric flag','בארכיון':' 1 '},
    {'מזהה משימה':'ARCH_BOOL','מזהה פרויקט':'ACTIVE_P','כותרת':'archived boolean flag','בארכיון':true},
    {'מזהה משימה':'ACTIVE_TASK','מזהה פרויקט':'ACTIVE_P','כותרת':'active','בארכיון':'לא'}
  ]
};

const sandbox = {
  console,
  SHEETS: {PROJECTS:'פרויקטים', CONTACTS:'אנשי קשר', LINKS:'שיוכים', TASKS:'משימות'},
  BH_CAD_SESSION_FIELD:'תחום שיוך פעיל',
  קבלת_מודול_Build13_2(token, moduleName){
    return {auth:{allowed:true}, currentUser:{role:'מנהל ראשי'}, module: String(moduleName || '')};
  },
  BH_withRequestRows_(label, fn){ return fn(); },
  BH_perfStart_(){ return 0; },
  BH_perfEnd_(){},
  קבלת_משתמש_מסשן_Build7_(){ return {allowed:true, role:'מנהל ראשי'}; },
  קבלת_נתונים_Build7(){
    return {
      auth:{allowed:true},
      currentUser:{role:'מנהל ראשי'},
      projects: sheets['פרויקטים'].map(r => Object.assign({}, r)),
      contacts: sheets['אנשי קשר'].map(r => Object.assign({}, r)),
      links: sheets['שיוכים'].map(r => Object.assign({}, r)),
      tasks: sheets['משימות'].map(r => Object.assign({}, r))
    };
  },
  BH13_4_applyCustomerDomainIfNeeded_(payload){ return payload; },
  BH_AD_projectDomain_(p){ return String((p && p['תחום שיוך']) || '').trim(); }
};

vm.createContext(sandbox);
vm.runInContext(code, sandbox);

const payload = sandbox.קבלת_מודול_Build13_2('token', 'archive');
assert.strictEqual(payload.loadedModules.archive, true, 'real archive module route marks archive as loaded');
assert.deepStrictEqual(
  payload.tasks.map(t => t['מזהה משימה']).sort(),
  ['ARCH_BOOL','ARCH_ONE_TEXT','ARCH_TRUE_TEXT'],
  'real archive module route reads archived tasks from the canonical tasks sheet and keeps TRUE/1/boolean archive flags'
);
assert.strictEqual(payload.archiveTasks, undefined, 'archive payload uses payload.tasks, not payload.archiveTasks');
assert.strictEqual(payload.archive, undefined, 'archive payload is not nested under payload.archive on the server');
console.log('archive real payload route assertions passed');
