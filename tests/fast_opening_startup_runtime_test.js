const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const html = fs.readFileSync('index.html', 'utf8');
const start = html.indexOf('function CRM_fastShellMode_');
const end = html.indexOf('\nfunction firstAllowedTab_Build13_2', start);
assert(start >= 0 && end > start, 'fast-opening client block exists');
const client = html.slice(start, end);

function scenario({mode = 'privileged', opening, openingFailure = null}) {
  const calls = [];
  const counts = {finish: 0, shellRender: 0, fullRender: 0, refresh: 0, fallback: 0};
  let success;
  let failure;
  const runner = new Proxy({}, {
    get(_target, prop) {
      if(prop === 'withSuccessHandler') return cb => { success = cb; return runner; };
      if(prop === 'withFailureHandler') return cb => { failure = cb; return runner; };
      return (...args) => {
        calls.push(String(prop));
        if(prop === 'קבלת_נתוני_פתיחה_Build13_2') {
          if(openingFailure) failure(openingFailure); else success(opening);
        } else if(prop === 'קבלת_נתוני_ליבה_Build13') {
          success({auth: {allowed: true}, payloadType: 'fullCore'});
        }
      };
    }
  });
  const context = {
    window: null, console, google: {script: {run: runner}},
    Array, JSON, String, Object,
    DATA: {}, CRM_FAST_SHELL_DEFAULT_MODE: 'privileged',
    currentToken: () => 'owner-token',
    CRM_newPerfRequest_: () => ({requestId: 'runtime-test', started: 0}),
    CRM_perfNow_: () => 0, CRM_perfElapsed_: () => 0, CRM_perfLog_: () => {},
    CRM_logServerDiagnostics_: () => {}, hideLogin: () => {}, showLogin: () => {}, clearToken: () => {},
    mergeData_Build13_2: d => { context.DATA = d; context.window.DATA = d; },
    markLoadedModulesFromFullCore_Build13_2: () => {},
    renderShell_Build13_2: () => { counts.shellRender++; },
    // Models the effective late render chain that previously reached refreshCore.
    render: () => {
      counts.fullRender++;
      if(context.DATA && context.DATA.payloadType === 'openingShell') context.refreshCore();
    },
    refreshCore: () => { counts.refresh++; calls.push('קבלת_נתוני_ליבה_Build13'); },
    renderCalendarDashboard: () => {}, updateCalendarViewButtons: () => {},
    document: {getElementById: () => null}
  };
  context.window = context;
  context.CRM_FAST_SHELL_MODE = mode;
  vm.createContext(context);
  vm.runInContext(client, context);
  const finish = context.CRM_finishInitialLoad_;
  context.CRM_finishInitialLoad_ = (...args) => { counts.finish++; return finish(...args); };
  const fallback = context.CRM_loadFullCoreFallback_;
  context.CRM_loadFullCoreFallback_ = (...args) => { counts.fallback++; return fallback(...args); };
  context.load();
  return {calls, counts};
}

const validOpening = {
  schemaVersion: 1, payloadType: 'openingShell', auth: {allowed: true},
  currentUser: {isOwner: true}, system: {}, dashboard: {},
  loadedModules: {dashboard: true}, tasks: [], calendarTasks: []
};

let result = scenario({opening: validOpening});
assert.deepStrictEqual(result.calls, ['קבלת_נתוני_פתיחה_Build13_2']);
assert.deepStrictEqual(result.counts, {finish: 1, shellRender: 1, fullRender: 0, refresh: 0, fallback: 0});

result = scenario({opening: null, openingFailure: new Error('transport')});
assert.deepStrictEqual(result.calls, ['קבלת_נתוני_פתיחה_Build13_2', 'קבלת_נתוני_ליבה_Build13']);
assert.strictEqual(result.counts.fallback, 1);

result = scenario({opening: {auth: {allowed: true}}});
assert.deepStrictEqual(result.calls, ['קבלת_נתוני_פתיחה_Build13_2', 'קבלת_נתוני_ליבה_Build13']);
assert.strictEqual(result.counts.fallback, 1);

result = scenario({mode: 'off', opening: validOpening});
assert.deepStrictEqual(result.calls, ['קבלת_נתוני_ליבה_Build13']);
assert.strictEqual(result.counts.fallback, 1);

console.log('fast opening startup runtime assertions passed');
