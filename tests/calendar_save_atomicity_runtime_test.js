const fs=require('fs'),vm=require('vm'),assert=require('assert');
const gs=fs.readFileSync('V2.GS.txt','utf8');
function source(name){
  const start=gs.indexOf('function '+name+'('); assert(start>=0,name+' exists');
  const brace=gs.indexOf('{',start); let depth=0,quote='',escape=false;
  for(let i=brace;i<gs.length;i++){
    const c=gs[i];
    if(quote){if(escape)escape=false;else if(c==='\\')escape=true;else if(c===quote)quote='';continue;}
    if(c==='"'||c==="'"||c==='`'){quote=c;continue;} if(c==='{')depth++; if(c==='}'&&--depth===0)return gs.slice(start,i+1);
  }
  throw new Error('unterminated '+name);
}
const helper=source('BH_persistTaskThenSyncCalendar_');
function run(options={}){
  const calls=[];let inserts=0;
  const context={SHEETS:{TASKS:'tasks'},Date,
    upsert_ללא_אימות_(){calls.push('persist');if(options.persistFails)throw new Error('sheet down');},
    syncCalendarEvent_(row,settings){calls.push('sync');inserts++;assert.strictEqual(settings.includeGuests,false);assert.strictEqual(settings.sendUpdates,'none');if(options.calendarFails)throw new Error('calendar down');return options.eventId||'EV-1';},
    BH_patchTaskCalendarFields_(id,eventId){calls.push('patch:'+id+':'+eventId);if(options.patchFails)throw new Error('patch down');}
  };
  vm.runInNewContext(helper,context);
  const row={'מזהה משימה':options.edit?'T-existing':'T-new','כניסה ליומן':'כן','תאריך':'2026-08-20','שעה':'10:00','מזהה אירוע ביומן':options.edit?'EV-old':''};
  return {context,row,calls,get inserts(){return inserts;}};
}
let x=run();let result=x.context.BH_persistTaskThenSyncCalendar_(x.row,'T-new');
assert.deepStrictEqual(x.calls,['persist','sync','patch:T-new:EV-1'],'CRM persists before Calendar and patches event id afterward');
assert.strictEqual(result.ok,true);assert.strictEqual(result.eventId,'EV-1');assert.strictEqual(x.row['מזהה אירוע ביומן'],'EV-1','canonical row contains successful event id');
x=run({calendarFails:true});result=x.context.BH_persistTaskThenSyncCalendar_(x.row,'T-new');
assert.deepStrictEqual(x.calls,['persist','sync']);assert.strictEqual(result.ok,false);assert.strictEqual(result.attempted,true);assert.strictEqual(x.row['מזהה אירוע ביומן'],'','failed sync leaves persisted event id unchanged');
x=run({persistFails:true});assert.throws(()=>x.context.BH_persistTaskThenSyncCalendar_(x.row,'T-new'),/sheet down/);assert.deepStrictEqual(x.calls,['persist'],'persistence failure prevents Calendar sync');
x=run({patchFails:true});result=x.context.BH_persistTaskThenSyncCalendar_(x.row,'T-new');assert.strictEqual(x.inserts,1,'patch-back failure never retries Calendar insert');assert.strictEqual(result.ok,false);assert.match(result.message,/מזהה האירוע/);
x=run({edit:true,eventId:'EV-old'});result=x.context.BH_persistTaskThenSyncCalendar_(x.row,'T-existing');assert.deepStrictEqual(x.calls,['persist','sync','patch:T-existing:EV-old'],'edit uses the same save-first path and existing event id');
console.log('calendar save atomicity runtime assertions passed');
