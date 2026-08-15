const fs = require('fs');
const dir = '/Users/donlicm/WorkBuddy/2026-07-20-00-52-15';
const htmlPath = dir + '/ace-eng.html';
const mdPath = dir + '/b2-vocabulary.md';

const html = fs.readFileSync(htmlPath, 'utf8');
const md = fs.readFileSync(mdPath, 'utf8');

function esc(s){ return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"'); }

const wIdx = md.indexOf('# B2 主题词汇');
const pIdx = md.indexOf('# B2 短语');
const wordsMd = md.slice(wIdx, pIdx);
const phrasesMd = md.slice(pIdx);

// ---- parse words (themed groups) ----
const groups = [];
let cur = null;
let wordFails = 0;
for (const line of wordsMd.split('\n')) {
  if (line.startsWith('### ')) {
    cur = { group: line.slice(4).trim(), items: [] };
    groups.push(cur);
  } else if (cur && line.trim().startsWith('- **')) {
    const m = line.match(/^- \*\*(.+?)\*\*\s+(\/.+?\/)\s+(\S+)\s+(.+?)\s+—\s+\*(.+?)\*（(.+?)）$/);
    if (!m) { console.error('WORD FAIL:', line); wordFails++; continue; }
    cur.items.push({ w: m[1], ipa: m[2], pos: m[3], zh: m[4], en: m[5], cn: m[6] });
  }
}

// ---- parse phrases ----
const phrases = [];
let phraseFails = 0;
for (const line of phrasesMd.split('\n')) {
  if (line.trim().startsWith('- **')) {
    const m = line.match(/^- \*\*(.+?)\*\*\s+(.+?)\s+—\s+\*(.+?)\*（(.+?)）$/);
    if (!m) { console.error('PHRASE FAIL:', line); phraseFails++; continue; }
    phrases.push({ p: m[1], zh: m[2], en: m[3], cn: m[4] });
  }
}

function itemJS(it){
  return '      {w:"' + esc(it.w) + '", ipa:"' + esc(it.ipa) + '", pos:"' + esc(it.pos) +
         '", zh:"' + esc(it.zh) + '", en:"' + esc(it.en) + '", cn:"' + esc(it.cn) + '"}';
}
const b2wordsJS = '[\n' + groups.map(g =>
  '    { group:"' + esc(g.group) + '", items:[\n' +
  g.items.map(itemJS).join(',\n') + '\n    ]}'
).join(',\n') + '\n  ]';

function phraseJS(it){
  return '    {p:"' + esc(it.p) + '", zh:"' + esc(it.zh) + '", en:"' + esc(it.en) + '", cn:"' + esc(it.cn) + '"}';
}
const b2phrasesJS = '[\n' + phrases.map(phraseJS).join(',\n') + '\n  ]';

// ---- inject ----
let out = html;
const anchorWords = '  ],\n  phrases: [';
const anchorPhrases = '  ],\n  mnemonics: [';
if (!out.includes(anchorWords)) { console.error('ANCHOR (words) NOT FOUND'); process.exit(1); }
if (!out.includes(anchorPhrases)) { console.error('ANCHOR (phrases) NOT FOUND'); process.exit(1); }
out = out.replace(anchorWords, '  ],\n  b2words: ' + b2wordsJS + ',\n  phrases: [');
out = out.replace(anchorPhrases, '  ],\n  b2phrases: ' + b2phrasesJS + ',\n  mnemonics: [');

fs.writeFileSync(htmlPath, out, 'utf8');

// ---- validate JS syntax ----
const m = out.match(/<script>([\s\S]*?)<\/script>/);
try {
  new Function(m[1]);
  console.log('SYNTAX OK');
} catch (e) {
  console.error('SYNTAX ERROR:', e.message);
  process.exit(1);
}

const totalWords = groups.reduce((s,g)=>s+g.items.length,0);
console.log('B2 words:', totalWords, 'in', groups.length, 'groups | B2 phrases:', phrases.length,
            '| wordFails:', wordFails, '| phraseFails:', phraseFails);
