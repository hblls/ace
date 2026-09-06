const fs = require("fs");
const todo = JSON.parse(fs.readFileSync("/Users/donlicm/WorkBuddy/2026-07-20-00-52-15/phr_batch_todo.json", "utf8"));
const enr = JSON.parse(fs.readFileSync("/Users/donlicm/WorkBuddy/2026-07-20-00-52-15/phr_enriched.json", "utf8"));

const todoKeys = todo.map(t => t.p);
const enrKeys = Object.keys(enr);
console.log("todo count:", todoKeys.length, "| enriched keys:", enrKeys.length);

// 1) key 完全匹配（顺序无关）
const setT = new Set(todoKeys), setE = new Set(enrKeys);
const missing = todoKeys.filter(k => !setE.has(k));
const extra = enrKeys.filter(k => !setT.has(k));
console.log("missing keys:", missing.length, missing.slice(0, 5));
console.log("extra keys:", extra.length, extra.slice(0, 5));

// 2) 字段非空
let bad = 0;
for (const k of enrKeys) {
  const v = enr[k];
  if (!v || typeof v.en2 !== "string" || !v.en2.trim() || typeof v.cn2 !== "string" || !v.cn2.trim() || typeof v.note !== "string" || !v.note.trim()) bad++;
}
console.log("entries with empty field:", bad);

// 3) en2 是否包含词组（去掉 (at) 可选标注、按 / 取任一部）
function norm(p) { return p.replace(/\(([^)]*)\)/g, "").trim(); }
let notContained = 0, samples = [];
for (const t of todo) {
  const e = enr[t.p];
  if (!e) continue;
  const parts = norm(t.p).split("/").map(s => s.trim()).filter(Boolean);
  const hit = parts.some(pa => {
    const w = pa.split(/\s+/).filter(Boolean);
    // 全部词素出现在 en2 中（允许时态变化，做小写包含判断）
    return w.every(tok => e.en2.toLowerCase().includes(tok.toLowerCase()));
  });
  if (!hit) { notContained++; if (samples.length < 8) samples.push(t.p + " => " + e.en2); }
}
console.log("en2 not obviously containing phrase parts:", notContained);
samples.forEach(s => console.log("  • " + s));

// 4) note 长度（CJK ≤ 30）
let longNote = 0;
for (const k of enrKeys) { const n = (enr[k].note || "").replace(/[A-Za-z0-9\s]/g, ""); if ([...n].length > 30) longNote++; }
console.log("notes exceeding 30 CJK chars:", longNote);

// 5) 样例
console.log("\nSAMPLES:");
["be used to", "break the ice", "by no means", "run into", "check in (at)"].forEach(p => {
  if (enr[p]) console.log("  " + p + " | en2: " + enr[p].en2 + " | cn2: " + enr[p].cn2 + " | note: " + enr[p].note);
});

// 保存为持久进度文件
fs.writeFileSync("/Users/donlicm/WorkBuddy/2026-07-20-00-52-15/phr_extra.json", JSON.stringify(enr, null, 0));
console.log("\nSaved persistent progress -> phr_extra.json (" + enrKeys.length + " keys)");
