const fs = require('fs');
const assert = require('assert');
const gs = fs.readFileSync('V2.GS.txt','utf8');
const html = fs.readFileSync('index.html','utf8');
function has(s, re, msg){ assert(re.test(s), msg); }
function not(s, re, msg){ assert(!re.test(s), msg); }

has(gs, /"משתתפי יומן"/, 'legacy participants column is preserved for backwards compatibility');
has(gs, /"אנשי קשר בפגישה"/, 'canonical meeting contact ids column is present');
has(gs, /הבטח_עמודה_אם_חסרה_\(SHEETS\.TASKS, "אנשי קשר בפגישה"\)/, 'safe installer appends canonical meeting contacts column');
has(gs, /BH_hasOwn_\(data, "אנשי קשר בפגישה"\)/, 'server distinguishes canonical meeting-contact-id field presence');
has(gs, /BH_hasOwn_\(data, "meetingContactIds"\)/, 'server accepts client meetingContactIds alias');
has(gs, /return old \? BH_splitContactIds_\(old\["אנשי קשר בפגישה"\]/, 'omitted meeting contacts preserve stored ids');
has(gs, /split\(\/\[;,\|\\n\\r\]\+\//, 'server parses historical delimiters');
has(gs, /throw new Error\("כתובת מייל משתתף יומן אינה תקינה:/, 'server still rejects invalid legacy participant emails');
has(gs, /const meetingIds = BH_splitContactIds_\(task && task\["אנשי קשר בפגישה"\]\)/, 'calendar attendees prefer selected meeting contact ids');
has(gs, /meetingIds\.length\s*\? BH_meetingContactEmailsForTask_\(task\)/, 'calendar attendees are derived from meeting contacts when ids exist');
has(gs, /: נרמול_רשימת_מיילים_Build11_\(task\["משתתפי יומן"\]/, 'legacy calendar participants remain compatible when no meeting ids exist');
has(gs, /יש להפעיל את שירות Google Calendar API \(Advanced Calendar Service\)/, 'advanced calendar missing-service error is administrator friendly');
has(gs, /Calendar\.Events\.insert\(resource, calendarId, \{ sendUpdates: "all" \}\)/, 'dedicated invitation path creates calendar events');
has(gs, /Calendar\.Events\.update\(resource, calendarId, existingId, \{ sendUpdates: "all" \}\)/, 'dedicated invitation path updates calendar events');
has(gs, /attendees: guests/, 'calendar resource contains guests');
has(gs, /const existingId = BH_calendarApiEventId_\(task\["מזהה אירוע ביומן"\]/, 'existing event id is reused');
not(gs, /שמירת_משימה[\s\S]*?syncCalendarEvent_\(row\)/, 'saveTask does not create or update calendar events');
not(gs, /שמירת_משימה[\s\S]*?מחיקת_אירוע_יומן_אם_קיים_\(calendarId\)/, 'saveTask does not delete calendar events');

has(html, /BH_normalizeCalendarParticipants/, 'client keeps legacy participant normalization helper for backwards compatibility');
has(html, /'אנשי קשר בפגישה':\(window\.selectedMeetingContactIds \? window\.selectedMeetingContactIds\(\)\.join\(','\) : ''\)/, 'client sends canonical meeting contact ids field');
has(html, /meetingContactIds:\(window\.selectedMeetingContactIds \? window\.selectedMeetingContactIds\(\)\.join\(','\) : ''\)/, 'client sends meetingContactIds alias');
has(html, /איש הקשר הראשי אינו מצורף אוטומטית/, 'UI explains primary contact is not auto-invited');
has(html, /renderPersistedMeetingContacts/, 'task card renders persisted meeting contacts');
has(html, /ללא אימייל/, 'contacts without email are shown with warning text');
has(html, /filter\(c=>!isArchivedContact\(c\)\)/, 'meeting contact candidate list excludes archived contacts');
has(html, /selectedMeetingContactIds\.includes\(id\)/, 'meeting contact dialog reloads stored selections');
not(html, /const baseSaveTask=window\.saveTask/, 'meeting contacts do not add an extra saveTask override');

const calendarEmailRefs = [...gs.matchAll(/(CALENDAR_ID|יוצר אירוע מייל|organizer|calendar owner|CalendarApp|getCalendarById).*?[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)].map(m=>m[0]);
assert.deepStrictEqual(calendarEmailRefs, [], 'no active hard-coded organizer/calendar owner emails remain');
console.log('calendar participants static assertions passed');
