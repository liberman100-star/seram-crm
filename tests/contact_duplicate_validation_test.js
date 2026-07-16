const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const gs = fs.readFileSync('V2.GS.txt', 'utf8');
const start = gs.indexOf('function BH_CONTACT_normalizeEmailForCompare_');
const end = gs.indexOf('function שמירת_איש_קשר(data)');
assert(start > -1 && end > start, 'contact duplicate helper block exists');

let sandboxRows = [];
const sandbox = {
  SHEETS: { CONTACTS: 'contacts' },
  readSheet_(sheet){ assert.strictEqual(sheet, 'contacts'); return sandboxRows; },
  פעולות_מותרות_Build11_2_(user){ return { canSeeArchive: user && user.archive === true }; },
  משתמש_רשאי_לאיש_קשר_Build11_2_(user, id){ return !!(user && user.visibleIds && user.visibleIds.includes(id)); }
};
vm.createContext(sandbox);
vm.runInContext(gs.slice(start, end), sandbox);

assert.strictEqual(sandbox.BH_CONTACT_normalizePhoneForCompare_('+97250-123-4567'), '0501234567', '+972 mobile normalizes to local mobile');
assert.strictEqual(sandbox.BH_CONTACT_normalizePhoneForCompare_('+972 (2) 123-4567'), '021234567', '+972 landline normalizes to local landline');
assert.strictEqual(sandbox.BH_CONTACT_normalizePhoneForCompare_('050-123.4567'), '0501234567', 'punctuation removed for comparison');
assert.strictEqual(sandbox.BH_CONTACT_normalizeEmailForCompare_('  USER@Example.COM '), 'user@example.com', 'email normalizes trim and case');
assert.strictEqual(sandbox.BH_CONTACT_isValidIsraeliPhone_(''), true, 'empty phone allowed');
assert.strictEqual(sandbox.BH_CONTACT_isValidIsraeliPhone_('+972 50-123-4567'), true, 'valid +972 mobile accepted');
assert.strictEqual(sandbox.BH_CONTACT_isValidIsraeliPhone_('(03) 123-4567'), true, 'valid Israeli landline accepted');
assert.strictEqual(sandbox.BH_CONTACT_isValidIsraeliPhone_('12345'), false, 'short random number rejected');
assert.strictEqual(sandbox.BH_CONTACT_isValidIsraeliPhone_('050abcdef'), false, 'text rejected');

sandboxRows = [
  {'מזהה איש קשר':'C1','טלפון':'050-123-4567','אימייל':'First@Example.com','בארכיון':'לא'},
  {'מזהה איש קשר':'C2','טלפון':'+972 2 123 4567','אימייל':'arch@example.com','בארכיון':'כן'}
];
assert.doesNotThrow(() => sandbox.BH_CONTACT_checkDuplicate_({phone:'0501234567', email:'FIRST@example.com'}, 'C1', {visibleIds:['C1']}), 'editing same contact is allowed');
assert.throws(() => sandbox.BH_CONTACT_checkDuplicate_({phone:'+972501234567', email:''}, '', {visibleIds:['C1']}), /כבר קיים איש קשר עם מספר הטלפון הזה/, '+972 vs 05 active duplicate rejected');
assert.throws(() => sandbox.BH_CONTACT_checkDuplicate_({phone:'', email:'first@example.COM'}, 'C2', {visibleIds:['C1']}), /כבר קיים איש קשר עם כתובת האימייל הזו/, 'case-insensitive email duplicate rejected');
assert.throws(() => sandbox.BH_CONTACT_checkDuplicate_({phone:'02-123-4567', email:''}, '', {archive:false}), /יש לפנות למנהל מערכת/, 'archive duplicate hides details without archive access');
assert.throws(() => sandbox.BH_CONTACT_checkDuplicate_({phone:'', email:'arch@example.com'}, '', {archive:true}), /פתח בארכיון|לפתוח בארכיון|שחזר איש קשר/, 'archive user receives archive actions');

console.log('contact duplicate validation assertions passed');
