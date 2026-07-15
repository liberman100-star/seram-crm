const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const html = fs.readFileSync('index.html','utf8');

assert(/window\.openContactCardById = function\(contactId\)/.test(html), 'card opener is assigned to window');
assert(/\.כרטיס_איש_קשר\(\{id:id, authToken:currentToken\(\), token:currentToken\(\)\}\)/.test(html), 'card opener calls authenticated contact-card endpoint');
assert(!/function openContactCardById\(contactId\)[\s\S]*?openContactCard\(contact\)/.test(html), 'card opener no longer passes raw contact to render path');
assert(/function canInviteContact\(c\)/.test(html), 'canonical canInviteContact helper exists');
assert(!/safeCanInviteContact/.test(html), 'renderContactCard does not reference a renamed helper');
assert(/typeof canInviteContact === 'function' && canInviteContact\(c\)/.test(html), 'renderContactCard guards the canonical helper before calling it');
assert(/window\.__contactInvitationSending = __contactInvitationSending;/.test(html), 'invitation sending state remains available on window');

const helperStart = html.indexOf('function isValidStoredContactEmail(email)');
const renderStart = html.indexOf('renderContactCard = function(d){', helperStart);
const renderEnd = html.indexOf('</script>', renderStart);
const runtimeStart = html.indexOf('const __contactInvitationSending = window.__contactInvitationSending || {};');
const runtimeEnd = html.indexOf('window.openContact = function', runtimeStart);
assert(helperStart > -1 && renderStart > helperStart, 'canInviteContact is defined before renderContactCard');
assert(renderEnd > renderStart, 'renderContactCard block found');
assert(runtimeStart > renderEnd && runtimeEnd > runtimeStart, 'contact runtime block found');

const helperCode = html.slice(helperStart, renderStart);
const renderCode = html.slice(renderStart, renderEnd);
const runtimeCode = html.slice(runtimeStart, runtimeEnd);

function createBaseSandbox({user, canCreateValue = true} = {}){
  const stored = {'מזהה איש קשר':'C1', 'שם מלא':'Test Contact'};
  const sb = {
    window: {}, DATA: {contacts:[stored], currentUser:user || {role:'משתמש'}}, console,
    alert: (msg)=>{ throw new Error('unexpected alert: '+msg); },
    currentToken: ()=>'TOKEN1', canEdit: ()=>true, canDelete: ()=>true, canCreate: ()=>canCreateValue,
    esc: v=>String(v == null ? '' : v).replace(/"/g, '&quot;'),
    val: v=>String(v == null ? '' : v),
    modalBox: {className:'', innerHTML:''}, modal: {classList:{remove(){}}},
    smallTable: ()=>'TABLE', linkActionsForContact: ()=>'LINK',
    openContact(c){ sb.opened = c; }, delContact(){}, closeM(){}, openTask(){}, openTaskCard(){},
    document:{getElementById:()=>({disabled:false,textContent:''})}, refreshCore(){}, openContactCardById(){},
    google: { script: { run: {
      withSuccessHandler(fn){ this._success = fn; return this; },
      withFailureHandler(fn){ this._failure = fn; return this; },
      כרטיס_איש_קשר(arg){ sb.endpointArgs = arg; return this; },
      שליחת_הזמנה_לאיש_קשר(arg){ sb.inviteArgs = arg; return this; }
    } } }
  };
  sb.window = sb;
  vm.createContext(sb);
  return sb;
}

function runHelpersAndRuntime(sb){
  vm.runInContext(helperCode, sb);
  assert.strictEqual(vm.runInContext('typeof canInviteContact', sb), 'function', 'canInviteContact exists before renderContactCard executes');
  vm.runInContext(runtimeCode, sb);
}

function renderContact({contact, user, canCreateValue = true, includeHelper = true} = {}){
  const sb = createBaseSandbox({user, canCreateValue});
  if(includeHelper) runHelpersAndRuntime(sb);
  vm.runInContext(renderCode, sb);
  sb.renderContactCard({contact, links:[], tasks:[], readOnly:false});
  return sb;
}

const eligible = {'מזהה איש קשר':'C2', 'שם מלא':'Eligible', 'אימייל':'e@example.com', 'כניסה ראשונה למערכת':''};
assert.doesNotThrow(()=>renderContact({contact:eligible}), 'renderContactCard opens without ReferenceError');
assert(/contactInviteBtn/.test(renderContact({contact:eligible}).modalBox.innerHTML), 'eligible saved contact shows invitation');
assert(!/contactInviteBtn/.test(renderContact({contact:{...eligible, 'אימייל':''}}).modalBox.innerHTML), 'contact without email does not show invitation');
assert(!/contactInviteBtn/.test(renderContact({contact:{...eligible, 'כניסה ראשונה למערכת':'2026-07-01'}, user:{role:'משתמש'}}).modalBox.innerHTML), 'ordinary user after first login does not see invitation');
assert(/contactInviteBtn/.test(renderContact({contact:{...eligible, 'כניסה ראשונה למערכת':'2026-07-01'}, user:{role:'מנהל ראשי'}}).modalBox.innerHTML), 'main admin after first login may see invitation');
assert(/contactInviteBtn/.test(renderContact({contact:{...eligible, 'כניסה ראשונה למערכת':'2026-07-01'}, user:{isOwner:true, role:'משתמש'}}).modalBox.innerHTML), 'owner after first login may see invitation');
assert.doesNotThrow(()=>renderContact({contact:eligible, includeHelper:false}), 'missing invitation helper cannot crash the whole card');
assert(!/contactInviteBtn/.test(renderContact({contact:eligible, includeHelper:false}).modalBox.innerHTML), 'missing invitation helper hides invitation section');

const openerSandbox = createBaseSandbox();
openerSandbox.renderContactCard = d=>{ openerSandbox.rendered = d; };
runHelpersAndRuntime(openerSandbox);
assert.strictEqual(typeof openerSandbox.window.openContactCardById, 'function', 'card opener exists at runtime on window');
assert.strictEqual(typeof openerSandbox.window.openContactEditorById, 'function', 'editor opener exists at runtime on window');
assert.strictEqual(openerSandbox.window.openContactCardById('C1'), true, 'card opener returns true for valid id');
assert.strictEqual(JSON.stringify(openerSandbox.endpointArgs), JSON.stringify({id:'C1', authToken:'TOKEN1', token:'TOKEN1'}), 'server endpoint invoked with id and auth token');
const payload = {contact: openerSandbox.DATA.contacts[0], links: [{projectId:'P1'}], tasks: [{taskId:'T1'}], readOnly: false};
openerSandbox.google.script.run._success(payload);
assert.strictEqual(openerSandbox.rendered, payload, 'renderContactCard receives full payload');
assert.strictEqual(openerSandbox.window.openContactEditorById('C1'), true, 'editor opener returns true');
assert.strictEqual(openerSandbox.opened, openerSandbox.DATA.contacts[0], 'openContact receives stored object');

const sendSandbox = createBaseSandbox();
runHelpersAndRuntime(sendSandbox);
sendSandbox.window.sendContactInvitation('C2');
assert.strictEqual(JSON.stringify(sendSandbox.inviteArgs), JSON.stringify({authToken:'TOKEN1', contactId:'C2'}), 'send button still calls שליחת_הזמנה_לאיש_קשר');

console.log('contact runtime assertions passed');
