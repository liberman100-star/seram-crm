const fs = require('fs');
const assert = require('assert');
const gs = fs.readFileSync('V2.GS.txt', 'utf8');

const functionNames = new Set([...gs.matchAll(/function\s+([\u0590-\u05FF_A-Za-z][\u0590-\u05FF\w]*)\s*\(/g)].map(m => m[1]));
const obsolete = 'שמירת_שדה_מערכת_Build6_1';
if (!functionNames.has(obsolete)) {
  assert(!new RegExp(`\\b${obsolete}\\s*\\(`, 'u').test(gs), `${obsolete} is referenced but no longer defined`);
}
assert(gs.includes('BH_SAFE_הבטחת_הגדרת_שדה_מערכת_אם_חסרה_'), 'safe append-only system-field helper exists');

assert(/throw new Error\("המתקין הבטוח נכשל בשלב/.test(gs), 'safe installer reports failed step by throwing a clear final error');
assert(/return \{ ok:true, steps:results \};/.test(gs), 'safe installer returns success report only after all steps complete');

const depsBlock = gs.match(/function BH_SAFE_תלויות_מתקין_בטוח_\(\)\{[\s\S]*?return \[([\s\S]*?)\];[\s\S]*?\}/);
assert(depsBlock, 'safe installer dependency list exists');
const deps = [...depsBlock[1].matchAll(/"([^"]+)"/g)].map(m => m[1]);
const missingDeps = deps.filter(name => !functionNames.has(name));
assert.deepStrictEqual(missingDeps, [], 'safe installer dependency list contains undefined helpers');

const installer = gs.slice(gs.indexOf('function התקנת_עדכוני_מערכת_בטוחה()'), gs.indexOf('/***********************\n * BH21'));
assert(installer, 'safe installer function exists');
assert(!/try\s*\{[\s\S]*?Logger\.log/.test(installer), 'safe installer must not swallow step failures with try/log wrappers');
const requiredDirectCalls = [
  'BH_SAFE_וידוא_תלויות_מתקין_בטוח_',
  'BH_SAFE_הרצת_שלב_מתקין_',
  'הוספת_אפשרות_בחירה_בטוח_Build11_',
  'התקנת_תחום_שיוך_BuildAD',
  'התקנת_Build14_יוצר_אירוע_ויומן',
  'התקנת_הרשאות_יומן_Build15',
  'התקנת_מיתוג_תחומי_שיוך_BuildADBranding',
  'BH_CAD_installSessionColumn_',
  'BH19_התקנת_גווני_יוצר'
];
for (const name of requiredDirectCalls) assert(deps.includes(name), `dependency list includes ${name}`);

const helper = gs.match(/function BH_SAFE_הבטחת_הגדרת_שדה_מערכת_אם_חסרה_\(data\)\{[\s\S]*?\n\}/);
assert(helper, 'append-only system-field helper exists');
assert(/const exists = rows\.some/.test(helper[0]), 'helper checks existing entity+field rows before append');
assert(/if \(exists\) return \{ appended:false/.test(helper[0]), 'helper leaves existing system-field row unchanged');
assert(/\.appendRow\(row\)/.test(helper[0]), 'helper appends missing system-field row');
assert(!/upsert_\(/.test(helper[0]), 'helper does not overwrite configured values with upsert');
assert(!/clear(?:Content)?\s*\(/.test(helper[0]), 'helper does not clear field settings');

assert(!/\.clear\s*\(|\.clearContent\s*\(|deleteSheet\s*\(|deleteRow\s*\(/.test(installer), 'safe installer contains no clear/delete operations');

console.log('safe installer static assertions passed');
