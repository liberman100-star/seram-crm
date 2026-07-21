const fs = require('fs');
const assert = require('assert');
const html = fs.readFileSync('index.html','utf8');
function has(re, msg){ assert(re.test(html), msg); }
function notHas(re, msg){ assert(!re.test(html), msg); }
has(/<script id="BH_TARGETED_REFRESH_HELPERS">/, 'targeted refresh helpers are integrated outside the end-of-file override patch');
notHas(/BH_SYSTEM_WIDE_TARGETED_REFRESH/, 'review-blocked end-of-file override patch was removed');
has(/function BH_refreshModules\(modules, after, opts\)[\s\S]*loadModule_Build13_2\(module, done\)/, 'targeted refreshes use module endpoint');
has(/function BH_refreshArchive\(type, after\)[\s\S]*renderArchive\(type \|\| 'projects'\)/, 'archive restore/delete reopens the affected archive view');
has(/function saveProjectNote\(projectId\)[\s\S]*withSuccessHandler\(\(\)=>\{\s*openProjectCard\(projectId\);\s*\}\)[\s\S]*שמירת_הערה_לפרויקט_Build5/, 'project notes refresh only the project card notes/timeline path');
has(/function saveTaskNote\(taskId\)[\s\S]*withSuccessHandler\(\(\)=>\{\s*openTaskCard\(taskId\);\s*\}\)[\s\S]*שמירת_הערת_משימה/, 'task notes refresh only the task card');
has(/window\.sendContactInvitation = function\(contactId\)[\s\S]*BH_refreshContacts\(\(\)=>\{[\s\S]*openContactCardById\(contactId\)/, 'contact invitation refreshes only contacts before reopening card');
notHas(/window\.location\.replace\(CRM_WEB_APP_URL \+ "\?refresh=" \+ Date\.now\(\)\)/, 'duplicate login redirect change is not present in this PR');
console.log('targeted refresh static assertions passed');
