const fs = require('fs');
const assert = require('assert');
const html = fs.readFileSync('index.html', 'utf8');

assert.match(html, /@keyframes bh-ui-spin\{to\{transform:rotate\(360deg\)\}\}/);
assert.match(html, /\.bh-ui-spinner\{[^}]*animation:bh-ui-spin/);
assert.match(html, /prefers-reduced-motion:reduce/);
assert.equal((html.match(/@keyframes bh-ui-spin/g) || []).length, 1);
assert.match(html, /const DELAY_MS = 175/);
assert.match(html, /WeakMap\(\)/);
assert.match(html, /button\.innerHTML=state\.html/);
assert.match(html, /button\.disabled=state\.disabled/);
assert.match(html, /button\.removeAttribute\('aria-busy'\)/);
assert.doesNotMatch(html.match(/\.bh-ui-spinner\{[^}]+\}/)[0], /height:\s*(?:[2-9]\d|1\d\d)px/);
assert.doesNotMatch(html, /bh-ui-spinner[^\n]*(?:<img|emoji)/i);

for (const text of ['שומר...', 'יוצר...', 'מעדכן...', 'מוחק...', 'מארכב...', 'משחזר...', 'טוען...', 'שולח...', 'מתחבר...', 'מתנתק...', 'מסמן...', 'מחזיר לפעיל...']) {
  assert(html.includes(text), `missing busy copy: ${text}`);
}
assert.match(html, /BH_saveTaskEditLocal[\s\S]*?patch\(response\)/);
assert.match(html, /applyTaskStatusMutationPatch[\s\S]*?if\(patched\)/);
assert.match(html, /if\(patched\)\{[\s\S]*?return;[\s\S]*?fallback/);
assert.doesNotMatch(html, /\.github\/workflows/);
console.log('busy indicator static tests passed');
