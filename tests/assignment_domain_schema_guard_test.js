const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const gs = fs.readFileSync('V2.GS.txt', 'utf8');
const source = gs.match(/function BH_AD_assignmentDomainSchemaReady_\(\)\{[\s\S]*?\n\}/);
assert(source, 'assignment-domain schema check exists');
const ensureSource = gs.match(/function BH_AD_ensureAssignmentDomainSchema_\(\)\{[\s\S]*?\n\}/);
assert(ensureSource, 'assignment-domain schema guard exists');

function range(values) {
  return { getValues: () => values };
}
function sheet(rows) {
  return {
    getLastRow: () => rows.length,
    getLastColumn: () => rows[0].length,
    getRange: () => range([rows[0]]),
    getDataRange: () => range(rows)
  };
}
function installedSheets() {
  return {
    projects: sheet([['id', 'תחום שיוך']]),
    contacts: sheet([['id', 'תחומי שיוך', 'תחום שיוך מרכזי']]),
    links: sheet([['id', 'יוצר']]),
    notes: sheet([['id', 'יוצר']]),
    'הגדרות_ערכים': sheet([['סוג ערך', 'ערך'], ['תחום שיוך', 'ללא שיוך']]),
    'הגדרות_שדות': sheet([['ישות', 'שם שדה'], ['פרויקט', 'תחום שיוך']])
  };
}
function check(sheets) {
  const context = {
    SHEETS: { PROJECTS: 'projects', CONTACTS: 'contacts', LINKS: 'links', TASK_NOTES: 'notes' },
    BH_AD_CATEGORY: 'תחום שיוך',
    BH_AD_CENTRAL: 'תחום שיוך מרכזי',
    BH_AD_DEFAULT: 'ללא שיוך',
    getSS_: () => ({ getSheetByName: name => sheets[name] || null })
  };
  vm.runInNewContext(`${source[0]}; result = BH_AD_assignmentDomainSchemaReady_();`, context);
  return context.result;
}

assert.strictEqual(check(installedSheets()), true, 'installed schema bypasses the full installer');
for (const missing of ['projects', 'contacts', 'links', 'notes', 'הגדרות_ערכים', 'הגדרות_שדות']) {
  const sheets = installedSheets();
  delete sheets[missing];
  assert.strictEqual(check(sheets), false, `missing ${missing} triggers installation`);
}

function ensure(ready) {
  let installs = 0;
  const labels = [];
  const context = {
    BH_AD_assignmentDomainSchemaReady_: () => ready,
    BH_perfMeasure_: (label, fn) => { labels.push(label); return fn(); },
    התקנת_תחום_שיוך_BuildAD: () => { installs++; },
    Logger: { log: () => {} }
  };
  vm.runInNewContext(`${ensureSource[0]}; result = BH_AD_ensureAssignmentDomainSchema_();`, context);
  return { result: context.result, installs, labels };
}
const current = ensure(true);
assert.strictEqual(current.installs, 0, 'an installed system does not run the full installer');
assert(!current.labels.includes('core.assignmentDomainInstallTriggered'), 'install timing is absent when schema is ready');
const legacy = ensure(false);
assert.strictEqual(legacy.installs, 1, 'a legacy system runs the full installer once');
assert(legacy.labels.includes('core.assignmentDomainInstallTriggered'), 'triggered installation is measured');
assert(/function קבלת_נתוני_מערכת_מלאים_Build10_[\s\S]*?BH_AD_ensureAssignmentDomainSchema_\(\)/.test(gs),
  'full core uses the guarded schema installer');

console.log('assignment-domain schema guard assertions passed');
