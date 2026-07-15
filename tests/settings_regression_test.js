const fs = require('fs');
const assert = require('assert');
const gs = fs.readFileSync('V2.GS.txt','utf8');
const html = fs.readFileSync('index.html','utf8');
function has(src, re, msg){ assert(re.test(src), msg); }
const wrapper = gs.slice(gs.indexOf('קבלת_מודול_Build13_2 = function'), gs.indexOf('function BH13_4_measureEndpointAggregate_'));
has(wrapper, /module === 'settings'[\s\S]*BH_DB_attachCoreBranding_\(out\)[\s\S]*settings:true[\s\S]*return out;/, 'settings module restores canonical branding/admin payload and returns before customer filtering');
has(gs, /function BH_DB_attachCoreBranding_[\s\S]*domainBrandingAdmin = admin/, 'owner/main-admin core branding attaches domainBrandingAdmin data');
has(gs, /function BH_DB_adminPayload_[\s\S]*rows: readSheet_\(BH_DB_SHEET\)[\s\S]*defaultBranding: BH_DB_defaultBranding_\(\)/, 'domain branding admin payload includes list and default branding');
has(html, /function settingsPayloadLoaded_Build13_4\(\)[\s\S]*__BH_LOADED_MODULES__\.settings[\s\S]*DATA\.domainBrandingAdmin/, 'settings loaded guard requires real settings/admin payload');
has(html, /if\(DATA\.canSeeSettings && settingsPayloadLoaded_Build13_4\(\)\) renderSettings\(\);/, 'initial render does not render settings from shell placeholders');
has(html, /function renderSettings\(\)\{[\s\S]*if\(!settingsPayloadLoaded_Build13_4\(\)\)[\s\S]*loadModule_Build13_2\('settings'\)[\s\S]*טוען הגדרות/, 'renderSettings lazy-loads canonical settings payload instead of using placeholders');
has(html, /if\(module === 'settings' && DATA\.canSeeSettings && settingsPayloadLoaded_Build13_4\(\)\)[\s\S]*renderSettings\(\)/, 'settings module renders only after canonical settings payload is loaded');
has(html, /מיתוגי תחומי שיוך/, 'branding settings UI includes Assignment Domain branding list label');
has(html, /renderUsersSettings|contactsWithPermission|openUserPermissionCard/, 'system users administration remains wired');
has(html, /renderPermissionsSettings|openRolePermissionCard/, 'permissions matrix remains wired');
has(html, /renderCalendarsSettings|הרשאות יומן/, 'calendar permissions/settings remain wired');
has(html, /renderCategoriesSettings|renderSystemFieldsSettings/, 'categories and fields sections remain wired');
console.log('settings regression assertions passed');
