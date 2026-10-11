const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const html = fs.readFileSync('index.html', 'utf8');
const match = html.match(/<!-- Task-edit local patch:[\s\S]*?<script>([\s\S]*?)<\/script>/);
assert(match, 'task edit local patch script exists');

let successHandler, failureHandler, request, refreshes = 0, logouts = 0, warnings = 0;
const renders = {tasks:0,dashboard:0,calendar:0,card:0,projects:0,contacts:0};
const button = {disabled:false,textContent:'שמור',dataset:{}};
const sandbox = {
  window:{}, console:{info(){}}, Date, Object, Array, Number, String, Error,
  DATA:{tasks:[{'מזהה משימה':'T1','כותרת':'old'}],calendarTasks:[{'מזהה משימה':'T1','כותרת':'old'}],notes:[]},
  modalBox:{querySelector(){return button;}},
  clearToken(){logouts++;}, showLogin(){logouts++;}, alert(){warnings++;},
  refreshCore(cb){refreshes++; if(cb) cb();}, openTaskCard(){},
  tableTasks(){renders.tasks++;}, renderDashboard(){renders.dashboard++;},
  renderCalendarDashboard(){renders.calendar++;}, renderTaskCard(){renders.card++;}, closeM(){renders.card++;},
  taskCardPayloadFromTask(task){return {task,notes:[]};},
  BH_UI_setBusy(){ button.disabled=true; return ()=>{button.disabled=false;}; },
  google:{script:{run:{
    withSuccessHandler(fn){successHandler=fn;return this;},
    withFailureHandler(fn){failureHandler=fn;return this;},
    שמירת_משימה(value){request=value;return this;}
  }}}
};
sandbox.window = sandbox;
vm.runInNewContext(match[1], sandbox);

const base = {authToken:'secret'};
function response(overrides={}){
  const canonicalTask = {'מזהה משימה':'T1','כותרת':'canonical','מזהה פרויקט':'P2','מזהה איש קשר':'C2','עדכון אחרון':'2026-07-27 10:00','יומן':'owner-2','calendarColorIndex':2};
  return Object.assign({
    ok:true,authenticated:true,route:'task-edit',taskId:'T1',updatedAt:'2026-07-27 10:00',
    sequence:request.clientSequence,fullInvalidation:false,canonicalTask,taskVisible:true,taskDecision:'replace',
    calendarVisible:true,canonicalCalendarRecord:Object.assign({}, canonicalTask),calendarDecision:'replace',
    calendarCreatorsAllowed:['owner-2'],calendarCreatorPermission:{mode:'allowed',creators:['owner-2']},
    dashboard:{lateTasks:[],todayTasks:[canonicalTask],weekTasks:[canonicalTask]},calendarSync:{attempted:true,ok:true,eventId:'EV-1',message:''},invalidations:['tasks','calendarTasks','dashboard']
  }, overrides);
}
assert.strictEqual(sandbox.BH_saveTaskEditLocal('T1', base), true, 'first request starts');
assert.strictEqual(sandbox.BH_saveTaskEditLocal('T1', {}), false, 'duplicate request is rejected');
assert.strictEqual(button.disabled, true, 'busy state is visible');
const replaceResponse = response({calendarSync:{attempted:true,ok:false,eventId:'',message:'המשימה נשמרה, אך הסנכרון ליומן Google נכשל'}});
successHandler(replaceResponse);
assert.strictEqual(sandbox.DATA.tasks[0], replaceResponse.canonicalTask, 'canonical object replaces local row');
assert.strictEqual(sandbox.DATA.calendarTasks[0], replaceResponse.canonicalCalendarRecord, 'canonical calendar record replaces local row');
assert.strictEqual(sandbox.DATA.tasks[0]['מזהה פרויקט'], 'P2', 'canonical project change is applied');
assert.strictEqual(sandbox.DATA.tasks[0]['מזהה איש קשר'], 'C2', 'canonical contact change is applied');
assert.deepStrictEqual(sandbox.DATA.calendarCreatorsAllowed, ['owner-2'], 'calendar creator list changes canonically');
assert.strictEqual(sandbox.DATA.dashboard.todayTasks.length, 1, 'canonical dashboard changes with task buckets');
assert.deepStrictEqual(renders, {tasks:1,dashboard:1,calendar:1,card:1,projects:0,contacts:0}, 'only relevant views render');
assert.strictEqual(refreshes, 0, 'valid mutation does not refresh core');
assert.strictEqual(warnings, 1, 'calendar failure warns once without invalidating the local edit patch');
assert.strictEqual(button.disabled, false, 'busy state clears after success');
assert.strictEqual(Object.keys(sandbox.__BH_TASK_EDIT_TEST_HOOKS__.pending).length, 0, 'pending state clears');

