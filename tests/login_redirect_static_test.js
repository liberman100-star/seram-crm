const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
function assert(cond, msg){ if(!cond){ console.error('FAIL:', msg); process.exit(1); } }

const verifyMatch = html.match(/function verifyLoginCode\(\)\{[\s\S]*?\.אימות_קוד_כניסה_Build7\(email, code\);\n\}/);
assert(verifyMatch, 'verifyLoginCode function exists');
const verifyLoginCode = verifyMatch[0];

assert(/const CRM_WEB_APP_URL = 'https:\/\/script\.google\.com\/macros\/s\/[^']+\/exec';/.test(html), 'CRM_WEB_APP_URL is defined as deployed Apps Script exec URL');
assert(/setToken\(res\.token\);[\s\S]*localStorage\.removeItem\('crmLastTab'\);[\s\S]*sessionStorage\.removeItem\('crmLastTab'\);/.test(verifyLoginCode), 'successful login still saves token and clears last-tab state');
assert(verifyLoginCode.includes("window.location.replace(CRM_WEB_APP_URL + '?refresh=' + Date.now());"), 'successful login uses same-tab location.replace refresh');
assert(!/hardRefresh\(\)|refreshCore\(\)/.test(verifyLoginCode), 'successful login does not use popup-prone hardRefresh or in-place refreshCore');
assert(verifyLoginCode.includes("loginMessage.textContent = (res && res.message) || 'קוד שגוי';"), 'invalid-code message remains unchanged');
assert(verifyLoginCode.includes('.withFailureHandler(e=> loginMessage.textContent = e.message)'), 'server-failure message remains unchanged');

console.log('login redirect static checks passed');
