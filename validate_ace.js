const fs = require("fs");
const { JSDOM } = require("/Users/donlicm/.workbuddy/binaries/node/workspace/node_modules/jsdom");
const html = fs.readFileSync("/Users/donlicm/WorkBuddy/2026-07-20-00-52-15/ace.html", "utf8");

const errors = [];
const vc = new (require("/Users/donlicm/.workbuddy/binaries/node/workspace/node_modules/jsdom").VirtualConsole)();
vc.on("jsdomError", e => errors.push("jsdomError: " + (e.detail || e.message || e)));
vc.on("error", (...a) => errors.push("console.error: " + a.join(" ")));

const dom = new JSDOM(html, { runScripts: "dangerously", pretendToBeVisual: true, virtualConsole: vc, url: "http://localhost/" });
const w = dom.window;

setTimeout(() => {
  const doc = w.document;
  const menus = [...doc.querySelectorAll(".menu-btn")].map(b => b.dataset.view);
  const egiuLeft = !!doc.querySelector('#egiu');
  const zmusLeft = !!doc.querySelector('#zmus');
  // 检查剩余模块 section 是否还在
  const expected = ["phrbank","verb","sent","nce2","mnemonics","tenses","syntax","clauses","roots","adjpassive"];
  const missing = expected.filter(id => !doc.querySelector('#' + id));
  // 抽查渲染产物
  const nce2Root = doc.querySelector('#nce2Root');
  const phrRoot = doc.querySelector('#phrRoot') || doc.querySelector('.phr-grid');
  console.log("菜单 data-view 数量:", menus.length, "=>", menus.join(","));
  console.log("egiu section 残留:", egiuLeft, "| zmus section 残留:", zmusLeft);
  console.log("缺失的必需模块:", missing.length ? missing.join(",") : "无");
  console.log("nce2Root 子节点数:", nce2Root ? nce2Root.children.length : "N/A");
  console.log("JS 错误数:", errors.length);
  errors.slice(0, 10).forEach(e => console.log("  • " + e));
  console.log(errors.length === 0 && !egiuLeft && !zmusLeft && missing.length === 0 ? "✅ 校验通过" : "❌ 存在问题");
}, 800);
