const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const gs = fs.readFileSync('V2.GS.txt', 'utf8');
const section = gs.slice(
  gs.indexOf('const BH_DB_SHEET ='),
  gs.indexOf('function BH_DB_findContact_')
);
assert(section.includes('function BH_DB_brandingSchemaReady_()'), 'cheap branding schema check exists');
assert(section.includes('function BH_DB_ensureBrandingSchema_()'), 'guarded branding installer exists');

const headers = ['מזהה מיתוג','תחום שיוך','שם מערכת','לוגו','צבע ראשי','צבע משני','גובה לוגו','פעיל','עודכן בתאריך','עודכן על ידי'];
const brandingRows = [{
  'מזהה מיתוג': 'brand-1', 'תחום שיוך': 'צפון', 'שם מערכת': 'North',
  'לוגו': 'north.png', 'צבע ראשי': '#111111', 'צבע משני': '#eeeeee',
  'גובה לוגו': '52', 'פעיל': 'כן'
}];

function run(initialHeaders) {
  let sheetHeaders = initialHeaders && initialHeaders.slice();
  let installs = 0;
  let headerReads = 0;
  const labels = [];
  const context = {
    __BH_REQUEST_ROWS__: {},
    BH_AD_DEFAULT: 'ללא שיוך',
    getSS_: () => ({
      getSheetByName: () => sheetHeaders ? {
        getLastColumn: () => sheetHeaders.length,
        getRange: () => ({ getValues: () => { headerReads++; return [sheetHeaders]; } })
      } : null
    }),
    יצירת_גיליון_אם_חסר_: () => { sheetHeaders = headers.slice(); },
    הבטח_עמודה_אם_חסרה_: (name, header) => {
      if (!sheetHeaders.includes(header)) sheetHeaders.push(header);
    },
    BH_perfMeasure_: (label, fn) => { labels.push(label); return fn(); },
    readSheet_: () => brandingRows,
    BH_DB_activeDomains_: () => ['צפון']
  };
  const sandbox = { ...context, installsHook: () => { installs++; } };
  vm.runInNewContext(`${section}
    const originalInstall = התקנת_מיתוג_תחומי_שיוך_BuildADBranding;
    התקנת_מיתוג_תחומי_שיוך_BuildADBranding = function(){ installsHook(); return originalInstall(); };
    firstMap = BH_DB_domainMap_();
    admin = BH_DB_adminPayload_();`, sandbox);
  return { context: sandbox, installs, headerReads, labels };
}

for (const initial of [headers, null]) {
  const result = run(initial);
  assert.strictEqual(result.installs, initial ? 0 : 1,
    initial ? 'installed system bypasses installer' : 'missing system invokes installer once');
  assert.strictEqual(result.headerReads, initial ? 1 : 0, 'schema is checked at most once per request');
  assert.deepStrictEqual(JSON.parse(JSON.stringify(result.context.firstMap.צפון)), {
    id: 'brand-1', name: 'North', logo: 'north.png', primaryColor: '#111111',
    secondaryColor: '#eeeeee', logoHeight: '52', logoPosition: 'ימין',
    assignmentDomain: 'צפון', source: 'assignmentDomain'
  }, 'domain map result is unchanged');
  assert.deepStrictEqual(JSON.parse(JSON.stringify(result.context.admin.effectiveByDomain.צפון)),
    JSON.parse(JSON.stringify(result.context.firstMap.צפון)), 'admin payload uses the unchanged map');
  assert(result.labels.includes('core.branding.assignmentDomain.sheetRead'), 'sheet read is measured');
  assert(result.labels.includes('core.branding.assignmentDomain.domainMapProcessing'), 'map processing is measured');
  assert.strictEqual(result.labels.filter(label => label === 'core.branding.assignmentDomain.install').length,
    initial ? 0 : 1, 'only a required installation is measured');
}

assert(!/function BH_DB_adminPayload_\(\)\{\s*try \{ התקנת_מיתוג/.test(section),
  'admin payload does not invoke the installer independently');

console.log('branding schema guard assertions passed');
