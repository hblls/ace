// 简化 7 个模块的 h2 大标题 + 菜单文字（保持两者一致）
const fs = require('fs');
const FILE = '/Users/donlicm/WorkBuddy/2026-07-20-00-52-15/ace.html';
const PAIRS = [
  // h2 内容区大标题
  ['>① 动词（动词大全 + 不定式）</h2>', '>① 动词与不定式</h2>'],
  ['>② 英语词组大全</h2>', '>② 英语词组</h2>'],
  ['>③ 新概念英语 第二册（New Concept English 2）</h2>', '>③ 新概念英语二</h2>'],
  ['>⑥ 形似被动的形容词（be + 过去分词）</h2>', '>⑥ 形似被动的形容词</h2>'],
  ['>⑦ 新概念英语第一册·语法精要</h2>', '>⑦ 新概念一·语法精要</h2>'],
  // 菜单（同步简化，移动端顶部标题取自这里）
  ['📖 动词（动词大全 + 不定式）', '📖 动词与不定式'],
  ['🗂 英语词组大全', '🗂 英语词组'],
  ['📚 新概念英语</span>', '📚 新概念英语二</span>'],
  ['📚 新概念英语第一册·语法精要', '📚 新概念一·语法精要'],
];
let html = fs.readFileSync(FILE, 'utf8');
let done = 0;
for (const [oldS, newS] of PAIRS) {
  const n = html.split(oldS).length - 1;
  if (n !== 1) { console.error('✗ 出现 ' + n + ' 次（期望 1）: ' + oldS); process.exit(1); }
  html = html.replace(oldS, newS);
  done++;
}
fs.writeFileSync(FILE, html);
console.log('已替换 ' + done + '/' + PAIRS.length + ' 处');
// 复验：列出所有 h2 与菜单
const lines = fs.readFileSync(FILE, 'utf8').split('\n');
console.log('--- h2 标题 ---');
lines.forEach((ln, i) => { const m = ln.match(/<h2[^>]*>([^<]+)<\/h2>/); if (m) console.log('  ' + (i + 1) + ': ' + m[1].trim()); });
console.log('--- 菜单 ---');
lines.forEach(ln => { if (/class="menu-btn"/.test(ln)) {
  const v = (ln.match(/data-view="([^"]+)"/) || [])[1], tx = (ln.match(/class="mi-tx"[^>]*>([^<]+)</) || [])[1];
  const no = (ln.match(/mi-no"[^>]*>(\d+)</) || [])[1];
  console.log('  [' + no + '] ' + v + '  ' + (tx || '').trim());
}});
