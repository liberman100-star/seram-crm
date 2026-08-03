const assert = require('assert');
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const server = fs.readFileSync('V2.GS.txt', 'utf8');
const patch = html.slice(html.indexOf('<!-- Build 16: canonical local patch'));

assert.match(server, /\["מנהל ראשי", "מנהל", "משתמש"\]/, 'only the three internal roles are candidates');
assert.match(server, /!BH_PR_active_\(row\) \|\| BH_PR_archived_\(row\)/, 'inactive and archived contacts are rejected');
assert.match(server, /BH22_הרשאת_מודול_פעילה_\([^)]*"פרויקטים"\)/, 'project system permission is retained');
assert.match(server, /Responsible eligibility is deliberately independent[\s\S]*return contacts;/, 'candidate eligibility is no longer assignment-domain membership');
assert.match(server, /linkedContactIds[\s\S]*Number\(b\.linked\)-Number\(a\.linked\)/, 'active project links sort linked users first');
assert.match(html, /optgroup label="משויכים לפרויקט"/, 'linked owner optgroup exists');
assert.match(html, /optgroup label="משתמשים נוספים"/, 'additional owner optgroup exists');
assert.match(html, /pAssignmentDomain\.addEventListener\('change',[\s\S]*refreshProjectResponsibleOptions/, 'assignment-domain change rebuilds candidates');
assert.match(html, /projectResponsibleSelection[\s\S]*validDesired/, 'a still-valid current selection is preserved');

['האחראי אינו משויך לפרויקט', 'כן, לשייך ולהמשיך', 'המשך ללא שיוך', 'ביטול'].forEach(text =>
  assert.ok(patch.includes(text), `dialog contains ${text}`));
assert.match(patch, /BH_PROJECT_ownerLinkState = function\(projectId, selectElement\)/, 'focused owner-link state helper exists');
assert.match(patch, /Array\.isArray\(DATA\.links\)/, 'canonical client links must be loaded before proving a link');
assert.match(patch, /\['מזהה פרויקט'\][\s\S]*\['מזהה איש קשר'\][\s\S]*\['פעיל'\][\s\S]*\['בארכיון'\]/, 'active link comparison uses project and contact ids');
assert.match(patch, /return 'unknown'/, 'insufficient link evidence has an explicit unknown state');
assert.match(patch, /state === 'unlinked' \|\| state === 'unknown'/, 'unlinked and unknown both open the dialog');
assert.doesNotMatch(patch, /return !!\(option[\s\S]{0,180}dataset\.linked === 'no'\)/, 'selected option dataset is not the sole source of truth');
assert.match(patch, /ownerLinkMode:ownerLinkMode \|\| 'existing'/, 'explicit link choice is sent to the atomic endpoint');
assert.match(server, /data\.ownerLinkMode === "link"/, 'link creation only occurs for the affirmative choice');
assert.match(server, /alreadyLinked[\s\S]*if\(!alreadyLinked\)/, 'existing links are idempotent');
assert.match(server, /"תפקיד \/ כובע":""/, 'automatic link uses the established empty default role');
assert.match(server, /"מורשה צפייה בפורטל":"לא"/, 'automatic link does not expand portal visibility');
assert.match(server, /if\(createdOwnerLinkId\) deleteById_[\s\S]*if\(projectBefore\) upsert_/, 'combined mutation has compensating rollback');
assert.doesNotMatch(server.slice(server.indexOf('function BH_PR_assertResponsibleAllowed_'), server.indexOf('/***********************', server.indexOf('function BH_PR_assertResponsibleAllowed_'))), /assertNameAllowedForDomain/, 'project-owner save is not rejected solely for domain membership');
assert.match(server, /BH_PR_isValidInternalCandidate_\(candidate\)/, 'active system-role and project permission validation remains');
assert.match(server, /links:core\.links/, 'canonical response returns links from Core');
assert.match(patch, /next\.links = canonicalArray\(response\.links/, 'local patch publishes canonical links');
assert.match(patch, /if\(!id\) return previousSaveProject\.apply/, 'Create Project remains unchanged');
assert.match(patch, /if\(pendingByProject\[id\]\) return/, 'duplicate saving is suppressed');
assert.match(patch, /if\(completed\) return/, 'duplicate callbacks remain suppressed');
assert.match(patch, /if\(fallbackStarted\) return/, 'fallback remains single-shot');
assert.doesNotMatch(patch, /doneTask\s*=|reactivateTask\s*=|saveTask\s*=/, 'task, Done, and Reactivate flows are untouched by this patch');

console.log('project_owner_assignment_flow_static_test: OK');
