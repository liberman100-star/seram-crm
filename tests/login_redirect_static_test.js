const fs = require('fs');
const assert = require('assert');

const html = fs.readFileSync('index.html', 'utf8');
const verifyMatch = html.match(/function verifyLoginCode\(\)[\s\S]*?\.אימות_קוד_כניסה_Build7\(email, code\);\n}/);
assert(verifyMatch, 'verifyLoginCode function exists');
const verifyLoginCode = verifyMatch[0];

assert(
  /const CRM_WEB_APP_URL = 'https:\/\/script\.google\.com\/macros\/s\/AKfycbyfXuvUth9j7L5-rp0TKEc3CC2gffmgo44y_VDZHwMFObT4pxuNkNrL7Jf0HX5CSQQaCQ\/exec';/.test(html),
  'client defines the deployed CRM web app /exec URL'
);
assert(
  /setToken\(res\.token\);[\s\S]*localStorage\.removeItem\('crmLastTab'\);[\s\S]*sessionStorage\.removeItem\('crmLastTab'\);[\s\S]*window\.location\.replace\(CRM_WEB_APP_URL \+ "\?refresh=" \+ Date\.now\(\)\);/.test(verifyLoginCode),
  'successful login saves token, clears last tab, then redirects in the same tab with a cache buster'
);
assert(
  !/function verifyLoginCode\(\)[\s\S]*?hardRefresh\(\)/.test(verifyLoginCode),
  'successful login no longer calls hardRefresh from the async verification handler'
);
assert(
  !/function verifyLoginCode\(\)[\s\S]*?refreshCore\(\)/.test(verifyLoginCode),
  'successful login redirects instead of requiring an in-place core refresh'
);
assert(
  /loginMessage\.textContent = \(res && res\.message\) \|\| 'קוד שגוי';/.test(verifyLoginCode),
  'invalid-code message fallback is unchanged'
);
assert(
  /\.withFailureHandler\(e=> loginMessage\.textContent = e\.message\)/.test(verifyLoginCode),
  'server-failure message handling is unchanged'
);
