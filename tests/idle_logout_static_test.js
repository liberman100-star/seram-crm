const fs = require('fs');
const html = fs.readFileSync('index.html','utf8');
const gs = fs.readFileSync('V2.GS.txt','utf8');
function assert(cond, msg){ if(!cond){ console.error('FAIL:', msg); process.exit(1); } }

assert(html.includes("const IDLE_ALLOWED_MINUTES = [15, 30, 60, 90]"), 'client allows required idle durations');
assert(/idleWarningMs\(\)\{ return Math\.max\(0, idleLimitMs\(\) - IDLE_WARNING_BEFORE_MS\); \}/.test(html), 'warning is scheduled five minutes before logout');
assert(html.includes('המערכת תתנתק בעוד 5 דקות עקב חוסר פעילות. להמשיך לעבוד?'), 'warning modal text exists');
assert(html.includes('BH_IDLE.continueWorking()') && html.includes('BH_IDLE.logoutNow()'), 'warning modal buttons exist');
assert(/function scheduleIdleTimers\(\)\{\s*clearTimeout\(idleTimer\);\s*clearTimeout\(idleWarnTimer\);\s*idleWarnTimer = setTimeout\(warnIdle, idleWarningMs\(\)\);\s*idleTimer = setTimeout\(forceLogoutByIdle, idleLimitMs\(\)\);\s*\}/.test(html), 'scheduling always replaces old timers before creating the active pair');
assert(/startSession: resetIdleTimer/.test(html), 'idle API exposes explicit session start after login/load');
assert(/renderShell_Build13_2\(d\);\s*if\(window\.BH_IDLE && typeof window\.BH_IDLE\.startSession === 'function'\) window\.BH_IDLE\.startSession\(\);/.test(html), 'load starts idle timer immediately after authenticated render');
assert(/if\(window\.BH_IDLE && typeof window\.BH_IDLE\.startSession === 'function'\) window\.BH_IDLE\.startSession\(\);/.test(html), 'render path restarts one active idle timer when shell data changes');
const warnIdleBody = html.match(/function warnIdle\(\)\{[\s\S]*?modal\.classList\.remove\('hidden'\);[\s\S]*?\n  \}/)[0];
assert(!/resetIdleTimer|clearTimeout|scheduleIdleTimers/.test(warnIdleBody), 'opening the warning modal does not reset or reschedule idle timers');
assert(/function continueWorkingFromWarning\(\)\{[\s\S]*resetIdleTimer\(\)/.test(html), 'continue working starts a full new idle period');
assert(/function performClientLogout\(message\)[\s\S]*clearToken\(\)[\s\S]*window\.DATA = \{\}[\s\S]*התנתקות_Build7\(token\)/.test(html), 'client logout clears local state and invalidates server session');
assert(/\['click','keydown','wheel','scroll','touchstart','pointerdown'\]/.test(html), 'user activity events reset idle timer');
assert(!/setInterval[\s\S]{0,80}resetIdleTimer/.test(html), 'background intervals do not reset idle timer');

assert(gs.includes('"ניתוק אוטומטי לאחר אי־פעילות", "ערך": "30"'), 'default idle setting is persisted as 30 minutes');
assert(/function BH_IDLE_validateMinutes_\(value\)[\s\S]*\[15, 30, 60, 90\]/.test(gs), 'server validates required idle durations');
assert(/function התנתקות_Build7\(token\)[\s\S]*session\["פעיל"\] = "לא"/.test(gs), 'server logout invalidates session');
assert(/function קבלת_משתמש_מסשן_Build7_\(token\)[\s\S]*s\["Token"\] === token && s\["פעיל"\] === "כן"/.test(gs), 'old invalidated token cannot authenticate');
console.log('idle logout static checks passed');
