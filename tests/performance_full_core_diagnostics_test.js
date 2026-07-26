const fs = require('fs');
const assert = require('assert');
const gs = fs.readFileSync('V2.GS.txt', 'utf8');

[
  'core.total',
  'core.auth',
  'core.buildFullData',
  'core.readCoreSheets',
  'core.permissionFiltering',
  'core.calendarEnrichment',
  'core.dashboardCalculation.initial',
  'core.branding',
  'core.payloadBuild',
  'core.serializePayload',
  'core.attachDiagnostics',
  'core.recordCounts',
  'core.payloadBytes.beforeDiagnostics',
  'core.services.spreadsheet.assignmentDomainInstall'
].forEach(label => assert(gs.includes(`'${label}'`) || gs.includes(`"${label}"`), `missing ${label} timing`));

assert(/function BH_perfMeasure_\(label, fn\)[\s\S]*?BH_perfStart_\(label\)[\s\S]*?finally \{ BH_perfEnd_\(label, start\); \}/.test(gs),
  'nested measurements must use the existing request performance mechanism and close on errors');
assert(/core\.payloadBytes\.beforeDiagnostics[\s\S]*?JSON\.stringify\(payload \|\| \{\}\)[\s\S]*?payload\.performanceDiagnostics = diagnostics/.test(gs),
  'payload bytes must be serialized before diagnostics are attached');
assert(/core\.serializePayload[\s\S]*?JSON\.stringify\(payload\)\.length[\s\S]*?payload\.performanceDiagnostics\.timings/.test(gs),
  'final serialization must be timed and copied into browser diagnostics without reattaching diagnostics');
assert(!/Logger\.log\([^\n]*(email|phone|projectName|contactName)/i.test(gs),
  'performance changes must not add personal or business data to logs');

console.log('full-core performance diagnostics assertions passed');
