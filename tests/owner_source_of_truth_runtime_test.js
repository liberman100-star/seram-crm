const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, '..', 'V2.GS.txt'), 'utf8');

assert.strictEqual((source.match(/smrtcrm4u@gmail\.com/g) || []).length, 1, 'legacy email appears only once as fallback');
assert(!source.includes('email === BUILD7_' + 'OWNER_EMAIL'), 'legacy direct owner comparison removed');
assert(/function BUILD7_getOwnerEmail_\(\)[\s\S]*?getSettingValue_\("מערכת", "מייל בעל מערכת"\)[\s\S]*?BUILD7_DEFAULT_OWNER_EMAIL/.test(source), 'owner email reads settings before fallback');
assert(/function BUILD7_isOwnerEmail_\(email\)[\s\S]*?נרמול_מייל_Build7_\(email\)[\s\S]*?BUILD7_getOwnerEmail_\(\)/.test(source), 'owner comparison normalizes and uses canonical email');
assert(/function BUILD7_getOwnerName_\(\)[\s\S]*?readSheet_\(SHEETS\.CONTACTS\)[\s\S]*?getSettingValue_\("מערכת", "שם בעל מערכת"\)[\s\S]*?"אברהם"/.test(source), 'owner name resolves contact, setting, then Abraham fallback');

console.log('owner_source_of_truth_runtime_test: OK');