sandbox.BH_saveTaskEditLocal('T1', {});
sandbox.__BH_TASK_EDIT_TEST_HOOKS__.latestApplied.T1 = request.clientSequence + 1;
successHandler(response({canonicalTask:{'מזהה משימה':'T1','כותרת':'stale'},updatedAt:'old'}));
assert.strictEqual(sandbox.DATA.tasks[0]['כותרת'], 'canonical', 'stale response cannot overwrite canonical row');
assert.strictEqual(refreshes, 1, 'stale result takes the single safe fallback');

// Server-directed calendar insertion after project/contact visibility changes.
sandbox.DATA.calendarTasks = [];
sandbox.BH_saveTaskEditLocal('T1', {});
successHandler(response({calendarDecision:'insert'}));
assert.strictEqual(sandbox.DATA.calendarTasks.length, 1, 'calendar record is inserted');
assert.strictEqual(sandbox.DATA.calendarTasks[0]['יומן'], 'owner-2', 'calendar ownership comes from canonical enrichment');

// Server-directed calendar removal.
sandbox.BH_saveTaskEditLocal('T1', {});
successHandler(response({calendarVisible:false,calendarDecision:'remove',canonicalCalendarRecord:null,calendarCreatorsAllowed:[]}));
assert.strictEqual(sandbox.DATA.calendarTasks.length, 0, 'calendar record is removed');

// Generic task insertion/removal decisions cover visibility transitions.
sandbox.DATA.tasks = [];
sandbox.BH_saveTaskEditLocal('T1', {});
successHandler(response({taskDecision:'insert',calendarVisible:false,calendarDecision:'remove',canonicalCalendarRecord:null}));
assert.strictEqual(sandbox.DATA.tasks.length, 1, 'visible task is inserted');
sandbox.BH_saveTaskEditLocal('T1', {});
successHandler(response({taskVisible:false,taskDecision:'remove',canonicalTask:null,calendarVisible:false,calendarDecision:'remove',canonicalCalendarRecord:null}));
assert.strictEqual(sandbox.DATA.tasks.length, 0, 'task losing visibility is removed');

// Restore fixture for fallback cases.
sandbox.DATA.tasks = [{'מזהה משימה':'T1'}];
sandbox.DATA.calendarTasks = [];

sandbox.BH_saveTaskEditLocal('T1', {});
successHandler({ok:false});
assert.strictEqual(refreshes, 2, 'invalid response has one fallback');
assert.strictEqual(button.disabled, false, 'busy state clears after invalid response');

sandbox.BH_saveTaskEditLocal('T1', {});
successHandler(response({fullInvalidation:true}));
assert.strictEqual(refreshes, 3, 'server full invalidation has one fallback');

sandbox.BH_saveTaskEditLocal('T1', {});
failureHandler(new Error('network'));
assert.strictEqual(refreshes, 4, 'transport error has one fallback');
assert.strictEqual(button.disabled, false, 'busy state clears after transport failure');

sandbox.BH_saveTaskEditLocal('T1', {});
failureHandler(new Error('session expired'));
assert.strictEqual(refreshes, 4, 'expired session does not refresh core');
assert.strictEqual(logouts, 2, 'expired session uses canonical clear/login path');
assert.strictEqual(Object.keys(sandbox.__BH_TASK_EDIT_TEST_HOOKS__.pending).length, 0, 'session failure clears pending state');
console.log('task_edit_local_patch_runtime_test: OK');
