const fs = require('fs');
const vm = require('vm');

const server = fs.readFileSync('V2.GS.txt', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(
  /function קבלת_נתוני_ליבה_Build13\(token\) \{[\s\S]*?קבלת_נתונים_Build7\(token, \{includeTaskNotes:false\}\)/.test(server),
  'the full-core opening route must explicitly exclude task notes'
);
assert(
  /options\.includeTaskNotes === false \? \[\] : readSheet_\(SHEETS\.TASK_NOTES\)/.test(server),
  'the task-notes sheet read must be skipped by opening requests'
);
assert(
  /openTaskCard = function\(id\)[\s\S]*?task-card-loading[\s\S]*?טוען הערות[\s\S]*?קבלת_כרטיס_משימה_Build10/.test(html),
  'opening a task card must show loading and request its card data'
);

const assignment = html.match(/openTaskCard = function\(id\)\{[\s\S]*?\n\}/);
assert(assignment, 'active task-card loader was not found');
let successHandler;
let requested;
const modalBox = {className: '', innerHTML: ''};
const modal = {classList: {remove() {}}};
const runner = {
  withSuccessHandler(fn) { successHandler = fn; return this; },
  withFailureHandler() { return this; },
  קבלת_כרטיס_משימה_Build10(payload) { requested = payload; }
};
const context = {
  modalBox, modal, currentToken: () => 'token', renderTaskCard() {}, closeM() {}, alert() {},
  google: {script: {run: runner}}
};
vm.runInNewContext(`${assignment[0]}; openTaskCard('T-1');`, context);
assert(modalBox.innerHTML.includes('טוען הערות'), 'loading must be visible while the request is pending');
assert(!modalBox.innerHTML.includes('אין הערות'), 'empty state must not be visible before loading completes');
assert(requested && requested.id === 'T-1', 'opening the card must request the selected task');
assert(typeof successHandler === 'function', 'the card response must have a success handler');

console.log('task notes lazy-load checks passed');
