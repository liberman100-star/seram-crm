const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const html = fs.readFileSync('index.html', 'utf8');
const source = html.match(/<script id="BH_UI_BUSY_HELPER">([\s\S]*?)<\/script>/)[1];
let now = 0;
let nextTimer = 1;
const timers = new Map();
function advance(ms) {
  now += ms;
  [...timers].forEach(([id, timer]) => {
    if (timer.at <= now) { timers.delete(id); timer.fn(); }
  });
}
class ClassList {
  constructor() { this.values = new Set(); }
  add(value) { this.values.add(value); }
  remove(value) { this.values.delete(value); }
  contains(value) { return this.values.has(value); }
}
class Button {
  constructor(htmlText = 'שמור') {
    this.nodeType = 1;
    this.tagName = 'BUTTON';
    this.innerHTML = htmlText;
    this.disabled = false;
    this.isConnected = true;
    this.attrs = new Map();
    this.classList = new ClassList();
    this.busyText = '';
  }
  getAttribute(name) { return this.attrs.has(name) ? this.attrs.get(name) : null; }
  setAttribute(name, value) { this.attrs.set(name, value); }
  removeAttribute(name) { this.attrs.delete(name); }
  querySelector() { return {set textContent(value) { this.value = value; }}; }
}
const document = {activeElement: null};
const context = {
  window: {}, document, alert() {},
  setTimeout(fn, delay) { const id = nextTimer++; timers.set(id, {fn, at: now + delay}); return id; },
  clearTimeout(id) { timers.delete(id); }
};
vm.runInNewContext(source, context);
const {BH_UI_setBusy, BH_UI_withBusy, __BH_UI_BUSY_TEST__} = context.window;
assert.equal(__BH_UI_BUSY_TEST__.delay, 175);

const fast = new Button('<b>שמור</b>');
document.activeElement = fast;
const clearFast = BH_UI_setBusy(null, 'שומר...');
assert.equal(fast.innerHTML, '<b>שמור</b>', 'spinner is delayed');
assert.equal(fast.disabled, true);
assert.equal(fast.getAttribute('aria-busy'), 'true');
advance(150);
clearFast();
advance(50);
assert.equal(fast.innerHTML, '<b>שמור</b>', 'fast operation never flashes');
assert.equal(fast.disabled, false);
assert.equal(fast.getAttribute('aria-busy'), null);
assert.equal(timers.size, 0, 'fast timer is cleared');

const slow = new Button('עדכן');
document.activeElement = slow;
const clearSlow = BH_UI_setBusy(null, 'מעדכן...');
advance(175);
assert(slow.innerHTML.includes('bh-ui-spinner'), 'slow operation displays spinner');
clearSlow();
assert.equal(slow.innerHTML, 'עדכן');
assert.equal(slow.disabled, false);
assert.equal(slow.getAttribute('aria-busy'), null);

const originallyDisabled = new Button('נעול');
originallyDisabled.disabled = true;
const first = BH_UI_setBusy(originallyDisabled, 'שומר...');
const second = BH_UI_setBusy(originallyDisabled, 'שומר...');
advance(175);
assert.equal((originallyDisabled.innerHTML.match(/bh-ui-spinner/g) || []).length, 1);
first();
assert(originallyDisabled.innerHTML.includes('bh-ui-spinner'), 'duplicate owner remains busy');
second(); second();
assert.equal(originallyDisabled.innerHTML, 'נעול');
assert.equal(originallyDisabled.disabled, true, 'original disabled state restored');
assert.equal(timers.size, 0, 'no timers leak');

for (const outcome of ['success', 'failure', 'session-expired', 'fallback', 'exception']) {
  const button = new Button(outcome);
  let success;
  try {
    BH_UI_withBusy(button, 'טוען...', finish => {
      success = finish(() => { if (outcome === 'exception') throw new Error('handler'); });
      if (outcome !== 'success' && outcome !== 'exception') success = finish();
      if (outcome === 'exception') success();
    });
  } catch (error) { assert.equal(outcome, 'exception'); }
  if (outcome !== 'exception') success();
  assert.equal(button.getAttribute('aria-busy'), null, `${outcome} clears aria`);
  assert.equal(button.innerHTML, outcome, `${outcome} restores content`);
}
console.log('busy indicator runtime tests passed');
