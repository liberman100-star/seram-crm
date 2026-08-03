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
let requests = 0;
let overlay;
const document = {
  createElement(){
    return {style:{}, dataset:{}, parentNode:{removeChild(){ overlay = null; }},
      addEventListener(type, fn){ this.listener = fn; }};
  },
  getElementById(id){ return id === 'projectOwnerLinkChoice' ? overlay : null; },
  body:{appendChild(node){ overlay = node; }}
};
const runner = {
  withSuccessHandler(fn){ success = fn; return this; },
  withFailureHandler(fn){ failure = fn; return this; },
  שמירת_פרויקט_קנונית_Build16(payload){ sent = payload; requests++; }
};
const sandbox = {
  window:null, console, setTimeout(fn){ fn(); },
  DATA:{
    projects:[{'מזהה פרויקט':'P1','שם פרויקט':'ישן'}], tasks:[], calendarTasks:[], contacts:[], links:[], dashboard:{},
    calendarCreatorsAllowed:[], calendarCreatorPermission:{}
  },
  pName:{value:'חדש'}, pDescription:{value:'תיאור'}, pCity:{value:'תל אביב'}, pType:{value:'מגורים'},
  pStatus:{value:'פעיל'}, pAssignmentDomain:{value:'A'}, pOwner:{value:'דנה',selectedOptions:[]}, pTags:{value:'x'}, pDrive:{value:'d'},
  document,
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

const initiallyLinkedOption = {
  value:'דנה', dataset:{contactId:'C1'}, parentElement:{label:'משויכים לפרויקט'},
  getAttribute(name){ return name === 'data-contact-id' ? 'C1' : null; }
};
sandbox.pOwner.options = [initiallyLinkedOption];
sandbox.pOwner.selectedIndex = 0;
sandbox.pOwner.selectedOptions = [initiallyLinkedOption];
sandbox.DATA.links = [{'מזהה פרויקט':'P1','מזהה איש קשר':'C1','פעיל':'כן','בארכיון':'לא'}];

const response = decision => ({
  ok:true, authenticated:true, route:'project-edit-canonical-v1', fullInvalidation:false,
  projectId:'P1', sequence:1, updatedAt:'2026-08-02', projectVisible:decision !== 'remove' && decision !== 'unchanged',
  projectDecision:decision, canonicalProject:(decision === 'replace' || decision === 'insert') ? {'מזהה פרויקט':'P1','שם פרויקט':'חדש'} : null,
  affectedTasks:[{'מזהה משימה':'T1','שם פרויקט':'חדש'}], tasksDecision:'replaceAll',
  affectedCalendarTasks:[{'מזהה משימה':'T1','יומן':'דנה'}], calendarTasksDecision:'replaceAll',
  contacts:[], contactsDecision:'replaceAll', links:[{'מזהה פרויקט':'P1','מזהה איש קשר':'C1','פעיל':'כן'}], linksDecision:'replaceAll',
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

const additionalOption = {
  value:'דנה', dataset:{linked:'no',contactId:'C1'}, parentElement:{label:'משתמשים נוספים'},
  getAttribute(name){ return name === 'data-linked' ? 'no' : name === 'data-contact-id' ? 'C1' : null; }
};
sandbox.pOwner.options = [additionalOption];
sandbox.pOwner.selectedIndex = 0;
sandbox.pOwner.selectedOptions = [additionalOption];
sandbox.DATA.links = [];
const sequenceBeforeChoice = sent.sequence;
const requestsBeforeChoice = requests;
sandbox.saveProject('P1');
assert.ok(overlay && overlay.innerHTML.includes('כן, לשייך ולהמשיך'), 'an unlinked owner opens the three-choice dialog');
assert.strictEqual(requests, requestsBeforeChoice, 'no server request is sent before a dialog choice');
const firstOverlay = overlay;
sandbox.saveProject('P1');
assert.strictEqual(overlay, firstOverlay, 'duplicate click does not create a second dialog');
assert.strictEqual(busy, 0, 'opening or cancelling the dialog does not start Busy');
overlay.listener({target:{getAttribute:()=> 'cancel'}});
assert.strictEqual(overlay, null, 'cancel closes only the choice dialog');
assert.strictEqual(sent.sequence, sequenceBeforeChoice, 'cancel does not save');

sandbox.saveProject('P1');
overlay.listener({target:{getAttribute:()=> 'without'}});
assert.strictEqual(sent.ownerLinkMode, 'without', 'continue without link is explicit in the canonical request');
failure(new Error('transport'));
sandbox.saveProject('P1');
overlay.listener({target:{getAttribute:()=> 'link'}});
assert.strictEqual(sent.ownerLinkMode, 'link', 'link and continue is explicit in the canonical request');
assert.strictEqual(busy, 1, 'link and save uses central Busy');
failure(new Error('transport'));
assert.strictEqual(busy, 0, 'Busy clears after link transport failure');

const linkedOption = Object.assign({}, additionalOption, {dataset:{contactId:'C1'}, parentElement:{label:'משויכים לפרויקט'}});
linkedOption.getAttribute = name => name === 'data-contact-id' ? 'C1' : null;
sandbox.pOwner.options = [linkedOption];
sandbox.pOwner.selectedOptions = [linkedOption];
sandbox.DATA.links = [{'מזהה פרויקט':'P1','מזהה איש קשר':'C1','פעיל':'כן','בארכיון':'לא'}];
sandbox.saveProject('P1');
assert.strictEqual(overlay, null, 'a proven active DATA.links match saves without a dialog');
assert.strictEqual(sent.ownerLinkMode, 'existing', 'a linked owner uses the existing-link mode');
failure(new Error('transport'));

const noDatasetOption = {value:'דנה',parentElement:{label:'משתמשים נוספים'},getAttribute(){ return null; }};
sandbox.pOwner.options = [noDatasetOption];
sandbox.pOwner.selectedOptions = [noDatasetOption];
sandbox.DATA.links = [];
sandbox.saveProject('P1');
assert.ok(overlay, 'missing dataset with an additional-users optgroup opens the dialog');
overlay.listener({target:{getAttribute:()=> 'cancel'}});

sandbox.pOwner.options = [linkedOption];
sandbox.pOwner.selectedOptions = [linkedOption];
delete sandbox.DATA.links;
sandbox.saveProject('P1');
assert.ok(overlay, 'unloaded DATA.links produces unknown and opens the dialog');
overlay.listener({target:{getAttribute:()=> 'cancel'}});

sandbox.pOwner.value = '';
sandbox.pOwner.options = [];
sandbox.pOwner.selectedOptions = [];
sandbox.pOwner.selectedIndex = -1;
sandbox.saveProject('P1');
assert.strictEqual(overlay, null, 'an empty owner does not open the dialog');
assert.strictEqual(sent.ownerLinkMode, 'existing', 'empty selection proceeds through existing validation without a choice dialog');
failure(new Error('transport'));
console.log('project_edit_local_patch_runtime_test: OK');
