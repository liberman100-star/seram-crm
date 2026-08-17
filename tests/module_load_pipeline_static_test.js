const assert = require('assert');
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const load = html.slice(html.indexOf('function loadModule_Build13_2'), html.indexOf('function BH_snapshotModuleDependencies_Build13_2'));
const coordinator = html.slice(html.indexOf('function BH_renderLoadedModule_Build13_2'), html.indexOf('function renderModule_Build13_2'));
const merge = html.slice(html.indexOf('function mergeData_Build13_2'), html.indexOf('function hasRealModuleData_Build13_2'));

assert(!/renderShell_Build13_2\s*\(/.test(load), 'module success must not render the shell');
assert.strictEqual((load.match(/mergeData_Build13_2\s*\(/g) || []).length, 1, 'module success has one merge call site');
assert.strictEqual((coordinator.match(/renderModule_Build13_2\s*\(module\)/g) || []).length, 1, 'coordinator has one module render call site');
assert(!/tableProjects|tableContacts|tableTasks|renderSettings/.test(load), 'loader does not fan out to business views');
assert(!/refreshCore\s*\(|\bload\s*\(/.test(load), 'normal module route does not refresh or reload core');
assert(!/\btab\s*\(|closeM\s*\(|resetTopLevelTabState\s*\(/.test(load + coordinator), 'module success preserves navigation, modal, filters, and scroll state');
assert(/window\.DATA = DATA/.test(merge), 'atomic merge publishes DATA once');
assert(/isArchiveModulePayload[\s\S]*if\(isArchiveModulePayload && \(k === 'projects' \|\| k === 'contacts' \|\| k === 'tasks'\)\) return/.test(merge), 'archive merge does not replace active collections');
assert(/CRM_MODULE_RENDER_PERF/.test(html), 'privacy-safe module performance event exists');
assert(/shellRendered:false/.test(coordinator), 'successful instrumentation records no shell render');
console.log('module_load_pipeline_static_test: OK');
