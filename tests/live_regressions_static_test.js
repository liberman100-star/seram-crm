const fs = require('fs');
const assert = require('assert');
const gs = fs.readFileSync('V2.GS.txt','utf8');
const html = fs.readFileSync('index.html','utf8');
function has(s, re, msg){ assert(re.test(s), msg); }
function not(s, re, msg){ assert(!re.test(s), msg); }

has(gs, /const BUILD7_OWNER_EMAIL = "smrtcrm4u@gmail.com";/, 'new owner email is canonical');
not(gs, /BUILD7_OWNER_EMAIL = "liberman600@gmail.com"/, 'old owner email is not canonical');
has(gs, /if \(email === BUILD7_OWNER_EMAIL\)[\s\S]*?role: "מנהל ראשי"[\s\S]*?isOwner: true/, 'canonical owner accepted without contact row as super admin');

has(html, /list: \['כותרת','משויך לפרויקט','סוג משימה','עדיפות','תאריך','שעה','סטטוס'\]/, 'task list includes visible canonical status column');
has(html, /const statusValue = t\['סטטוס'\] \|\| 'פתוח'/, 'task table displays canonical stored status with open fallback');
has(html, /task-status-\$\{esc\(statusValue\)\}/, 'task status is visually distinguishable');
has(html, /if\(f==='done'\) return t\['סטטוס'\]==='בוצע'/, 'done filter still uses canonical status');
has(html, /if\(f==='open'\) return t\['סטטוס'\]!=='בוצע' && t\['סטטוס'\]!=='בוטל'/, 'open filter still uses canonical status');

has(html, /window\.openContactCardById = function\(contactId\)[\s\S]*?\.כרטיס_איש_קשר\(\{id:id, authToken:currentToken\(\), token:currentToken\(\)\}\)/, 'contact row opens authenticated server contact-card endpoint');
has(html, /window\.openContactEditorById = function\(contactId\)[\s\S]*?findStoredContactById\(id\)[\s\S]*?openContact\(contact\)/, 'edit opens the saved contact in editor');
has(html, /r=>`openContactCardById\('\$\{esc\(r\['מזהה איש קשר'\]\)\}'\)`/, 'contact row click uses canonical opener');
has(html, /onclick="openContactEditorById\('\$\{id\}'\)"/, 'explicit edit action uses editor opener');
has(html, /<td onclick="event\.stopPropagation\(\)"/, 'action cell does not allow row-click swallowing explicit edit');
has(html, /const readOnly = isArchived \|\| d\.readOnly \|\| !canEdit\(\)/, 'unauthorized viewers do not receive edit controls');

has(html, /renderPersistedCalendarParticipants/, 'task card renders persisted participant section');
has(html, /task\['משתתפי יומן'\] \|\| ''/, 'task card reads canonical persisted participants field');
has(html, /שם מלא[\s\S]*?—[\s\S]*?email/, 'matching visible contact shows full name and email');
has(html, /משתתף חיצוני/, 'external participant is labelled');
has(html, /אין משתתפים ביומן/, 'empty participants state is visible');
has(html, /'משתתפי יומן':normalized/, 'participant persistence field remains canonical');

has(html, /function dashList\(rows,type\)[\s\S]*?onclick="openTaskCard\('\$\{esc\(r\['מזהה משימה'\]\)\}'\)"/, 'dashboard task click opens task card instead of task editor');
has(html, /<button class="primary" onclick='openTask\(\$\{JSON\.stringify\(t\)\}\)'>ערוך<\/button>/, 'task card keeps explicit edit button');
has(gs, /function משימה_מותרת_לפתיחה_Build11_2_\(user, task\)[\s\S]*?משתמש_רשאי_לפרויקט_Build11_2_\(user, projectId\)[\s\S]*?משתמש_רשאי_לאיש_קשר_Build11_2_\(user, contactId\)/, 'task list filtering reuses the same project/contact open permissions');
has(gs, /out\.tasks = \(data\.tasks \|\| \[\]\)\.filter\(t => משימה_מותרת_לפתיחה_Build11_2_\(user, t\)\)/, 'authorized task lists are filtered before dashboard/table/calendar payloads are built');
has(gs, /if \(!משימה_מותרת_לפתיחה_Build11_2_\(user, task\)\) \{[\s\S]*?throw new Error\("אין הרשאה לצפייה במשימה זו"\);[\s\S]*?\}/, 'task card open path uses the shared task permission predicate');
has(gs, /Calendar\.Events\.insert\(resource, calendarId, \{ sendUpdates: "all" \}\)/, 'calendar invitation sending remains intact');
console.log('live regression static assertions passed');
