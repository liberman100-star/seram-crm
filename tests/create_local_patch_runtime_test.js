const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync('index.html','utf8');
const block=html.match(/<script id="BH_CREATE_LOCAL_PATCH_BUILD17">([\s\S]*?)<\/script>/)[1];
let dashboard=0, calendar=0, tabCalls=0, loads=0, refreshes=0;
const context={console,window:null,DATA:{tasks:[],calendarTasks:[],contacts:[],projects:[],links:[],dashboard:{}},
  __BH_LOADED_MODULES__:{tasks:true,contacts:true,projects:true},document:{getElementById:()=>({})},
  tab:(id)=>{assert.equal(id,'dashboard');tabCalls++},renderDashboard:()=>dashboard++,renderCalendarDashboard:()=>calendar++,
  tableTasks(){},tableContacts(){},tableProjects(){},openTaskCard(){},openContactCardById(){},openProjectCard(){},
  saveTask(){},saveContact(){},saveProject(){},refreshCore:()=>refreshes++,load:()=>loads++,currentToken:()=>'',
  clearToken(){},showLogin(){},closeM(){},BH_UI_setBusy:()=>()=>{},CRM_perfNow_:()=>0,CRM_perfLog_(){},
  canCreate:()=>true,alert(){},google:{script:{run:{}}}};context.window=context;
vm.createContext(context);vm.runInContext(block,context);
context.goDashboard();
assert.equal(tabCalls,1);assert.equal(loads,0);assert.equal(refreshes,0);assert.deepEqual(context.__BH_LOADED_MODULES__,{tasks:true,contacts:true,projects:true});
const api=context.__BH_CREATE_PATCH_TEST__;
const task={'מזהה משימה':'t1',calendarMembers:['A','B']};
api.apply({entityId:'t1',record:task,calendarRecord:{'מזהה משימה':'t1',calendarMembers:['A','B']},dashboard:{tasks:1},calendarCreatorsAllowed:['A']},'task');
assert.equal(context.DATA.tasks[0],task);assert.deepEqual(context.DATA.calendarTasks[0].calendarMembers,['A','B']);
api.apply({entityId:'c1',record:{'מזהה איש קשר':'c1'},dashboard:{contacts:1}},'contact');
api.apply({entityId:'p1',record:{'מזהה פרויקט':'p1'},links:[{'מזהה שיוך':'l1'}],dashboard:{projects:1}},'project');
assert.equal(context.DATA.contacts[0]['מזהה איש קשר'],'c1');assert.equal(context.DATA.projects[0]['מזהה פרויקט'],'p1');assert.equal(context.DATA.links.length,1);
assert(api.valid({ok:true,authenticated:true,route:'task-create-canonical-v1',fullInvalidation:false,sequence:7,entityId:'t',record:task,dashboard:{}},'task',7));
assert(!api.valid({},'task',7));
console.log('create local patch runtime test passed');
