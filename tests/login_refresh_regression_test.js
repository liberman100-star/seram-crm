const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const html = fs.readFileSync('index.html', 'utf8');
const wrapperStart = html.indexOf('const oldVerifyFinal=window.verifyLoginCode;');
const wrapperEnd = html.indexOf('const oldLogoutFinal=window.logout;', wrapperStart);
assert(wrapperStart >= 0 && wrapperEnd > wrapperStart, 'final verifyLoginCode wrapper exists');
const verifyWrapper = html.slice(wrapperStart, wrapperEnd);

let successHandler;
const calls = [];
const sandbox = {
  window: {
    verifyLoginCode(){ calls.push('oldVerify'); },
    location: { replace(url){ calls.push('replace:' + url); } }
  },
  loginEmail: { value: ' user@example.com ' },
  loginCode: { value: ' 123456 ' },
  loginMessage: { textContent: '' },
  localStorage: {
    setItem(k, v){ calls.push('localSet:' + k + '=' + v); },
    removeItem(k){ calls.push('localRemove:' + k); }
  },
  sessionStorage: { removeItem(k){ calls.push('sessionRemove:' + k); } },
  CRM_WEB_APP_URL: 'https://crm.example/app',
  Date: { now(){ return 424242; } },
  JSON,
  google: { script: { run: {
    withSuccessHandler(fn){ successHandler = fn; return this; },
    withFailureHandler(){ return this; },
    אימות_קוד_כניסה_Build7(email, code){ calls.push('verify:' + email + ':' + code); }
  } } },
  setToken(token){ calls.push('setToken:' + token); },
  hardRefresh(){ calls.push('hardRefresh'); }
};
sandbox.window.location = sandbox.window.location;
vm.createContext(sandbox);
vm.runInContext(verifyWrapper, sandbox);

sandbox.window.verifyLoginCode();
assert.strictEqual(sandbox.loginMessage.textContent, 'בודק קוד...', 'login status is shown while verifying');
assert.strictEqual(calls[0], 'verify:user@example.com:123456', 'login code endpoint receives trimmed credentials');

successHandler({ok:true, token:'TOKEN123', user:{email:'user@example.com'}});
assert(!calls.includes('hardRefresh'), 'successful login does not call hardRefresh');
assert.deepStrictEqual(
  calls.filter(c => /^(setToken|localRemove|sessionRemove|replace)/.test(c)),
  [
    'setToken:TOKEN123',
    'localRemove:crmLastTab',
    'sessionRemove:crmLastTab',
    'replace:https://crm.example/app?refresh=424242'
  ],
  'successful login saves token, clears stale tab state, then replaces the app URL'
);
console.log('login refresh regression assertions passed');
