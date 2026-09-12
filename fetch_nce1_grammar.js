/**
 * 抓取 ncego.com 新概念英语第一册「语法知识」区块
 * lessons/2 -> Lesson 1&2 ... lessons/72 -> Lesson 141&142
 * 用法: node fetch_nce1_grammar.js [--test] [--start=2] [--end=72]
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const args = process.argv.slice(2);
const arg = (k, d) => { const m = args.find(a => a.startsWith('--' + k + '=')); return m ? m.split('=')[1] : d; };
const TEST = args.includes('--test');
const START = parseInt(arg('start', '2'), 10);
const END = parseInt(arg('end', '72'), 10);

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

function get(url, retries = 3) {
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      const req = https.get(url, { headers: { 'User-Agent': UA, 'Accept-Encoding': 'identity' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume(); return attempt(n);
        }
        let buf = '';
        res.setEncoding('utf8');
        res.on('data', c => buf += c);
        res.on('end', () => resolve(buf));
      });
      req.on('error', (e) => (n < retries ? setTimeout(() => attempt(n + 1), 800) : reject(e)));
      req.setTimeout(20000, () => { req.destroy(); n < retries ? attempt(n + 1) : reject(new Error('timeout')); });
    };
    attempt(1);
  });
}

const ENT = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&rsquo;': '\u2019', '&lsquo;': '\u2018', '&hellip;': '\u2026', '&nbsp;': ' ', '&mdash;': '\u2014', '&ndash;': '\u2013', '&ldquo;': '\u201c', '&rdquo;': '\u201d' };
const decode = s => s.replace(/&(amp|lt|gt|quot|#39|rsquo|lsquo|hellip|nbsp|mdash|ndash|ldquo|rdquo);/g, m => ENT[m]);
const stripTags = s => decode(s.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();

/** 从 startIdx 处的 <div ...> 开始，按 div 深度扫描取完整内容 */
function grabDiv(html, startIdx) {
  let i = html.indexOf('>', startIdx) + 1;
  let depth = 1, from = i;
  const re = /<\/?div\b/g;
  re.lastIndex = i;
  let m;
  while ((m = re.exec(html)) !== null) {
    if (m[0][1] === '/') depth--; else depth++;
    if (depth === 0) return html.slice(from, m.index);
  }
  return html.slice(from, startIdx + 20000); // 兜底
}

/** 清洗正文 HTML：保留语义标签，红色高亮 span 转 class="hl"，去无用属性 */
function cleanHtml(raw) {
  let s = raw;
  // 站点用彩色 span 标重点：hex / rgb / 颜色名 三种写法都识别
  s = s.replace(/<span[^>]*style="[^"]*color:\s*(?:#[0-9a-fA-F]{3,6}|rgb\([^)]*\)|[a-zA-Z]+)[^"]*"[^>]*>([\s\S]*?)<\/span>/gi,
    '<span class="hl">$1</span>');
  s = s.replace(/<!--[\s\S]*?-->/g, '');
  s = s.replace(/<(p|div|h4|h5|li|tr|table|ul|ol)\b[^>]*>/gi, '<$1>');
  s = s.replace(/<sup[^>]*>/gi, '<sup>');
  s = s.replace(/\s*<sup>[\s\S]*?<\/sup>/g, '');
  s = s.replace(/<(td|th)\b[^>]*>/gi, '<$1>');
  s = s.replace(/<(strong|b|em|i|code|br)\b[^>]*>/gi, '<$1>');
  s = s.replace(/<a\b[^>]*>/gi, '').replace(/<\/a>/gi, '');
  s = s.replace(/<svg[\s\S]*?<\/svg>/gi, '');
  // 非高亮 span（编辑器残留 class/style/Apple-converted-space）→ 去标签留文本
  s = s.replace(/<span(?![^>]*class="hl")[^>]*>([\s\S]*?)<\/span>/gi, '$1');
  // 其余标签剥离所有属性（span 跳过，保住 class="hl"）
  s = s.replace(/<(?!\/?span\b)(\w+)\s+[^>]*>/g, '<$1>');
  s = s.replace(/\n{3,}/g, '\n\n');
  s = s.replace(/[ \t]+/g, ' ').trim();
  return decode(s); // 实体转真实字符，JSON 里更可读
}

