const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const html = fs.readFileSync('index.html','utf8');
assert(/window\.openContactCardById = function\(contactId\)/.test(html), 'card opener is assigned to window');
assert(/\.כרטיס_איש_קשר\(\{id:id, authToken:currentToken\(\), token:currentToken\(\)\}\)/.test(html), 'card opener calls authenticated contact-card endpoint');
assert(!/function openContactCardById\(contactId\)[\s\S]*?openContactCard\(contact\)/.test(html), 'card opener no longer passes raw contact to render path');
assert(/const inviteButton = canInviteContact\(c\)/.test(html), 'renderContactCard uses the canonical invitation helper');
assert(!/safeCanInviteContact/.test(html), 'canInviteContact is the only invitation eligibility helper');
assert(/window\.canInviteContact = canInviteContact;/.test(html), 'canonical invitation helper is exposed on window');
assert(/window\.__contactInvitationSending = __contactInvitationSending;/.test(html), 'invitation sending state is exposed on window');

assert(/id="addAssignmentDomainBtn"[^>]*>הוסף תחום שיוך/.test(html), 'contact editor shows add-assignment-domain button');
assert(!/id="cAdditionalAssignmentDomains"[^>]*multiple/.test(html), 'contact editor no longer renders additional domains as an open multi-select');
assert(/function addAdditionalAssignmentDomain\(value\)[\s\S]*values\.indexOf\(value\) === -1/.test(html), 'additional assignment domain add path blocks duplicates');
assert(/assignmentDomainChoices\(current\.concat\(\[central\]\)\)/.test(html), 'additional assignment domain picker excludes central domain');
assert(/<option value="">ללא<\/option>/.test(html), 'contact project link default is none');
assert(!/<option value="">הכל<\/option>/.test(html), 'contact project link default is not all');
assert(/function normalizeContactProjectLinkValue\(value\)[\s\S]*v === 'הכל' \? '' : v/.test(html), 'legacy all project-link value normalizes to none');

const start = html.indexOf('function isValidStoredContactEmail(email)');
const end = html.indexOf('window.openContact = function', start);
assert(start > -1 && end > start, 'contact runtime block found');
const code = html.slice(start, end);

let endpointArgs;
let rendered;
let opened;
const stored = {'מזהה איש קשר':'C1', 'שם מלא':'Test Contact'};
const payload = {contact: stored, links: [{projectId:'P1'}], tasks: [{taskId:'T1'}], readOnly: false};
const sandbox = {
  window: {},
  DATA: {contacts:[stored], currentUser:{role:'משתמש'}},
  alert: (msg)=>{ throw new Error('unexpected alert: '+msg); },
  currentToken: ()=>'TOKEN1',
  renderContactCard: (d)=>{ rendered = d; },
  openContact: (c)=>{ opened = c; },
  canEdit: ()=>true,
  canCreate: ()=>true,
  console,
  google: { script: { run: {
    withSuccessHandler(fn){ this._success = fn; return this; },
    withFailureHandler(fn){ this._failure = fn; return this; },
    כרטיס_איש_קשר(arg){ endpointArgs = arg; return this; }
  } } }
};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(code, sandbox);
assert.strictEqual(typeof sandbox.window.openContactCardById, 'function', 'card opener exists at runtime on window');
assert.strictEqual(typeof sandbox.window.openContactEditorById, 'function', 'editor opener exists at runtime on window');
assert.strictEqual(typeof sandbox.window.canInviteContact, 'function', 'canInviteContact exists at runtime on window');
assert.strictEqual(sandbox.window.openContactCardById('C1'), true, 'card opener returns true for valid id');
assert.strictEqual(JSON.stringify(endpointArgs), JSON.stringify({id:'C1', authToken:'TOKEN1', token:'TOKEN1'}), 'server endpoint invoked with id and auth token');
sandbox.google.script.run._success(payload);
assert.strictEqual(rendered, payload, 'renderContactCard receives full payload');
assert.strictEqual(sandbox.window.openContactEditorById('C1'), true, 'editor opener returns true');
assert.strictEqual(opened, stored, 'openContact receives stored object');

