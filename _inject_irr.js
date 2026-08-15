const fs = require('fs');
const dir = '/Users/donlicm/WorkBuddy/2026-07-20-00-52-15';
const htmlPath = dir + '/ace-eng.html';
const mdPaths = [
  dir + '/irregular-verbs.md',   // irregular groups (AAA/ABA/ABB/ABC/特殊型)
  dir + '/regular-verbs.md'      // 常用规则动词
];
const html = fs.readFileSync(htmlPath, 'utf8');

function esc(s){ return String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"'); }

function parseMd(md){
  const groups = [];
  let cur = null;
  let groupFails = 0, verbFails = 0;
  for(const line of md.split('\n')){
    const t = line.trim();
    if(t.startsWith('## ') && !t.startsWith('### ')){
      const name = t.slice(3).trim();
      cur = { group: name, items: [] };
      groups.push(cur);
      continue;
    }
    if(t.startsWith('- **') && cur){
      const m = t.match(/^- \*\*(.+?)\*\*\s+(.+)$/);
      if(!m){ verbFails++; continue; }
      const base = m[1].trim();
      const rest = m[2].trim();
      const parts = rest.split(' | ');
      const formsPart = (parts[0] || '').trim().replace(/^\//, '');
      const zh = (parts[1] || '').trim();
      const forms = formsPart.split('/').map(s => s.trim());
      const past = forms[0] || '';
      const pp = forms[1] || '';
      if(!base || !past || !pp){ verbFails++; continue; }
      cur.items.push({ base, past, pp, zh });
    }
  }
  return { groups, groupFails, verbFails };
}

let allGroups = [];
let gF = 0, vF = 0;
for(const p of mdPaths){
  const md = fs.readFileSync(p, 'utf8');
  const r = parseMd(md);
  allGroups = allGroups.concat(r.groups);
  gF += r.groupFails; vF += r.verbFails;
}

// de-dup groups by name (keep first), merge items
const merged = [];
const byName = {};
for(const g of allGroups){
  if(byName[g.group]){ byName[g.group].items = byName[g.group].items.concat(g.items); }
  else { const ng = { group: g.group, items: g.items.slice() }; merged.push(ng); byName[g.group] = ng; }
}
// de-dup items within each group by base
for(const g of merged){
  const seen = new Set();
  g.items = g.items.filter(it=>{ if(seen.has(it.base)) return false; seen.add(it.base); return true; });
}
const totalVerbs = merged.reduce((s,g)=>s+g.items.length, 0);

// ---- build JS array ----
let js = '[\n';
merged.forEach((g, gi)=>{
  js += '  { group:"' + esc(g.group) + '", items:[\n';
  g.items.forEach((it, ii)=>{
    js += '    { base:"' + esc(it.base) + '", past:"' + esc(it.past) + '", pp:"' + esc(it.pp) + '", zh:"' + esc(it.zh) + '" }' + (ii < g.items.length - 1 ? ',' : '') + '\n';
  });
  js += '  ]}' + (gi < merged.length - 1 ? ',' : '') + '\n';
});
js += ']';

// ---- validate ----
try { new Function('return ' + js + ';'); }
catch(e){ console.error('PARSED JS SYNTAX FAIL:', e.message); process.exit(1); }

// ---- bracket-matched replacement of DATA.irregular ----
const start = html.indexOf('irregular: [');
if(start < 0){ console.error('irregular placeholder not found'); process.exit(1); }
const arrStart = html.indexOf('[', start);
let depth = 0, end = -1;
for(let i = arrStart; i < html.length; i++){
  const ch = html[i];
  if(ch === '[') depth++;
  else if(ch === ']'){ depth--; if(depth === 0){ end = i; break; } }
}
if(end < 0){ console.error('no matching ] for irregular array'); process.exit(1); }
const out = html.slice(0, arrStart) + js + html.slice(end + 1);
fs.writeFileSync(htmlPath, out, 'utf8');

console.log('GROUPS:', merged.length, '| VERBS:', totalVerbs, '| groupFails:', gF, '| verbFails:', vF);
console.log('INJECT OK');