/** 提取指定 badge 名称（如「语法知识」）的笔记区块 */
function extractNote(html, label) {
  const re = /<h2[^>]*>\s*<span[^>]*class="badge[^"]*"[^>]*>([\s\S]*?)<\/span>([\s\S]*?)<\/h2>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const badge = stripTags(m[1]);
    if (badge !== label) continue;
    const title = stripTags(m[2]);
    const bodyIdx = html.indexOf('timeline-body', re.lastIndex);
    if (bodyIdx === -1) continue;
    const divStart = html.lastIndexOf('<div', bodyIdx);
    const body = grabDiv(html, divStart);
    const updIdx = html.indexOf('更新于:', re.lastIndex);
    const updated = updIdx !== -1 && updIdx - re.lastIndex < 3000
      ? (html.slice(updIdx + 4, updIdx + 24).match(/[\d-]{10}[\d: ]*/) || [''])[0].trim()
      : '';
    const heads = [...body.matchAll(/<h[3-5][^>]*>([\s\S]*?)<\/h[3-5]>/g)].map(x => stripTags(x[1]));
    // 难度取本区块自己的（h2 结束 ~ 正文开始 之间的 svg 提示）
    const headSeg = html.slice(re.lastIndex, bodyIdx);
    const difficulty = (headSeg.match(/学习难度：(\d)级/) || [])[1] || '';
    return { title, html: cleanHtml(body), text: stripTags(body), updatedAt: updated, subHeads: heads, difficulty };
  }
  return null;
}

function parseLesson(id, html) {
  const t = decode((html.match(/<title>([\s\S]*?)<\/title>/) || ['', ''])[1]);
  const tm = t.match(/Lesson\s+(\S+)\s+([\s\S]*?)\s+([\u4e00-\u9fff][\s\S]*?)\s*《/);
  const lessonNo = tm ? tm[1] : '';
  const titleEn = tm ? tm[2].trim() : t;
  const titleZh = tm ? tm[3].trim() : '';
  const g = extractNote(html, '语法知识');
  return {
    id, url: `https://www.ncego.com/lessons/${id}`,
    lesson: lessonNo, titleEn, titleZh,
    difficulty: g ? g.difficulty : '',
    grammar: g ? g.title : '',
    grammarSubHeads: g ? g.subHeads : [],
    grammarHtml: g ? g.html : '',
    grammarText: g ? g.text : '',
    updatedAt: g ? g.updatedAt : ''
  };
}

(async () => {
  const ids = TEST ? [16] : Array.from({ length: END - START + 1 }, (_, i) => START + i);
  const out = [];
  const miss = [];
  const CONC = 4;
  for (let i = 0; i < ids.length; i += CONC) {
    const batch = ids.slice(i, i + CONC);
    const res = await Promise.all(batch.map(async (id) => {
      try {
        const html = await get(`https://www.ncego.com/lessons/${id}`);
        return parseLesson(id, html);
      } catch (e) { return { id, error: String(e.message || e) }; }
    }));
    res.forEach(r => {
      if (r.error || !r.grammarHtml) miss.push(r.id + (r.error ? '(' + r.error + ')' : '(无语法知识块)'));
      else out.push(r);
      const flag = r.error ? '❌' : (r.grammarHtml ? '✅' : '⚠️');
      console.log(`${flag} lessons/${r.id}  ${r.lesson || '-'} ${r.titleEn || ''} ${r.titleZh || ''}  语法:${(r.grammar || '无').slice(0, 28)}  ${r.grammarHtml ? r.grammarHtml.length + '字' : ''}`);
    });
    if (i + CONC < ids.length) await new Promise(r => setTimeout(r, 300));
  }
  out.sort((a, b) => a.id - b.id);
  const data = {
    meta: {
      source: 'https://www.ncego.com (夸克英语笔记)',
      book: '新概念英语第一册 NCE1',
      section: '语法知识',
      range: `lessons/${START}-${END} (Lesson ${(START - 1) * 2 + 1}-${(END - 1) * 2 + 2})`,
      scrapedAt: new Date().toISOString(),
      total: out.length,
      missing: miss
    },
    lessons: out
  };
  const dir = path.join(__dirname, 'data');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  const file = path.join(dir, TEST ? 'nce1_grammar_test.json' : 'nce1_grammar.json');
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  console.log('\n写入:', file, (fs.statSync(file).size / 1024).toFixed(1) + ' KB');
  console.log('成功:', out.length, ' 缺失/异常:', miss.length ? miss.join(', ') : '无');
})();
