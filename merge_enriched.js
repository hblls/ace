const fs = require("fs");
const DIR = "/Users/donlicm/WorkBuddy/2026-07-20-00-52-15";

// 1) 读取 PHRBANK 原始词组，拿到规范键集合
const html = fs.readFileSync(DIR + "/ace.html", "utf8");
const m = html.indexOf("const PHRBANK = ");
let i = m + "const PHRBANK = ".length; while (html[i] === " " || html[i] === "\t") i++;
let d = 0, inS = false, esc = false, end = -1;
for (; i < html.length; i++) {
  const c = html[i];
  if (inS) { if (esc) esc = false; else if (c === "\\") esc = true; else if (c === "\"") inS = false; continue; }
  if (c === "\"") { inS = true; continue; }
  if (c === "{") d++; else if (c === "}") { d--; if (d === 0) { end = i; break; } }
}
const P = JSON.parse(html.slice(m + "const PHRBANK = ".length, end + 1));
const canonical = new Set();
P.groups.forEach(g => (g.items || []).forEach(it => canonical.add(it.p)));

// 2) 既有进度
const extraPath = DIR + "/phr_extra.json";
const extra = JSON.parse(fs.readFileSync(extraPath, "utf8"));

// 3) 合并新批次文件（命令行参数传入）
const newFiles = process.argv.slice(2);
let added = 0, skipped = 0, bad = [];
const validKeys = [];
for (const f of newFiles) {
  const enr = JSON.parse(fs.readFileSync(f, "utf8"));
  for (const k of Object.keys(enr)) {
    const v = enr[k];
    if (!canonical.has(k)) { bad.push("非 PHRBANK 词组: " + k); skipped++; continue; }
    if (!v || typeof v.en2 !== "string" || !v.en2.trim() || typeof v.cn2 !== "string" || !v.cn2.trim() || typeof v.note !== "string" || !v.note.trim()) {
      bad.push("字段缺失: " + k); skipped++; continue;
    }
    const nCJK = (v.note || "").replace(/[A-Za-z0-9\s]/g, "");
    if ([...nCJK].length > 30) bad.push("note 超长(" + [...nCJK].length + "): " + k);
    if (extra[k]) { /* 已存在则覆盖（理论上不应发生） */ }
    extra[k] = { en2: v.en2.trim(), cn2: v.cn2.trim(), note: v.note.trim() };
    added++; validKeys.push(k);
  }
}

// 4) en2 是否包含词组（宽松：去掉()标注、按/取任一部、允许时态变化）
function norm(p) { return p.replace(/\(([^)]*)\)/g, "").trim(); }
let notContained = 0;
for (const k of validKeys) {
  const parts = norm(k).split("/").map(s => s.trim()).filter(Boolean);
  const hit = parts.some(pa => pa.split(/\s+/).filter(Boolean).every(tok => extra[k].en2.toLowerCase().includes(tok.toLowerCase())));
  if (!hit) { notContained++; bad.push("en2 未含词组: " + k + " => " + extra[k].en2); }
}

// 5) 写回
fs.writeFileSync(extraPath, JSON.stringify(extra, null, 0));
console.log("既有进度键数:", Object.keys(extra).length - added);
console.log("本次新增:", added, "| 跳过/异常:", skipped);
console.log("合并后总键数:", Object.keys(extra).length);
console.log("en2 未明显含词组:", notContained);
if (bad.length) { console.log("--- 异常清单 ---"); bad.forEach(b => console.log("  • " + b)); }
else console.log("校验通过：无异常。");
