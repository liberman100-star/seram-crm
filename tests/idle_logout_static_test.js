const fs = require('fs');
const html = fs.readFileSync('index.html','utf8');
const gs = fs.readFileSync('V2.GS.txt','utf8');
function assert(cond, msg){ if(!cond){ console.error('FAIL:', msg); process.exit(1); } }

assert(html.includes("const IDLE_ALLOWED_MINUTES = [15, 30, 60, 90]"), 'client allows required idle durations');
assert(/idleWarningMs\(\)\{ return Math\.max\(0, idleLimitMs\(\) - IDLE_WARNING_BEFORE_MS\); \}/.test(html), 'warning is scheduled five minutes before logout');
assert(html.includes('המערכת תתנתק בעוד 5 דקות עקב חוסר פעילות. להמשיך לעבוד?'), 'warning modal text exists');
assert(html.includes('BH_IDLE.continueWorking()') && html.includes('BH_IDLE.logoutNow()'), 'warning modal buttons exist');

assert(/function startIdleTimersAfterAuthenticatedLoad\(\)\{[\s\S]*resetIdleTimer\(\)/.test(html), 'authenticated loads explicitly start idle timers');
assert(html.includes('startAfterAuthenticatedLoad: startIdleTimersAfterAuthenticatedLoad'), 'idle API exposes authenticated-load scheduler');
assert(new RegExp("hideLogin\\(\\);\\n\\s*render\\(DATA\\);\\n\\s*if\\(window\\.BH_IDLE && typeof window\\.BH_IDLE\\.startAfterAuthenticatedLoad === 'function'\\) window\\.BH_IDLE\\.startAfterAuthenticatedLoad\\(\\);").test(html), 'full authenticated load starts timers without activity');
assert(new RegExp("renderShell_Build13_2\\(d\\);\\n\\s*if\\(window\\.BH_IDLE && typeof window\\.BH_IDLE\\.startAfterAuthenticatedLoad === 'function'\\) window\\.BH_IDLE\\.startAfterAuthenticatedLoad\\(\\);").test(html), 'authenticated refresh starts timers without activity');
assert(/function saveBranding\(\)\{[\s\S]*refreshCore\(\(\)=>\{[\s\S]*restartAfterSettingsSave/.test(html), 'branding save reloads data and restarts timers');
assert(/<select id="brandIdleLogoutMinutes">\$\{\[15,30,60,90\]\.map/.test(html), 'settings UI renders exactly the allowed idle durations');
assert(/שמירת_מיתוג_Build4_3\(\{[\s\S]*idleLogoutMinutes:brandIdleLogoutMinutes\.value/.test(html), 'settings UI posts selected idle duration to the existing branding save');
assert(new RegExp("function showLogin\\(msg=''\\)\\{\\n\\s*if\\(window\\.BH_IDLE && typeof window\\.BH_IDLE\\.stop === 'function'\\) window\\.BH_IDLE\\.stop\\(\\);").test(html), 'login screen stops idle timers after logout or expired sessions');

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
