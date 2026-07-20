const fs = require('fs');
const vm = require('vm');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, '..', 'OwnerSourceOfTruth.GS.txt'), 'utf8');

function loadContext({ settings = {}, contacts = [] } = {}) {
  const context = {
    BUILD7_OWNER_EMAIL: 'smrtcrm4u@gmail.com',
    SHEETS: { CONTACTS: 'אנשי קשר', SETTINGS: 'הגדרות' },
    Logger: { log() {} },
    נרמול_מייל_Build7_: value => String(value || '').toLowerCase().trim(),
    getSettingValue_: (type, key) => settings[`${type}:${key}`] || '',
    readSheet_: sheet => sheet === 'אנשי קשר' ? contacts : [],
    BH_INV_isValidEmail_: email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    upsertSetting_() {}
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  return context;
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) throw new Error(`${message}: expected ${expected}, got ${actual}`);
}

let ctx = loadContext();
assertEqual(ctx.BH_OWNER_email_(), 'smrtcrm4u@gmail.com', 'legacy fallback');
assertEqual(ctx.BH_OWNER_name_(), 'אברהם', 'current owner-name fallback');

ctx = loadContext({ settings: { 'מערכת:מייל בעל מערכת': 'NewOwner@Example.com', 'מערכת:שם בעל מערכת': 'אברהם' } });
assertEqual(ctx.BH_OWNER_email_(), 'newowner@example.com', 'configured owner email');
assertEqual(ctx.BH_OWNER_authorizedUser_('newowner@example.com').isOwner, true, 'configured owner recognized');
assertEqual(ctx.BH_OWNER_authorizedUser_('smrtcrm4u@gmail.com'), null, 'legacy account no longer owner when explicit setting exists');

ctx = loadContext({
  settings: { 'מערכת:מייל בעל מערכת': 'owner@example.com' },
  contacts: [{ 'אימייל': 'owner@example.com', 'שם מלא': 'אברהם ליברמן' }]
});
assertEqual(ctx.BH_OWNER_name_(), 'אברהם ליברמן', 'contact name takes precedence');

console.log('owner_source_of_truth_runtime_test: OK');
