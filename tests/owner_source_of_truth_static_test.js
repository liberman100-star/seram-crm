const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const ownerSource = fs.readFileSync(path.join(root, 'OwnerSourceOfTruth.GS.txt'), 'utf8');
const v2 = fs.readFileSync(path.join(root, 'V2.GS.txt'), 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(ownerSource.includes('function BH_OWNER_email_()'), 'Missing canonical owner email helper');
assert(ownerSource.includes('getSettingValue_("מערכת", "מייל בעל מערכת")'), 'Owner email must use the existing settings mechanism');
assert(ownerSource.includes('BUILD7_OWNER_EMAIL'), 'Legacy owner email fallback must remain for backward compatibility');
assert(ownerSource.includes('function BH_OWNER_name_()'), 'Missing canonical owner name helper');
assert(ownerSource.includes('"אברהם"'), 'Current owner name fallback must remain Abraham');
assert(ownerSource.includes('function BH_OWNER_authorizedUser_(email)'), 'Missing canonical owner authorization resolver');
assert(ownerSource.includes('isOwner: true'), 'Canonical owner resolver must mark only the resolved owner as owner');
assert(v2.includes('const BUILD7_OWNER_EMAIL = "smrtcrm4u@gmail.com";'), 'Unexpected legacy owner-email change before integration');

console.log('owner_source_of_truth_static_test: OK');
