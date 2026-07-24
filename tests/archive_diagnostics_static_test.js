const assert = require('assert');
const fs = require('fs');

const gs = fs.readFileSync('V2.GS.txt', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');

assert(/function BH_DEBUG_archiveTasksPipeline\(token\)/.test(gs), 'server archive task pipeline diagnostic exists');
assert(/const sheetName = SHEETS\.TASKS;[\s\S]*const rawTasks = readSheet_\(sheetName\);/.test(gs), 'diagnostic reads the canonical tasks sheet');
assert(/rawArchiveValueSamples[\s\S]*type:typeof value/.test(gs), 'diagnostic returns archive value samples with value types');
assert(/archivedByFlagCount:archivedRawTasks\.length/.test(gs), 'diagnostic counts raw archived task flags');
assert(/afterPermissionCount:archivedAfterPermission\.length/.test(gs), 'diagnostic reports archived tasks after the real permission path');
assert(/BH13_4_archivePayloadFromCanonical_\(baseOut, canonical \|\| \{\}, user\)/.test(gs), 'diagnostic uses the real archive payload builder');
assert(/BH13_4_applyCustomerDomainIfNeeded_\(Object\.assign\(\{\}, archivePayload\), token, 'archive'\)/.test(gs), 'diagnostic applies the real archive domain filter');
assert(/payloadTasksCount:payloadTasks\.length/.test(gs), 'diagnostic reports final payload task count');
assert(/possibleArchiveFieldNames:Object\.keys/.test(gs), 'diagnostic reports actual archive-like task field names');

assert(/const ARCHIVE_TASKS_DEBUG = true;/.test(html), 'client archive debug logging is enabled temporarily');
assert(/\[ARCHIVE_TASKS_DEBUG\]/.test(html), 'client archive debug logs use the required prefix');
assert(/archive payload received[\s\S]*payloadTasksLength/.test(html), 'client logs archive payload task length when debug is enabled');
assert(/after archive merge[\s\S]*archiveTasksLength[\s\S]*dataTasksLength/.test(html), 'client logs archive merge counts when debug is enabled');
assert(/archivedRowsFor[\s\S]*rowsLength/.test(html), 'client logs archivedRowsFor counts when debug is enabled');
assert(/renderArchive\(tasks\)[\s\S]*rowsLength/.test(html), 'client logs renderArchive task row counts when debug is enabled');
assert(/let ARCHIVE_TASKS_SERVER_DEBUG_RAN = false;/.test(html), 'client server diagnostic has a one-shot guard flag');
assert(/function archiveTasksServerPipelineDebug_Build13_4\(type\)[\s\S]*type !== 'tasks'[\s\S]*ARCHIVE_TASKS_SERVER_DEBUG_RAN[\s\S]*ARCHIVE_TASKS_SERVER_DEBUG_RAN = true/.test(html), 'server diagnostic call is guarded by tasks view and runs once');
assert(/currentToken\(\)/.test(html), 'server diagnostic uses the existing token function');
assert(/withSuccessHandler\(result => \{[\s\S]*console\.log\('\[ARCHIVE_TASKS_DEBUG\]', 'server pipeline diagnostic', result\)/.test(html), 'server diagnostic success handler logs with required prefix');
assert(/withFailureHandler\(error => \{[\s\S]*console\.error\('\[ARCHIVE_TASKS_DEBUG\]', 'server pipeline diagnostic failed', error\)/.test(html), 'server diagnostic failure handler logs with required prefix');
assert(/BH_DEBUG_archiveTasksPipeline\(token\)/.test(html), 'client calls the server archive pipeline diagnostic');

console.log('archive diagnostics static assertions passed');
