const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const gs = fs.readFileSync('V2.GS.txt', 'utf8');

function extractFunction(name) {
  const start = gs.indexOf(`function ${name}(`);
  assert(start >= 0, `${name} exists`);
  const bodyStart = gs.indexOf('{', start);
  let depth = 0;
  for (let i = bodyStart; i < gs.length; i++) {
    if (gs[i] === '{') depth++;
    if (gs[i] === '}') depth--;
    if (depth === 0) return gs.slice(start, i + 1);
  }
  throw new Error(`failed extracting ${name}`);
}

const fnNames = [
  'BH_SELECTION_OPTION_CATEGORY_',
  'BH_SELECTION_CATEGORY_NAMES_',
  'BH_SELECTION_VALUE_ROWS_',
  'BH_SELECTION_LEGACY_ACTIVE_VALUES_',
  'BH_SELECTION_ACTIVE_VALUES_',
  'BH_SELECTION_VALIDATE_'
];

function makeSandbox(tables) {
  const writes = [];
  const sandbox = {
    SHEETS: { SETTINGS: 'הגדרות' },
    readSheet_(name) { return (tables[name] || []).map(r => ({ ...r })); },
    appendObject_(name, row) { writes.push(['appendObject_', name, row]); },
    upsert_(name, key, id, row) { writes.push(['upsert_', name, key, id, row]); },
    deleteById_(name, key, id) { writes.push(['deleteById_', name, key, id]); },
    deleteWhere_(name, key, value) { writes.push(['deleteWhere_', name, key, value]); },
    writes
  };
  vm.createContext(sandbox);
  vm.runInContext(fnNames.map(extractFunction).join('\n'), sandbox);
  return sandbox;
}

function assertAllows(tables, category, value, label = category, oldValue = '') {
  const sandbox = makeSandbox(tables);
  assert.doesNotThrow(() => sandbox.BH_SELECTION_VALIDATE_(category, value, label, oldValue));
  assert.deepStrictEqual(sandbox.writes, [], 'validation performs no sheet writes/deletes');
}

function assertRejects(tables, category, value, label = category, oldValue = '') {
  const sandbox = makeSandbox(tables);
  assert.throws(
    () => sandbox.BH_SELECTION_VALIDATE_(category, value, label, oldValue),
    err => err.message.includes(label) && err.message.includes(value) && err.message.includes(category)
  );
  assert.deepStrictEqual(sandbox.writes, [], 'validation performs no sheet writes/deletes');
}

assertAllows({
  'הגדרות_ערכים': [{ 'סוג ערך': 'עיר', 'ערך': 'אלעד', 'פעיל': 'כן' }],
  'הגדרות': []
}, 'עיר', 'אלעד');

assertAllows({
  'הגדרות_ערכים': [{ 'סוג ערך': 'תחום', 'ערך': 'מגורים', 'פעיל': 'כן' }],
  'הגדרות': [{ 'סוג הגדרה': 'תחום', 'ערך': 'מסחרי', 'פעיל': 'כן' }]
}, 'תחום', 'מגורים');
assertRejects({
  'הגדרות_ערכים': [{ 'סוג ערך': 'תחום', 'ערך': 'מגורים', 'פעיל': 'כן' }],
  'הגדרות': [{ 'סוג הגדרה': 'תחום', 'ערך': 'מסחרי', 'פעיל': 'כן' }]
}, 'תחום', 'מסחרי');

assertRejects({
  'הגדרות_ערכים': [{ 'סוג ערך': 'מקור הגעה', 'ערך': 'אתר', 'פעיל': 'לא' }],
  'הגדרות': [{ 'סוג הגדרה': 'מקור הגעה', 'ערך': 'אתר', 'פעיל': 'כן' }]
}, 'מקור הגעה', 'אתר');

assertAllows({
  'הגדרות_ערכים': [{ 'סוג ערך': 'עיר', 'ערך': 'אלעד', 'פעיל': 'כן' }],
  'הגדרות': [{ 'סוג הגדרה': 'סוג איש קשר', 'ערך': 'לקוח', 'פעיל': 'כן' }]
}, 'סוג איש קשר', 'לקוח');

assertRejects({
  'הגדרות_ערכים': [{ 'סוג ערך': 'סטטוס פרויקט', 'ערך': 'בוטל', 'פעיל': 'לא' }],
  'הגדרות': []
}, 'סטטוס פרויקט', 'בוטל', 'סטטוס');

assertAllows({
  'הגדרות_ערכים': [{ 'סוג ערך': 'סטטוס משימה', 'ערך': 'בוטל', 'פעיל': 'לא' }],
  'הגדרות': []
}, 'סטטוס משימה', 'בוטל', 'סטטוס', 'בוטל');

[
  ['עיר', /BH_SELECTION_VALIDATE_\("עיר"/],
  ['תחום', /BH_SELECTION_VALIDATE_\("תחום"/],
  ['מקור הגעה', /BH_SELECTION_VALIDATE_\("מקור הגעה"/],
  ['סוג איש קשר', /BH_SELECTION_VALIDATE_\("סוג איש קשר"/],
  ['סטטוס פרויקט', /BH_SELECTION_VALIDATE_\("סטטוס פרויקט"/],
  ['סטטוס משימה', /BH_SELECTION_VALIDATE_\("סטטוס משימה"/],
  ['עדיפות', /BH_SELECTION_VALIDATE_\("עדיפות"/],
  ['תחום שיוך', /BH_SELECTION_VALIDATE_\(BH_AD_CATEGORY/]
].forEach(([field, re]) => assert(re.test(gs), `${field} uses BH_SELECTION_VALIDATE_`));

const activeBlock = extractFunction('BH_SELECTION_ACTIVE_VALUES_');
assert(!/appendObject_|upsert_|deleteById_|deleteWhere_|clear|setValue|setValues/.test(activeBlock), 'active value lookup does not write/delete sheets');

console.log('selection validation assertions passed');
