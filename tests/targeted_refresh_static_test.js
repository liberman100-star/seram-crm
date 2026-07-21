const fs = require('fs');
const assert = require('assert');
const html = fs.readFileSync('index.html','utf8');
function has(re, msg){ assert(re.test(html), msg); }
function notHas(re, msg){ assert(!re.test(html), msg); }
function match(re, msg){ const m = html.match(re); assert(m, msg); return m[0]; }
has(/<script id="BH_TARGETED_REFRESH_HELPERS">/, 'targeted refresh helpers are integrated outside the end-of-file override patch');
notHas(/BH_SYSTEM_WIDE_TARGETED_REFRESH/, 'review-blocked end-of-file override patch was removed');
has(/function BH_refreshModules\(modules, after, opts\)[\s\S]*loadModule_Build13_2\(module, done\)/, 'targeted refreshes use module endpoint');
has(/function BH_refreshModules\(modules, after, opts\)[\s\S]*window\.__BH_LOADING_MODULE__ && window\.__BH_LOADING_MODULE__\[module\][\s\S]*window\.__BH_MODULE_WAITERS__\[module\]\.push\(function\(\)\{[\s\S]*loadModule_Build13_2\(module, done\);[\s\S]*return;[\s\S]*loadModule_Build13_2\(module, done\);/, 'targeted refresh waits for any in-flight module load, then starts a fresh post-mutation load');
const loadModuleBody = match(/function loadModule_Build13_2\(module, after\)\{[\s\S]*?\n\}/, 'module loader exists');
assert(!/renderShell_Build13_2\(d\)/.test(loadModuleBody), 'targeted module refresh does not rerender the whole shell');
has(/function BH_refreshArchive\(type, after\)[\s\S]*renderArchive\(type \|\| 'projects'\)/, 'archive restore/delete reopens the affected archive view');
has(/function saveProjectNote\(projectId\)[\s\S]*withSuccessHandler\(\(\)=>\{\s*openProjectCard\(projectId\);\s*\}\)[\s\S]*שמירת_הערה_לפרויקט_Build5/, 'project notes refresh only the project card notes/timeline path');
has(/function saveTaskNote\(taskId\)[\s\S]*withSuccessHandler\(\(\)=>\{\s*openTaskCard\(taskId\);\s*\}\)[\s\S]*שמירת_הערת_משימה/, 'task notes refresh only the task card');
has(/openTaskCard = function\(id\)\{\s*window\.__BH_OPEN_TASK_CARD_ID__ = String\(id \|\| ''\);[\s\S]*קבלת_כרטיס_משימה_Build10/, 'opening a task card records the open card id before async refresh callbacks run');
has(/function closeM\(\)\{ modal\.classList\.add\('hidden'\); window\.__BH_OPEN_TASK_CARD_ID__ = ''; \}/, 'closing the modal clears the open task card id');
has(/function BH_afterTaskMutation\(id\)\{ return function\(\)\{ if\(BH_isTaskCardOpen\(id\)\) openTaskCard\(id\); \}; \}/, 'task mutation callback reopens the currently displayed task card');
has(/doneTask = function\(id\)\{[\s\S]*BH_refreshTasks\(BH_afterTaskMutation\(id\)\)[\s\S]*סימון_משימה_בוצעה/, 'mark-done refreshes tasks and updates the open task card');
has(/window\.renderTaskCard = function\(d\)\{\s*const t = d\.task \|\| \{\};\s*const id = esc\(t\['מזהה משימה'\] \|\| ''\);\s*window\.__BH_OPEN_TASK_CARD_ID__ = id;/, 'task card render tracks the open task id');
has(/window\.openTask = function\(r=\{\}, preset=\{\}\)[\s\S]*<label>איש קשר\$\{BH_requiredMark\('task','מזהה איש קשר'\)\}<\/label>\s*<select id="tContact">/, 'final task editor exposes contact field for all task types');
has(/window\.sendContactInvitation = function\(contactId\)[\s\S]*BH_refreshContacts\(\(\)=>\{[\s\S]*openContactCardById\(contactId\)/, 'contact invitation refreshes only contacts before reopening card');
console.log('targeted refresh static assertions passed');