function buildRenderSandbox({contact, user, canCreateValue = true, helperMissing = false} = {}){
  const inviteMarker = html.indexOf('const inviteButton = canInviteContact(c)');
  const renderStart = html.lastIndexOf('renderContactCard = function(d){', inviteMarker);
  const renderEnd = html.indexOf('</script>', renderStart);
  assert(renderStart > -1 && renderEnd > renderStart, 'renderContactCard block found');
  const renderCode = html.slice(renderStart, renderEnd);
  const sb = {
    window: {}, DATA: {currentUser:user || {role:'משתמש'}}, console,
    modalBox: {className:'', innerHTML:''}, modal: {classList:{remove(){}}},
    canEdit: ()=>true, canDelete: ()=>true, canCreate: ()=>canCreateValue,
    esc: v=>String(v == null ? '' : v).replace(/"/g, '&quot;'),
    val: v=>String(v == null ? '' : v),
    smallTable: ()=>'TABLE', linkActionsForContact: ()=>'LINK',
    openContact(){}, delContact(){}, closeM(){}, openTask(){}, openTaskCard(){},
    google: { script: { run: {} } }, currentToken: ()=>'TOKEN1'
  };
  sb.window = sb;
  vm.createContext(sb);
  vm.runInContext(code, sb);
  if(helperMissing) sb.canCreate = function(){ throw new Error('permission helper unavailable'); };
  vm.runInContext(renderCode, sb);
  sb.renderContactCard({contact, links:[], tasks:[], readOnly:false});
  return sb;
}

const eligible = {'מזהה איש קשר':'C2', 'שם מלא':'Eligible', 'אימייל':'e@example.com', 'כניסה ראשונה למערכת':''};
assert.doesNotThrow(()=>buildRenderSandbox({contact:eligible}), 'renderContactCard opens without ReferenceError');
assert(/contactInviteBtn/.test(buildRenderSandbox({contact:eligible}).modalBox.innerHTML), 'eligible saved contact shows invitation');
assert(!/contactInviteBtn/.test(buildRenderSandbox({contact:{...eligible, 'אימייל':''}}).modalBox.innerHTML), 'contact without email does not show invitation');
assert(!/contactInviteBtn/.test(buildRenderSandbox({contact:{...eligible, 'כניסה ראשונה למערכת':'2026-07-01'}, user:{role:'משתמש'}}).modalBox.innerHTML), 'ordinary user after first login does not see invitation');
assert(/contactInviteBtn/.test(buildRenderSandbox({contact:{...eligible, 'כניסה ראשונה למערכת':'2026-07-01'}, user:{role:'מנהל ראשי'}}).modalBox.innerHTML), 'main admin after first login may see invitation');
assert(/contactInviteBtn/.test(buildRenderSandbox({contact:{...eligible, 'כניסה ראשונה למערכת':'2026-07-01'}, user:{isOwner:true, role:'משתמש'}}).modalBox.innerHTML), 'owner after first login may see invitation');
assert.doesNotThrow(()=>buildRenderSandbox({contact:eligible, helperMissing:true}), 'invitation eligibility failure cannot crash the whole card');
assert(!/contactInviteBtn/.test(buildRenderSandbox({contact:eligible, helperMissing:true}).modalBox.innerHTML), 'invitation eligibility failure hides invitation section');

let inviteArgs;
const sendSandbox = {window:{}, DATA:{currentUser:{role:'משתמש'}}, console, currentToken:()=>'TOKEN1', document:{getElementById:()=>({disabled:false,textContent:''})}, alert(){}, refreshCore(){}, openContactCardById(){}, canCreate:()=>true, google:{script:{run:{withSuccessHandler(){return this}, withFailureHandler(){return this}, שליחת_הזמנה_לאיש_קשר(arg){inviteArgs = arg; return this;}}}}};
sendSandbox.window = sendSandbox;
vm.createContext(sendSandbox);
vm.runInContext(code, sendSandbox);
sendSandbox.window.sendContactInvitation('C2');
assert.strictEqual(JSON.stringify(inviteArgs), JSON.stringify({authToken:'TOKEN1', contactId:'C2'}), 'send button still calls שליחת_הזמנה_לאיש_קשר');

console.log('contact runtime assertions passed');
