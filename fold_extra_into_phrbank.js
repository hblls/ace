// 将 phr_extra.json 的 enrichment 字段（en2/cn2/note）注入 ace.html 的 PHRBANK 词条
const fs = require("fs");
const DIR = "/Users/donlicm/WorkBuddy/2026-07-20-00-52-15";
const htmlPath = DIR + "/ace.html";
let html = fs.readFileSync(htmlPath, "utf8");

const marker = "const PHRBANK = ";
const m = html.indexOf(marker);
if (m < 0) { console.error("找不到 const PHRBANK"); process.exit(1); }
let i = m + marker.length;
while (html[i] === " " || html[i] === "\t") i++;
let d = 0, inS = false, esc = false, end = -1;
for (; i < html.length; i++) {
  const c = html[i];
  if (inS) { if (esc) esc = false; else if (c === "\\") esc = true; else if (c === "\"") inS = false; continue; }
  if (c === "\"") { inS = true; continue; }
  if (c === "{") d++; else if (c === "}") { d--; if (d === 0) { end = i; break; } }
}
const P = JSON.parse(html.slice(m + marker.length, end + 1));

const extra = JSON.parse(fs.readFileSync(DIR + "/phr_extra.json", "utf8"));
const inP = new Set();
let n = 0;
P.groups.forEach(g => (g.items || []).forEach(it => {
  inP.add(it.p);
  const e = extra[it.p];
  if (e) { it.en2 = e.en2; it.cn2 = e.cn2; it.note = e.note; n++; }
}));
const notFound = Object.keys(extra).filter(k => !inP.has(k));

const newJson = JSON.stringify(P, null, 0);
html = html.slice(0, m + marker.length) + newJson + html.slice(end + 1);
fs.writeFileSync(htmlPath, html);
console.log("已注入 enriched 字段的词条数:", n);
console.log("phr_extra 总键数:", Object.keys(extra).length);
console.log("PHRBANK 中未匹配到的 extra 键数:", notFound.length, notFound.length ? JSON.stringify(notFound) : "");
