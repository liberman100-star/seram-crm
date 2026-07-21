const fs = require('fs');
const html = fs.readFileSync('index.html','utf8');
const gs = fs.readFileSync('V2.GS.txt','utf8');
function assert(cond, msg){ if(!cond){ console.error('FAIL:', msg); process.exit(1); } }

assert(html.includes("const IDLE_ALLOWED_MINUTES = [15, 30, 60, 90]"), 'client allows required idle durations');
assert(/idleWarningMs\(\)\{ return Math\.max\(0, idleLimitMs\(\) - IDLE_WARNING_BEFORE_MS\); \}/.test(html), 'warning is scheduled five minutes before logout');
assert(html.includes('המערכת תתנתק בעוד 5 דקות עקב חוסר פעילות. להמשיך לעבוד?'), 'warning modal text exists');
assert(html.includes('BH_IDLE.continueWorking()') && html.includes('BH_IDLE.logoutNow()'), 'warning modal buttons exist');
assert(/hideLogin\(\);[\s\S]*?render\(DATA\);[\s\S]*?BH_IDLE\.start\(\)/.test(html), 'fresh authenticated full load starts idle timers without user interaction');
assert(/function refreshCore\(after\)[\s\S]*?BH_IDLE\.restart\(\)/.test(html), 'core refresh restarts idle timers with current settings data');
assert(/function saveBranding\(\)[\s\S]*?refreshCore\(\(\)=>\{[\s\S]*?BH_IDLE\.restart\(\)/.test(html), 'branding settings save refreshes data and restarts idle timers');
assert(/function showLogin\(msg=''\)\{[\s\S]*?BH_IDLE\.stop\(\)/.test(html), 'login screen stops idle timers');
const warnIdleBody = html.match(/function warnIdle\(\)\{[\s\S]*?modal\.classList\.remove\('hidden'\);[\s\S]*?\n  \}/)[0];
assert(!/resetIdleTimer|clearTimeout|scheduleIdleTimers/.test(warnIdleBody), 'opening the warning modal does not reset or reschedule idle timers');
assert(/function continueWorkingFromWarning\(\)\{[\s\S]*resetIdleTimer\(\)/.test(html), 'continue working starts a full new idle period');
assert(/function performClientLogout\(message\)[\s\S]*clearToken\(\)[\s\S]*window\.DATA = \{\}[\s\S]*התנתקות_Build7\(token\)/.test(html), 'client logout clears local state and invalidates server session');
assert(/start: startIdleTimers,[\s\S]*restart: startIdleTimers,[\s\S]*stop: stopIdleTimers/.test(html), 'idle API exposes start restart and stop helpers');
assert(/\['click','keydown','wheel','scroll','touchstart','pointerdown'\]/.test(html), 'user activity events reset idle timer');
assert(!/setInterval[\s\S]{0,80}resetIdleTimer/.test(html), 'background intervals do not reset idle timer');

assert(gs.includes('"ניתוק אוטומטי לאחר אי־פעילות", "ערך": "30"'), 'default idle setting is persisted as 30 minutes');
assert(/function BH_IDLE_validateMinutes_\(value\)[\s\S]*\[15, 30, 60, 90\]/.test(gs), 'server validates required idle durations');
assert(/function התנתקות_Build7\(token\)[\s\S]*session\["פעיל"\] = "לא"/.test(gs), 'server logout invalidates session');
assert(/function קבלת_משתמש_מסשן_Build7_\(token\)[\s\S]*s\["Token"\] === token && s\["פעיל"\] === "כן"/.test(gs), 'old invalidated token cannot authenticate');
console.log('idle logout static checks passed');
