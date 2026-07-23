const fs = require('fs');
const assert = require('assert');
const html = fs.readFileSync('index.html','utf8');
const gs = fs.readFileSync('V2.GS.txt','utf8');
function has(s, re, msg){ assert(re.test(s), msg); }

has(gs, /function BH13_4_isArchivedValue_[\s\S]*?value === true[\s\S]*?String\(value \|\| ''\)\.trim\(\) === 'כן'/, 'server archive module normalizes historical archived values without mutating the sheet');
has(gs, /const archivedTasks = \(data\.tasks \|\| \[\]\)\.filter\(r => BH13_4_isArchivedValue_\(r && r\['בארכיון'\]\)\);[\s\S]*?tasks: archivedTasks,[\s\S]*?loadedModules: \{ archive:true \}/, 'server archive module returns all archived task rows from the canonical tasks sheet payload');
has(html, /const isArchiveModulePayload = d\.loadedModules && d\.loadedModules\.archive === true;[\s\S]*?DATA\.archive = \{[\s\S]*?tasks: Array\.isArray\(d\.tasks\) \? d\.tasks/, 'client preserves archived tasks from the archive module under DATA.archive.tasks');
has(html, /if\(isArchiveModulePayload && \(k === 'projects' \|\| k === 'contacts' \|\| k === 'tasks'\)\) return;/, 'archive module payload does not overwrite active top-level collections');
has(html, /function archivedRowsFor\(type\)[\s\S]*?if\(Array\.isArray\(archive\[key\]\)\) return archive\[key\];[\s\S]*?filter\(r => String\(r\['בארכיון'\]/, 'archive renderer uses archive-specific rows before falling back to DATA tasks');
has(html, /if\(type === 'tasks'\)[\s\S]*?rows = archivedRowsFor\('tasks'\)/, 'task archive view renders archivedRowsFor tasks');
has(html, /openFn = r => `openTaskCard\('\$\{esc\(r\['מזהה משימה'\]\)\}'\)`/, 'archived task rows open the task card');
has(html, /isArchived[\s\S]*?שחזר מארכיון[\s\S]*?readOnly \? ''[\s\S]*?doneTask\('\$\{id\}'\)[\s\S]*?delTask\('\$\{id\}'\)/, 'archived task card shows restore while active task cards keep normal actions');
has(html, /\.withSuccessHandler\(\(\)=>refreshCore\(\(\)=>openTaskCard\(id\)\)\)[\s\S]*?\.סימון_משימה_בוצעה/, 'doneTask refreshes core and reopens the task card');
has(html, /reactivateTask = function\(id\)[\s\S]*?refreshCore\(\(\)=>openTaskCard\(id\)\)/, 'reactivateTask refreshes core and reopens the task card');
has(html, /function restoreArchive\(type,id\)[\s\S]*?data-open-task-id[\s\S]*?if\(type === 'tasks'[\s\S]*?openTaskCard\(id\)/, 'restoring an open archived task refreshes core and reopens the server task card');
has(html, /delTask = function\(id\)[\s\S]*?fallbackTask = Object\.assign[\s\S]*?'בארכיון':'כן'[\s\S]*?renderTaskCard\(\{task:fallbackTask, notes:\[\], readOnly:true\}\)[\s\S]*?refreshCore\(\(\)=>openTaskCard\(id\)\)/, 'archiving a task keeps the modal open with an archived local fallback, then refreshes and reopens');
has(html, /setAttribute\('data-open-task-id', id\)/, 'task card preserves data-open-task-id');
has(html, /const data = \(window\.DATA && DATA\) \|\| \{\};/, 'archive data-source access is guarded when DATA is unavailable');
has(html, /window\.renderTaskCard = function\(d\)\{ d=d\|\|\{\}; oldTaskCard\(d\);/, 'late task-card grid override guards missing task-card payload');
has(html, /const data=\(window\.DATA&&DATA\)\|\|\{\}; const c=\(\(Array\.isArray\(data\.contacts\)\?data\.contacts:\[\]\)\)/, 'meeting contact task-card participant lookup guards missing DATA contacts');
has(html, /const data = \(window\.DATA && DATA\) \|\| \{\};\n    const visibleContacts = \(Array\.isArray\(data\.contacts\) \? data\.contacts : \[\]\)/, 'calendar participant task-card lookup guards missing DATA contacts');
console.log('task archive/card static assertions passed');
