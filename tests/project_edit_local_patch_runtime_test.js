const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');
const start = html.indexOf('(function(global){', html.indexOf('<!-- Build 16: canonical local patch'));
const end = html.indexOf('</script>', start);
const source = html.slice(start, end);
let refreshes = 0;
let busy = 0;
let success;
let failure;
let sent;
const runner = {
  withSuccessHandler(fn){ success = fn; return this; },
  withFailureHandler(fn){ failure = fn; return this; },
  שמירת_פרויקט_קנונית_Build16(payload){ sent = payload; }
};
const sandbox = {
  window:null, console, setTimeout(fn){ fn(); },
  DATA:{
    projects:[{'מזהה פרויקט':'P1','שם פרויקט':'ישן'}], tasks:[], calendarTasks:[], contacts:[], links:[], dashboard:{},
    calendarCreatorsAllowed:[], calendarCreatorPermission:{}
  },
  pName:{value:'חדש'}, pDescription:{value:'תיאור'}, pCity:{value:'תל אביב'}, pType:{value:'מגורים'},
  pStatus:{value:'פעיל'}, pAssignmentDomain:{value:'A'}, pOwner:{value:'דנה'}, pTags:{value:'x'}, pDrive:{value:'d'},
  currentToken:()=> 'TOKEN', refreshCore(){ refreshes++; },
  BH_UI_setBusy(){ busy++; return ()=>busy--; },
  google:{script:{run:runner}},
  tableProjects(){}, renderDashboard(){}, tableTasks(){}, renderCalendarDashboard(){}, updateCalendarViewButtons(){},
  openProjectCard(){}, closeM(){}, clearToken(){}, showLogin(){}, alert(){},
  scrollTo(){}, scrollX:0, scrollY:0
};
sandbox.window = sandbox;
sandbox.saveProject = function(){ sandbox.createCalled = true; };
vm.runInNewContext(source, sandbox);

const response = decision => ({
  ok:true, authenticated:true, route:'project-edit-canonical-v1', fullInvalidation:false,
  projectId:'P1', sequence:1, updatedAt:'2026-08-02', projectVisible:decision !== 'remove' && decision !== 'unchanged',
  projectDecision:decision, canonicalProject:(decision === 'replace' || decision === 'insert') ? {'מזהה פרויקט':'P1','שם פרויקט':'חדש'} : null,
  affectedTasks:[{'מזהה משימה':'T1','שם פרויקט':'חדש'}], tasksDecision:'replaceAll',
  affectedCalendarTasks:[{'מזהה משימה':'T1','יומן':'דנה'}], calendarTasksDecision:'replaceAll',
  contacts:[], contactsDecision:'replaceAll', links:[], linksDecision:'replaceAll',
  dashboard:{projectsCount:1,activeProjects:[]}, calendarCreatorsAllowed:['דנה'], calendarCreatorPermission:{mode:'allowed'},
  invalidations:['projects','tasks','calendarTasks','dashboard']
});

sandbox.saveProject('P1');
assert.strictEqual(busy, 1, 'busy begins while saving');
assert.strictEqual(sent.projectDescription, 'תיאור', 'all editable project metadata is sent');
assert.deepStrictEqual(
  [sent.name, sent.city, sent.type, sent.status, sent.owner, sent.assignmentDomain, sent.tags, sent.drive],
  ['חדש', 'תל אביב', 'מגורים', 'פעיל', 'דנה', 'A', 'x', 'd'],
  'name, city, type, status, owner, assignment domain, tags and Drive are sent'
);
sandbox.saveProject('P1');
assert.strictEqual(sent.sequence, 1, 'duplicate in-flight request is ignored');
success(response('replace'));
assert.strictEqual(sandbox.DATA.projects[0]['שם פרויקט'], 'חדש', 'canonical project replaces local row');
assert.strictEqual(sandbox.DATA.tasks[0]['שם פרויקט'], 'חדש', 'canonical task enrichment replaces local tasks');
assert.strictEqual(sandbox.DATA.calendarTasks[0]['יומן'], 'דנה', 'canonical calendar enrichment replaces local calendar');
assert.strictEqual(sandbox.DATA.dashboard.projectsCount, 1, 'canonical dashboard replaces local dashboard');
assert.strictEqual(busy, 0, 'busy is cleared after success');
assert.strictEqual(refreshes, 0, 'normal success does not refresh Core');
success(response('replace'));
assert.strictEqual(refreshes, 0, 'duplicate callback is ignored');

// Pure decision behavior is covered independently of transport.
const api = sandbox.__BH_PROJECT_EDIT_PATCH_TEST__;
assert.strictEqual(api.applyProjectDecision([], 'insert', {'מזהה פרויקט':'P2'}, 'P2').length, 1, 'insert works');
assert.strictEqual(api.applyProjectDecision([{'מזהה פרויקט':'P1'}], 'remove', null, 'P1').length, 0, 'remove works');
assert.strictEqual(api.applyProjectDecision([], 'unchanged', null, 'P1').length, 0, 'unchanged works');

sandbox.saveProject('P1');
const invalid = response('replace'); invalid.sequence = 2; invalid.fullInvalidation = true;
success(invalid);
assert.strictEqual(refreshes, 1, 'full invalidation falls back once');
success(invalid);
assert.strictEqual(refreshes, 1, 'full invalidation duplicate callback cannot fall back twice');
assert.strictEqual(busy, 0, 'busy is cleared after fallback');

sandbox.saveProject('P1');
failure(new Error('transport'));
assert.strictEqual(refreshes, 2, 'transport failure reconciles with one fallback');
assert.strictEqual(busy, 0, 'busy is cleared after transport failure');

sandbox.saveProject('P1');
success({authenticated:false, auth:{reason:'החיבור פג'}, sequence:4});
assert.strictEqual(refreshes, 2, 'session expiry uses the login route instead of fallback');
assert.strictEqual(busy, 0, 'busy is cleared after session expiry');

sandbox.saveProject('P1');
const stale = response('replace'); stale.sequence = 4;
success(stale);
assert.strictEqual(refreshes, 2, 'stale response is ignored without fallback');
assert.strictEqual(busy, 0, 'busy is cleared for a stale response');

sandbox.saveProject('');
assert.strictEqual(sandbox.createCalled, true, 'Create Project remains on the previous route');
console.log('project_edit_local_patch_runtime_test: OK');
