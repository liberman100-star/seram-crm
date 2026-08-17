const fs=require('fs'),vm=require('vm'),assert=require('assert');
const gs=fs.readFileSync('V2.GS.txt','utf8');
const start=gs.indexOf('/*********************** Build 17 – canonical CREATE');
const end=gs.indexOf('var BH_DIAG_originalSaveContact_',start);
const source=gs.slice(start,end);
let task, user, saves=0, helperCalls=[];
const context={Date,Set,Object,Array,String,Number,BH15_CAL_PERMS_SHEET:'calendar permissions',
  SHEETS:{PROJECTS:'projects',CONTACTS:'contacts'},
  שמירת_משימה:data=>{saves++;assert.strictEqual(data.returnCanonicalRow,true);return task;},
  שמירת_איש_קשר:data=>({'מזהה איש קשר':'c1'}),שמירת_פרויקט:data=>({'מזהה פרויקט':'p1'}),
  משתמש_מפועל_Build11_2_:()=>user,
  BH_calendarMembersForTask_:row=>[row['יוצר'],row['אחראי']].filter(Boolean),BH_calendarColorIndex_:()=>1,
  BH_normalizeTaskMutationValue_:value=>value,formatValue_:v=>v,getSS_:()=>{throw new Error('unexpected broad sheet read')},
  BH15_משימה_מותרת_ביומן_:(row,current,maps,perms)=>{
    helperCalls.push({row,current,maps,perms});
    if(current.isOwner || current.role==='מנהל ראשי') return true;
    return perms.some(p=>p.allow===true && p.domain===row.assignmentDomain);
  },
  BH15_הרשאת_יוצרי_יומן_:(current,creators)=>({mode:(current.isOwner||current.role==='מנהל ראשי')?'all':'allowed',creators:[...creators]})};
vm.createContext(context);vm.runInContext(source,context);
context.BH_createFindRow_Build17_=(sheet)=>sheet==='projects'?{'שם פרויקט':'Restricted Project'}:{'שם מלא':'Restricted Contact'};
let permissionRows=[];context.BH_createCalendarPermissionRows_Build17_=()=>permissionRows;
function create(overrides={},current={role:'משתמש',isOwner:false}){
  user=current; task=Object.assign({'מזהה משימה':'t1','מזהה פרויקט':'p1','מזהה איש קשר':'c1','סטטוס':'פתוח','יוצר אירוע':'Other','יוצר':'Creator','אחראי':'Owner',assignmentDomain:'A'},overrides);
  return context.שמירת_משימה_חדשה_קנונית_Build17({authToken:'token',sequence:saves+1});
}
permissionRows=[];let response=create();
assert.equal(response.calendarRecord,null,'a non-empty projectId must not make a denied task visible');
permissionRows=[{allow:true,domain:'A'}];response=create();
assert(response.calendarRecord,'canonical helper allowance includes the task');
permissionRows=[{allow:true,domain:'B'}];response=create();
assert.equal(response.calendarRecord,null,'assignment-domain/permission mismatch remains denied');
permissionRows=[];response=create({}, {role:'מנהל ראשי',isOwner:false});
assert(response.calendarRecord,'super-admin remains calendar-visible');assert.equal(response.calendarCreatorPermission.mode,'all');
assert.equal(helperCalls.length,4);assert.equal(helperCalls[0].maps.projects.p1,'Restricted Project');
assert.equal(helperCalls[0].maps.contacts.c1,'Restricted Contact');assert.equal(saves,4);
// No Full Core symbol is supplied: all normal responses completed without one.
console.log('canonical create server narrow authorization runtime test passed');
