const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const gs = fs.readFileSync('V2.GS.txt', 'utf8');
const attach = gs.match(/function BH_DB_attachCoreBranding_\(data\)\{[\s\S]*?\n\}/);
assert(attach, 'core branding attachment exists');

const measured = [];
const defaultBranding = { name: 'Default', source: 'default' };
const rootBranding = { name: 'Domain', source: 'assignmentDomain' };
const adminPayload = { rows: [], domains: [] };
const context = {
  __BH_REQUEST_PERF__: { timings: {} },
  BH_perfStart_: () => 0,
  BH_perfEnd_: label => measured.push(label),
  BH_perfMeasure_: (label, fn) => { measured.push(label); return fn(); },
  BH_DB_defaultBranding_: () => defaultBranding,
  BH_DB_rootBranding_: () => rootBranding,
  BH_DB_adminPayload_: () => adminPayload
};
vm.runInNewContext(`${attach[0]}; result = BH_DB_attachCoreBranding_({auth:{allowed:true}, currentUser:{role:'מנהל ראשי'}, projects:[]});`, context);

assert.strictEqual(context.result.defaultBranding, defaultBranding, 'default branding result is unchanged');
assert.strictEqual(context.result.rootBranding, rootBranding, 'root branding result is unchanged');
assert.strictEqual(context.result.system, rootBranding, 'effective system branding is unchanged');
assert.strictEqual(context.result.domainBrandingAdmin, adminPayload, 'admin branding payload is unchanged');
['core.branding.default', 'core.branding.root', 'core.branding.admin', 'core.branding'].forEach(label =>
  assert(measured.includes(label), `${label} is measured`));

[
  'core.branding.default.sheetRead',
  'core.branding.root.default',
  'core.branding.root.contactsSheetRead',
  'core.branding.root.assignmentDomain',
  'core.branding.assignmentDomain.install',
  'core.branding.assignmentDomain.sheetRead',
  'core.branding.assignmentDomain.domainMapProcessing',
  'core.branding.admin.domainMap',
  'core.branding.admin.activeDomains',
  'core.branding.admin.sheetRead'
].forEach(label => assert(gs.includes(`"${label}"`), `${label} diagnostic exists`));

console.log('branding performance diagnostics assertions passed');
