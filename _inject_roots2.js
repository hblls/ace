// Inject expanded roots corpus (roots-corpus.md) into DATA.roots of ace.html.
// Uses bracket-matching to locate the existing roots array bounds, so it works whether
// roots is empty or already populated.
const fs = require('fs');
const dir = '/Users/donlicm/WorkBuddy/2026-07-20-00-52-15';
const htmlPath = dir + '/ace.html';
const mdPath = dir + '/roots-corpus.md';

const html = fs.readFileSync(htmlPath, 'utf8');
const md = fs.readFileSync(mdPath, 'utf8');

function esc(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

// --- Parse markdown into 3 blocks ---
const blocks = [];
let curType = null, curEntry = null, fails = 0;
for (const line of md.split('\n')) {
  if (line.startsWith('## ')) {
    const t = line.slice(3).trim();
    if (t.includes('前缀')) curType = '前缀';
    else if (t.includes('词根')) curType = '词根';
    else if (t.includes('后缀')) curType = '后缀';
    else curType = null;
    if (curType) blocks.push({ type: curType, items: [] });
    curEntry = null;
    continue;
  }
  if (line.startsWith('### ') && curType) {
    const parts = line.slice(4).trim().split(' | ');
    if (parts.length < 2) { fails++; continue; }
    curEntry = {
      root: parts[0].trim(),
      meaning: (parts[1] || '').trim(),
      origin: (parts[2] || '').trim(),
      words: []
    };
    blocks[blocks.length - 1].items.push(curEntry);
    continue;
  }
  if (line.trim().startsWith('- **') && curEntry) {
    const m = line.match(/^- \*\*(.+?)\*\*\s+(.+)$/);
    if (!m) { fails++; continue; }
    curEntry.words.push({ w: m[1].trim(), zh: m[2].trim() });
    continue;
  }
}

if (blocks.length === 0) { console.error('NO BLOCKS PARSED'); process.exit(1); }

// --- Build JS array text ---
let rootsJS = '[\n';
blocks.forEach((b, bi) => {
  rootsJS += '  { type:"' + esc(b.type) + '", items:[\n';
  b.items.forEach((it, ii) => {
    rootsJS += '    { root:"' + esc(it.root) + '", meaning:"' + esc(it.meaning) + '", origin:"' + esc(it.origin) + '", words:[\n';
    it.words.forEach((wd, wi) => {
      rootsJS += '      {w:"' + esc(wd.w) + '", zh:"' + esc(wd.zh) + '"}' + (wi < it.words.length - 1 ? ',' : '') + '\n';
    });
    rootsJS += '    ]}' + (ii < b.items.length - 1 ? ',' : '') + '\n';
  });
  rootsJS += '  ]}' + (bi < blocks.length - 1 ? ',' : '') + '\n';
});
rootsJS += ']';

// --- Locate existing roots array in HTML via bracket matching ---
const keyIdx = html.indexOf('roots:');
if (keyIdx < 0) { console.error('roots: key not found in HTML'); process.exit(1); }
const openIdx = html.indexOf('[', keyIdx);
if (openIdx < 0) { console.error('roots array [ not found'); process.exit(1); }
let depth = 0, closeIdx = -1;
for (let i = openIdx; i < html.length; i++) {
  if (html[i] === '[') depth++;
  else if (html[i] === ']') {
    depth--;
    if (depth === 0) { closeIdx = i; break; }
  }
}
if (closeIdx < 0) { console.error('could not find matching ] for roots array'); process.exit(1); }

const out = html.slice(0, openIdx) + rootsJS + html.slice(closeIdx + 1);

// --- Syntax validation: the generated roots array must be valid JS on its own ---
try {
  new Function('return ' + rootsJS);
} catch (e) {
  console.error('ROOTSJS SYNTAX FAILED:', e.message);
  process.exit(1);
}

fs.writeFileSync(htmlPath, out, 'utf8');

// --- Report ---
let totalMorph = 0, totalWords = 0;
blocks.forEach(b => { totalMorph += b.items.length; b.items.forEach(it => totalWords += it.words.length); });
console.log('SYNTAX OK');
console.log('Blocks:', blocks.map(b => b.type + '=' + b.items.length).join(' / '));
console.log('Total morphemes:', totalMorph);
console.log('Total example words:', totalWords);
console.log('Parse fails:', fails);
console.log('Replaced roots array: chars', (closeIdx - openIdx + 1), '->', rootsJS.length);
