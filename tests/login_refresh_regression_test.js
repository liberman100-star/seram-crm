const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync('index.html','utf8');
const start=html.indexOf('let CRM_LOGIN_VERIFY_IN_FLIGHT');
const end=html.indexOf('function backToEmailLogin',start);
assert(start>=0&&end>start,'login verification implementation exists');
const code=html.slice(start,end);
let successHandler,failureHandler;const calls=[];
const sandbox={loginEmail:{value:' user@example.com '},loginCode:{value:' 123456 '},loginMessage:{textContent:''},
 localStorage:{setItem(k,v){calls.push('localSet:'+k+'='+v)},removeItem(k){calls.push('localRemove:'+k)}},sessionStorage:{removeItem(k){calls.push('sessionRemove:'+k)}},JSON,
 google:{script:{run:{withSuccessHandler(fn){successHandler=fn;return this},withFailureHandler(fn){failureHandler=fn;return this},אימות_קוד_כניסה_Build7(e,c){calls.push('verify:'+e+':'+c)}}}},
 setToken(t){calls.push('setToken:'+t)},hideLogin(){calls.push('hideLogin')},showLogin(m){calls.push('showLogin:'+m)},load(force){calls.push('load:'+force)},
 window:{location:{replace(){calls.push('replace')},open(){calls.push('open')} }},hardRefresh(){calls.push('hardRefresh')},
 BH_UI_withBusy(_b,_t,op){op(cb=>(...args)=>cb&&cb(...args))}};
vm.createContext(sandbox);vm.runInContext(code,sandbox);
sandbox.verifyLoginCode();sandbox.verifyLoginCode();
assert.equal(calls.filter(x=>x.startsWith('verify:')).length,1,'double click starts one verification');
successHandler({ok:true,token:'TOKEN123',user:{email:'user@example.com'}});
assert.equal(calls.filter(x=>x==='load:true').length,1,'valid login triggers exactly one startup load');
assert.equal(calls.filter(x=>['replace','open','hardRefresh'].includes(x)).length,0,'valid login performs no second navigation');
assert(calls.includes('setToken:TOKEN123')&&calls.includes('localSet:CRM_USER_INFO={"email":"user@example.com"}'),'token and user info are stored');
assert(calls.includes('localRemove:crmLastTab')&&calls.includes('sessionRemove:crmLastTab'),'tab state is cleared');
assert(calls.indexOf('hideLogin')<calls.indexOf('load:true'),'login transitions before canonical startup');
console.log('login startup regression assertions passed');
