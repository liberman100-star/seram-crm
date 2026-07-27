const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const html = fs.readFileSync('index.html', 'utf8');
const match = html.match(/<!-- Task-edit local patch:[\s\S]*?<script>([\s\S]*?)<\/script>/);
assert(match, 'task edit local patch script exists');

let successHandler, failureHandler, request, refreshes = 0, logouts = 0;
const renders = {tasks:0,dashboard:0,calendar:0,card:0,projects:0,contacts:0};
const button = {disabled:false,textContent:'שמור',dataset:{}};
const sandbox = {
  window:{}, console:{info(){}}, Date, Object, Array, Number, String, Error,
  DATA:{tasks:[{'מזהה משימה':'T1','כותרת':'old'}],calendarTasks:[{'מזהה משימה':'T1','כותרת':'old'}],notes:[]},
  modalBox:{querySelector(){return button;}},
  clearToken(){logouts++;}, showLogin(){logouts++;},
  refreshCore(cb){refreshes++; if(cb) cb();}, openTaskCard(){},
  tableTasks(){renders.tasks++;}, renderDashboard(){renders.dashboard++;},
  renderCalendarDashboard(){renders.calendar++;}, renderTaskCard(){renders.card++;},
  taskCardPayloadFromTask(task){return {task,notes:[]};},
  google:{script:{run:{
    withSuccessHandler(fn){successHandler=fn;return this;},
    withFailureHandler(fn){failureHandler=fn;return this;},
    שמירת_משימה(value){request=value;return this;}
  }}}
};
sandbox.window = sandbox;
vm.runInNewContext(match[1], sandbox);

const base = {authToken:'secret'};
assert.strictEqual(sandbox.BH_saveTaskEditLocal('T1', base), true, 'first request starts');
assert.strictEqual(sandbox.BH_saveTaskEditLocal('T1', {}), false, 'duplicate request is rejected');
assert.strictEqual(button.disabled, true, 'busy state is visible');
const canonical = {'מזהה משימה':'T1','כותרת':'canonical','עדכון אחרון':'2026-07-27 10:00'};
successHandler({ok:true,authenticated:true,route:'task-edit',task:canonical,taskId:'T1',updatedAt:'2026-07-27 10:00',sequence:request.clientSequence,fullInvalidation:false});
assert.strictEqual(sandbox.DATA.tasks[0], canonical, 'canonical object replaces local row');
assert.strictEqual(sandbox.DATA.calendarTasks[0], canonical, 'calendar task is replaced');
assert.deepStrictEqual(renders, {tasks:1,dashboard:1,calendar:1,card:1,projects:0,contacts:0}, 'only relevant views render');
assert.strictEqual(refreshes, 0, 'valid mutation does not refresh core');
assert.strictEqual(button.disabled, false, 'busy state clears after success');
assert.strictEqual(Object.keys(sandbox.__BH_TASK_EDIT_TEST_HOOKS__.pending).length, 0, 'pending state clears');

sandbox.BH_saveTaskEditLocal('T1', {});
sandbox.__BH_TASK_EDIT_TEST_HOOKS__.latestApplied.T1 = request.clientSequence + 1;
successHandler({ok:true,authenticated:true,route:'task-edit',task:{'מזהה משימה':'T1','כותרת':'stale'},taskId:'T1',updatedAt:'old',sequence:request.clientSequence,fullInvalidation:false});
assert.strictEqual(sandbox.DATA.tasks[0]['כותרת'], 'canonical', 'stale response cannot overwrite canonical row');
assert.strictEqual(refreshes, 1, 'stale result takes the single safe fallback');

sandbox.BH_saveTaskEditLocal('T1', {});
successHandler({ok:false});
assert.strictEqual(refreshes, 2, 'invalid response has one fallback');
assert.strictEqual(button.disabled, false, 'busy state clears after invalid response');

sandbox.BH_saveTaskEditLocal('T1', {});
failureHandler(new Error('network'));
assert.strictEqual(refreshes, 3, 'transport error has one fallback');
assert.strictEqual(button.disabled, false, 'busy state clears after transport failure');

sandbox.BH_saveTaskEditLocal('T1', {});
failureHandler(new Error('session expired'));
assert.strictEqual(refreshes, 3, 'expired session does not refresh core');
assert.strictEqual(logouts, 2, 'expired session uses canonical clear/login path');
assert.strictEqual(Object.keys(sandbox.__BH_TASK_EDIT_TEST_HOOKS__.pending).length, 0, 'session failure clears pending state');
console.log('task_edit_local_patch_runtime_test: OK');
