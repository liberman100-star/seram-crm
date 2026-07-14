const fs = require('fs');
const assert = require('assert');
const gs = fs.readFileSync('V2.GS.txt','utf8');
const html = fs.readFileSync('index.html','utf8');
function has(s, re, msg){ assert(re.test(s), msg); }

has(gs, /"משתתפי יומן"/, 'canonical participants column is present');
has(gs, /הבטח_עמודה_אם_חסרה_\(SHEETS\.TASKS, "משתתפי יומן"\)/, 'safe installer appends canonical column');
has(gs, /BH_hasOwn_\(data, "משתתפי יומן"\)/, 'server distinguishes canonical field presence');
has(gs, /BH_hasOwn_\(data, "calendarGuests"\)/, 'server distinguishes client field presence');
has(gs, /return old \? נרמול_רשימת_מיילים_Build11_\(old\["משתתפי יומן"\]/, 'omitted field preserves stored participants');
has(gs, /split\(\/\[;,\|\\n\\r\]\+\//, 'server parses historical delimiters');
has(gs, /throw new Error\("כתובת מייל משתתף יומן אינה תקינה:/, 'server rejects invalid participant emails');
has(gs, /out\.push\(e\)/, 'server stores original trimmed email casing while comparing case-insensitively');
has(gs, /יש להפעיל את שירות Google Calendar API \(Advanced Calendar Service\)/, 'advanced calendar missing-service error is administrator friendly');
has(gs, /Calendar\.Events\.insert\(resource, calendarId, \{ sendUpdates: "all" \}\)/, 'new calendar events send invitations to all guests');
has(gs, /Calendar\.Events\.update\(resource, calendarId, existingId, \{ sendUpdates: "all" \}\)/, 'existing calendar events send updates to all guests');
has(gs, /attendees: guests/, 'calendar resource contains guests');
has(gs, /const existingId = BH_calendarApiEventId_\(task\["מזהה אירוע ביומן"\]/, 'existing event id is reused');
has(gs, /upsert_ללא_אימות_\(SHEETS\.TASKS, "מזהה משימה", id, row\);[\s\S]*?if \(row\["כניסה ליומן"\]/, 'task row is persisted before calendar sync');
has(html, /BH_normalizeCalendarParticipants/, 'client normalizes selected participants before save');
has(html, /'משתתפי יומן':normalized/, 'client sends canonical participants field');
has(html, /split\(\/\[;,\|\\n\\r\]\+\//, 'client parses historical delimiters');
has(html, /משתתף חיצוני\/קיים/, 'client preserves external stored emails as options');
has(html, /filter\(c=>!isArchived\(c\)\)/, 'candidate list excludes archived contacts');
has(html, /seen\[key\]/, 'candidate list deduplicates emails');
has(html, /out\.push\(e\)/, 'client stores original trimmed selected email casing while comparing case-insensitively');

const calendarEmailRefs = [...gs.matchAll(/(CALENDAR_ID|יוצר אירוע מייל|organizer|calendar owner|CalendarApp|getCalendarById).*?[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)].map(m=>m[0]);
assert.deepStrictEqual(calendarEmailRefs, [], 'no active hard-coded organizer/calendar owner emails remain');
console.log('calendar participants static assertions passed');
