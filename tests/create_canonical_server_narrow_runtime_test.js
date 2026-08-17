const fs=require('fs'),vm=require('vm'),assert=require('assert');
const gs=fs.readFileSync('V2.GS.txt','utf8');
const start=gs.indexOf('/*********************** Build 17 – canonical CREATE');
const end=gs.indexOf('var BH_DIAG_originalSaveContact_',start);
const source=gs.slice(start,end);
let saves=0;
const task={'מזהה משימה':'t1','מזהה פרויקט':'','סטטוס':'פתוח','יוצר':'Creator','אחראי':'Owner'};
const context={Date,Set,Object,Array,String,Number,
  SHEETS:{PROJECTS:'projects'},
  שמירת_משימה:data=>{saves++;assert.strictEqual(data.returnCanonicalRow,true);return task;},
  שמירת_איש_קשר:data=>({'מזהה איש קשר':'c1'}),שמירת_פרויקט:data=>({'מזהה פרויקט':'p1'}),
  משתמש_מפועל_Build11_2_:()=>({allowed:true,role:'מנהל ראשי',isOwner:true}),
  BH_calendarMembersForTask_:()=>['Creator','Owner'],BH_calendarColorIndex_:()=>1,
  BH_normalizeTaskMutationValue_:value=>value,getSS_:()=>{throw new Error('unexpected sheet read')},formatValue_:v=>v};
vm.createContext(context);vm.runInContext(source,context);
const response=context.שמירת_משימה_חדשה_קנונית_Build17({authToken:'token',sequence:3});
assert.equal(saves,1);assert.equal(response.fullInvalidation,false);assert.equal(response.entityId,'t1');
assert.equal(response.dashboardPatch.entity,'task');assert.deepEqual(Array.from(response.calendarCreatorsAdded),['Creator','Owner']);
// No Full Core symbol is supplied to the sandbox: normal completion proves the endpoint did not invoke one.
console.log('canonical create server narrow runtime test passed');
