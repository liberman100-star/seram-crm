const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');
const idleMarker = html.indexOf(' * Build 12 – Modern UI + home + idle logout');
const idleStart = html.lastIndexOf('/***********************', idleMarker);
const idleEndMarker = '  resetIdleTimer();\n})();';
const idleEnd = html.indexOf(idleEndMarker, idleMarker);
assert.ok(idleMarker >= 0 && idleStart >= 0 && idleEnd >= 0, 'effective idle logout block must exist');
const idleSource = html.slice(idleStart, idleEnd + idleEndMarker.length);

let nextTimer = 1;
const timers = new Map();
const cleared = [];
const listeners = {};
let token = 'active-token';
let loginMessage = '';
let serverLogouts = 0;
const storage = {removeItem() {}};
const run = {
  withSuccessHandler(fn) { this.success = fn; return this; },
  withFailureHandler(fn) { this.failure = fn; return this; },
  התנתקות_Build7() { serverLogouts++; this.success(); }
};
const sandbox = {
  DATA:{realSettings:{branding:[{'מפתח':'ניתוק אוטומטי לאחר אי־פעילות','ערך':'15'}]}},
  console,
  document:{getElementById:() => null},
  modal:{classList:{add(){}, remove(){}}},
  modalBox:{},
  localStorage:storage,
  sessionStorage:storage,
  currentToken:() => token,
  clearToken:() => { token=''; },
  showLogin:message => { loginMessage=message; },
  logout() {},
  google:{script:{run}},
  setTimeout(fn, ms) { const id=nextTimer++; timers.set(id,{fn,ms}); return id; },
  clearTimeout(id) { cleared.push(id); timers.delete(id); }
};
sandbox.window=sandbox;
sandbox.window.addEventListener=(event, fn) => { listeners[event]=fn; };
vm.createContext(sandbox);
vm.runInContext(idleSource, sandbox);

assert.strictEqual(timers.size, 2, 'idle timers must start without waiting for a user event');
assert.deepStrictEqual([...timers.values()].map(t=>t.ms).sort((a,b)=>a-b), [10,15].map(m=>m*60*1000));

const firstTimerIds=[...timers.keys()];
listeners.click();
assert.ok(firstTimerIds.every(id=>cleared.includes(id)), 'activity must clear previous timers');
assert.strictEqual(timers.size, 2, 'activity must schedule a fresh warning and logout');

const logoutTimer=[...timers.values()].find(t=>t.ms===15*60*1000);
logoutTimer.fn();
assert.strictEqual(token, '', 'inactivity logout must clear token');
assert.strictEqual(serverLogouts, 1, 'inactivity logout must invalidate the server session');
assert.match(loginMessage, /חוסר פעילות/, 'inactivity logout must show the canonical login message');

console.log('idle logout runtime assertions passed');
