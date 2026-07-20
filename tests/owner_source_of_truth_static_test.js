const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const v2 = fs.readFileSync(path.join(root, 'V2.GS.txt'), 'utf8');
const legacyEmail = 'smrtcrm4u' + '@' + 'gmail.com';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(v2.includes('function BUILD7_getOwnerEmail_()'), 'Missing canonical owner email helper');
assert(v2.includes('getSettingValue_("מערכת", "מייל בעל מערכת")'), 'Owner email must use the existing settings mechanism');
assert(v2.includes('const BUILD7_DEFAULT_OWNER_EMAIL = "' + legacyEmail + '";'), 'Legacy owner email fallback must remain canonical and isolated');
assert(!v2.includes('BUILD7_' + 'OWNER_EMAIL ='), 'Legacy owner email const must be removed');
assert(v2.includes('function BUILD7_isOwnerEmail_(email)'), 'Missing canonical owner email comparison helper');
assert(v2.includes('function BUILD7_getOwnerName_()'), 'Missing canonical owner name helper');
assert(v2.includes('contact["שם מלא"]'), 'Owner name should be resolved from the matching contact when possible');
assert(v2.includes('getSettingValue_("מערכת", "שם בעל מערכת") || "אברהם"'), 'Current owner name fallback must remain Abraham');
assert(/if \(BUILD7_isOwnerEmail_\(email\)\)[\s\S]*?role: "מנהל ראשי"[\s\S]*?isOwner: true/.test(v2), 'Only canonical owner resolver may mark owner login as owner');
assert(!v2.includes('if (email === BUILD7_' + 'OWNER_EMAIL'), 'Owner comparisons must not use the legacy hard-coded const');
assert(v2.includes('BUILD7_ensureOwnerEmailSetting_();'), 'Build 7 installer should upsert the default owner setting without a manual install step');

console.log('owner_source_of_truth_static_test: OK');
