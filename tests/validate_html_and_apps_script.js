const fs=require('fs'); const assert=require('assert');
const html=fs.readFileSync('index.html','utf8'); const gs=fs.readFileSync('V2.GS.txt','utf8');
// Apps Script syntax proxy: strip HTML template from server file isn't needed; V8 can parse Hebrew identifiers.
new Function(gs);
const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
scripts.forEach((code,i)=>{ try{ new Function(code); } catch(e){ throw new Error(`script block ${i+1} syntax: ${e.message}`); } });
const handlers=[...html.matchAll(/\son[a-z]+=(['"])(.*?)\1/gi)].map(m=>m[2]).filter(code=>!code.includes('${'));
handlers.forEach((code,i)=>{ try{ new Function(code); } catch(e){ throw new Error(`inline handler ${i+1} syntax: ${e.message}: ${code}`); } });
const targets=[...html.matchAll(/\.([\u0590-\u05FF_A-Za-z][\u0590-\u05FF\w]*)\s*\(/g)].map(m=>m[1])
  .filter(n=>/[\u0590-\u05FF]/.test(n));
const serverFns=new Set([...gs.matchAll(/function\s+([\u0590-\u05FF_A-Za-z][\u0590-\u05FF\w]*)\s*\(/g)].map(m=>m[1]));
const missing=[...new Set(targets.filter(t=>!serverFns.has(t)))];
assert.deepStrictEqual(missing, [], 'google.script.run target(s) missing: '+missing.join(', '));
console.log(`validated ${scripts.length} script blocks, ${handlers.length} inline handlers, ${new Set(targets).size} google.script.run targets`);
