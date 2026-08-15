const fs = require('fs');
const dir = '/Users/donlicm/WorkBuddy/2026-07-20-00-52-15';
const htmlPath = dir + '/ace.html';
const mdPath = dir + '/roots-content.md';

const html = fs.readFileSync(htmlPath, 'utf8');
const md = fs.readFileSync(mdPath, 'utf8');

function esc(s){ return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"'); }

const blocks = [];
let curType = null;
let curEntry = null;
let fails = 0;

for (const line of md.split('\n')) {
  if (line.startsWith('## ')) {
    if (line.includes('前缀')) curType = '前缀';
    else if (line.includes('词根')) curType = '词根';
    else if (line.includes('后缀')) curType = '后缀';
    else curType = null;
    if (curType) blocks.push({ type: curType, items: [] });
    curEntry = null;
    continue;
  }
  if (line.startsWith('### ') && curType) {
    const parts = line.slice(4).trim().split(' | ');
    curEntry = { root: parts[0], meaning: parts[1] || '', origin: parts[2] || '', words: [] };
    blocks[blocks.length - 1].items.push(curEntry);
    continue;
  }
  if (line.trim().startsWith('- **') && curEntry) {
    const m = line.match(/^- \*\*(.+?)\*\*\s+(.+)$/);
    if (!m) { console.error('WORD FAIL:', line); fails++; continue; }
    curEntry.words.push({ w: m[1], zh: m[2] });
    continue;
  }
}

function rootItemJS(it){ return '      {w:"' + esc(it.w) + '", zh:"' + esc(it.zh) + '"}'; }
function rootEntryJS(it){
  return '    { root:"' + esc(it.root) + '", meaning:"' + esc(it.meaning) + '", origin:"' + esc(it.origin) + '", words:[\n' +
    it.words.map(rootItemJS).join(',\n') + '\n    ]}';
}
const rootsJS = '[\n' + blocks.map(b =>
  '  { type:"' + esc(b.type) + '", items:[\n' +
  b.items.map(rootEntryJS).join(',\n') + '\n  ]}'
).join(',\n') + '\n]';

const anchor = '  roots: [],';
if (!html.includes(anchor)) { console.error('ANCHOR (roots) NOT FOUND'); process.exit(1); }
const out = html.replace(anchor, '  roots: ' + rootsJS + ',');
fs.writeFileSync(htmlPath, out, 'utf8');

// validate JS
const mm = out.match(/<script>([\s\S]*?)<\/script>/);
try { new Function(mm[1]); console.log('SYNTAX OK'); }
catch (e) { console.error('SYNTAX ERROR:', e.message); process.exit(1); }

const totalWords = blocks.reduce((s,b)=> s + b.items.reduce((x,it)=> x + it.words.length, 0), 0);
console.log('Blocks:', blocks.length, '| morphemes:', blocks.reduce((s,b)=>s+b.items.length,0),
            '| example words:', totalWords, '| parse fails:', fails);
