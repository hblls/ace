// 校验：ace.html 加载 0 JS 错误；enriched 字段已注入源码；drawPhrGrid 可调用
const fs = require("fs");
const { JSDOM, VirtualConsole } = require("jsdom");
const html = fs.readFileSync("/Users/donlicm/WorkBuddy/2026-07-20-00-52-15/ace.html", "utf8");
const errors = [];
const vc = new VirtualConsole();
vc.on("jsdomError", e => errors.push("jsdomError: " + (e.detail || e.message)));
const dom = new JSDOM(html, { runScripts: "dangerously", pretendToBeVisual: true, virtualConsole: vc, url: "http://localhost/" });
const { window } = dom;

setTimeout(() => {
  let pass = true;
  const out = [];
  // 1) 源码注入确认：A 组与 B 组各抽一条 en2 应存在于 ace.html
  const probes = [
    '"en2":"The guide led us to the cave."',          // A 组 lead sb. to
    '"en2":"They struggled against the disease for years."', // B 组 struggle against
    '"note":"后接对抗的对象(困难/敌人)。"',          // B 组 note
    '"cn2":"他们与这种疾病斗争了多年。"'             // B 组 cn2
  ];
  probes.forEach(p => {
    const ok = html.includes(p);
    out.push((ok ? "PASS" : "FAIL") + " 源码含注入: " + p.slice(0, 30) + "…");
    if (!ok) pass = false;
  });
  // 2) 统计 ace.html 中 en2 字段出现次数（应 >= 400）
  const en2count = (html.match(/"en2":"/g) || []).length;
  out.push((en2count >= 400 ? "PASS" : "FAIL") + " en2 字段数: " + en2count + " (期望 ≥400)");
  if (en2count < 400) pass = false;
  // 3) 页面加载无 JS 错误 + drawPhrGrid 可调用
  try { window.drawPhrGrid(); out.push("PASS drawPhrGrid() 调用无异常"); }
  catch (e) { out.push("FAIL drawPhrGrid threw: " + e.message); pass = false; }
  out.push("JS 错误数: " + errors.length);
  if (errors.length) pass = false;
  console.log(out.join("\n"));
  if (errors.length) console.log("\nERRORS:\n" + errors.join("\n"));
  console.log("\n" + (pass && errors.length === 0 ? "✅ 校验通过" : "❌ 校验失败"));
  process.exit(pass && errors.length === 0 ? 0 : 1);
}, 900);
