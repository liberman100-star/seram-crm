const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const html = fs.readFileSync('index.html', 'utf8');
const verifyStart = html.indexOf('function verifyLoginCode(){');
const verifyEnd = html.indexOf('function backToEmailLogin', verifyStart);
assert(verifyStart >= 0 && verifyEnd > verifyStart, 'verifyLoginCode function exists');
assert.strictEqual((html.match(/function verifyLoginCode\(/g) || []).length, 1, 'only one verifyLoginCode function declaration exists');
assert(!/window\.verifyLoginCode\s*=/.test(html), 'verifyLoginCode is not replaced by a later wrapper');
assert(!/oldVerify(LoginCode|Final)/.test(html), 'no stale verifyLoginCode wrapper remains');
const verifyCode = html.slice(verifyStart, verifyEnd);

let successHandler;
const calls = [];
const sandbox = {
  window: { location: { replace(url){ calls.push('replace:' + url); } } },
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
vm.createContext(sandbox);
vm.runInContext(verifyCode, sandbox);

sandbox.verifyLoginCode();
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
