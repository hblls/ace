const fs = require("fs");
const html = fs.readFileSync("/Users/donlicm/WorkBuddy/2026-07-20-00-52-15/ace.html", "utf8");
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
const all = [];
P.groups.forEach(g => (g.items || []).forEach(it => all.push({ group: g.name, p: it.p, zh: it.zh, en: it.en, cn: it.cn })));
const N = Number(process.argv[2] || 200);
const OFF = Number(process.argv[3] || 0);
const batch = all.slice(OFF, OFF + N);
fs.writeFileSync("/Users/donlicm/WorkBuddy/2026-07-20-00-52-15/phr_batch_todo.json", JSON.stringify(batch, null, 0));
console.log("total PHRBANK items:", all.length);
console.log("batch written:", batch.length, "-> phr_batch_todo.json");
console.log("sample:", JSON.stringify(batch.slice(0, 3)));
