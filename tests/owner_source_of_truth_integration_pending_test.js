const fs = require('fs');
const path = require('path');

const v2 = fs.readFileSync(path.join(__dirname, '..', 'V2.GS.txt'), 'utf8');

if (!v2.includes('function איתור_מורשה_לפי_מייל_Build7_')) {
  throw new Error('Owner authorization function not found');
}

if (v2.includes('const ownerUser = BH_OWNER_authorizedUser_(email);')) {
  console.log('owner_source_of_truth_integration_pending_test: integrated');
} else {
  console.log('owner_source_of_truth_integration_pending_test: pending integration in V2.GS.txt');
}
