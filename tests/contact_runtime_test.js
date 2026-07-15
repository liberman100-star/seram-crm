const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const html = fs.readFileSync('index.html','utf8');
assert(/window\.openContactCardById = function\(contactId\)/.test(html), 'card opener is assigned to window');
assert(/\.כרטיס_איש_קשר\(\{id:id, authToken:currentToken\(\), token:currentToken\(\)\}\)/.test(html), 'card opener calls authenticated contact-card endpoint');
assert(!/function openContactCardById\(contactId\)[\s\S]*?openContactCard\(contact\)/.test(html), 'card opener no longer passes raw contact to render path');

const start = html.indexOf('function findStoredContactById(contactId)');
const end = html.indexOf('function canInviteContact', start);
assert(start > -1 && end > start, 'contact runtime block found');
const code = html.slice(start, end);

let endpointArgs;
let success;
let failure;
let rendered;
let opened;
const stored = {'מזהה איש קשר':'C1', 'שם מלא':'Test Contact'};
const payload = {contact: stored, links: [{projectId:'P1'}], tasks: [{taskId:'T1'}], readOnly: false};
const sandbox = {
  window: {},
  DATA: {contacts:[stored]},
  alert: (msg)=>{ throw new Error('unexpected alert: '+msg); },
  currentToken: ()=>'TOKEN1',
  renderContactCard: (d)=>{ rendered = d; },
  openContact: (c)=>{ opened = c; },
  canEdit: ()=>true,
  google: { script: { run: {
    withSuccessHandler(fn){ success = fn; return this; },
    withFailureHandler(fn){ failure = fn; return this; },
    כרטיס_איש_קשר(arg){ endpointArgs = arg; return this; }
  } } }
};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(code, sandbox);
assert.strictEqual(typeof sandbox.window.openContactCardById, 'function', 'card opener exists at runtime on window');
assert.strictEqual(typeof sandbox.window.openContactEditorById, 'function', 'editor opener exists at runtime on window');
assert.strictEqual(sandbox.window.openContactCardById('C1'), true, 'card opener returns true for valid id');
assert.strictEqual(JSON.stringify(endpointArgs), JSON.stringify({id:'C1', authToken:'TOKEN1', token:'TOKEN1'}), 'server endpoint invoked with id and auth token');
success(payload);
assert.strictEqual(rendered, payload, 'renderContactCard receives full payload');
assert.strictEqual(sandbox.window.openContactEditorById('C1'), true, 'editor opener returns true');
assert.strictEqual(opened, stored, 'openContact receives stored object');
console.log('contact runtime assertions passed');
