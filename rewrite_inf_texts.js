// 把 DATA.infinitive.points 的 19 条 text 改写为"易懂型"
// 策略：用 vm 从 ace.html 提取旧 text（避免手抄偏差），按 title 数字前缀匹配，
//       校验旧 text 在文件中恰好出现 1 次后替换为新 text。
const fs = require('fs');
const vm = require('vm');
const FILE = '/Users/donlicm/WorkBuddy/2026-07-20-00-52-15/ace.html';

const NEW_TEXTS = {
  "1": "把一个动作当成一件事来说：「学语言」要花时间、「早起」很难。直接把动作放句首当主角：To learn a language takes time. 句子长时先用 it 占位，把动作挪到句尾，读起来更顺：It takes time to learn a language.",
  "2": "「打算做某事」里的「做某事」，英文就用 to do。想要、决定、计划、同意、拒绝、答应这类动词后面直接跟 to do：She decided to study abroad. 常见搭配背下来：want / hope / decide / plan / agree / refuse / learn / promise + to do.",
  "3": "回答「为什么去做」——去伦敦干嘛？提高英语。直接在动作前加 to（＝为了）：He went to London to improve his English. 想强调「就是为了」，用 in order to 或 so as to；注意 in order to 可放句首，so as to 只能放句末。",
  "4": "评价一件事难不难、重不重要，就用这个万能句型：It is + 形容词 + to do。it 没有实义，只是占位，真正说的是后面那件事：It is difficult to pronounce this word. 常用形容词：easy / difficult / important / necessary / possible。",
  "5": "不知道「说什么 / 去哪儿 / 怎么做」，英文把疑问词和 to do 绑在一起：I don't know what to say. 相当于把「我该说什么」一整句压缩成几个词，接在 know / ask / decide / wonder 等词后面特别顺。",
  "6": "「让某人做事」「看见某人做事」，中间的动作不带 to：made me clean（不是 to clean）、saw him leave。口诀：使役（make/let/have）+ 感官（see/hear/watch/feel）后面 to 脱掉。但句子变被动后，to 要穿回来：He was made to apologize.",
  "7": "「我的梦想是当老师」——「是」后面的那个动作用 to do：My dream is to become a teacher. 前面常配 dream / goal / plan / aim / job 这类词，套公式：My X is to do sth.",
  "8": "修饰名词时，不定式要放在名词后面（英文习惯）：第一个到的 → the first to arrive；喝的东西 → something to drink；值得去的地方 → a place to visit。固定搭配记三个：the first/last to do、something to eat、a lot to do。",
  "9": "「我想让你去」——想让别人做事，用三段式：动词 + 人 + to do：I want you to go. / She asked me to help. 常用动词：want / ask / tell / expect / would like。注意与第 6 条区分：这里的 to 不能省。",
  "10": "三个高频小句型：① in order to / so as to＝为了（so as to 不能放句首）；② too...to＝太……以至于不能，自带否定、别再加 not：He is too young to drive. ③ ...enough to＝足够……可以：She is old enough to go to school. 注意 enough 放在形容词后面。",
  "11": "同一个动词，接 to do 和 doing 意思可能完全不同，重点记四组：remember / forget——to do＝记得要去做，doing＝记得做过；stop——to do＝停下来去做另一件事，doing＝停止手头的事（stop to smoke 停下去抽烟 / stop smoking 戒烟）；try——to do＝努力做成，doing＝试试看；regret——to do＝遗憾地告知，doing＝后悔做过。另外：hope / want / decide 这类只接 to do；enjoy / finish / avoid / mind 这类只接 doing。",
  "12": "to do 也有「时态外衣」，先记三件：正在做 → to be doing（He seems to be sleeping. 他好像在睡觉）；已经做过 → to have done（动作发生在谓语之前：He is said to have left.）；被做 → to be done。完成被动式（to have been done）很少见，能认出即可。",
  "13": "忙活半天，结果却……英文用 only to do 收尾，自带「可惜 / 竟然」的语气：He hurried to the station only to find the train had left.（赶到了，却发现车开了）看到句尾 only to + 动词，就往「结果落空」上想。",
  "14": "「很高兴认识你」——为什么高兴？因为认识你。情绪词（glad / sorry / happy / lucky / surprised 等）后面的 to do 说的是原因：I am glad to meet you. 判断方法：to 前面是心情词，这个 to do 多半是原因，不是目的。",
  "15": "要说「对谁来说」做事，用 for：It is important for him to study. 但形容词在夸或骂人本身（kind / nice / clever / stupid / rude）时用 of：It is kind of you to help.（你人真好）小技巧：能改写成「You are kind」的就用 of，说不通的就用 for。",
  "16": "这本书好读——是书被读，但英文偏说 The book is easy to read（不是 to be read）。easy / difficult / hard / interesting 这类词后面，意思是被动的，形式却用主动，这是固定习惯，别去「纠正」它。",
  "17": "还有几个短语后面直接跟光杆动词（不带 to）：had better do（最好做）、would rather do（宁愿做）、why not do（何不做）。记三兄弟：better、rather、why not，后面一律动词原形：You had better go now.",
  "18": "不定式说「不」，把 not 放在 to 前面：He told me not to go.（不是 to not go）另外，对话里动词重复时可以只留 to：—Will you join us? —I'd love to. 后面的动词全省，很地道。",
  "19": "「好像 / 碰巧 / 结果证明」——seem / appear / happen / prove 后面直接跟 to do：He seems to know everything.（他好像什么都知道）还能叠加第 12 条的形式：He seems to be sleeping.（好像正在睡）"
};

let html = fs.readFileSync(FILE, 'utf8');

// 1) 提取旧数据
const s = html.indexOf('infinitive: {');
const o = html.indexOf('{', s);
let d = 0, e = -1;
for (let i = o; i < html.length; i++) {
  const c = html[i];
  if (c === '{') d++;
  else if (c === '}') { d--; if (d === 0) { e = i; break; } }
}
const ctx = {};
vm.createContext(ctx);
vm.runInContext('var __v=' + html.slice(o, e + 1) + ';', ctx);
const points = ctx.__v.points;
if (points.length !== 19) { console.error('条目数异常: ' + points.length); process.exit(1); }

// 2) 逐条替换
let replaced = 0;
for (const p of points) {
  const num = p.title.match(/^(\d+)\./)[1];
  const newText = NEW_TEXTS[num];
  if (!newText) { console.error('缺少第 ' + num + ' 条新文本'); process.exit(1); }
  const old = p.text;
  const count = html.split(old).length - 1;
  if (count !== 1) { console.error('第 ' + num + ' 条旧文本出现 ' + count + ' 次（期望 1），跳过以防误伤'); process.exit(1); }
  html = html.replace(old, newText);
  replaced++;
}
console.log('已替换 ' + replaced + '/19 条');

// 3) 写回并验证
fs.writeFileSync(FILE, html);
const html2 = fs.readFileSync(FILE, 'utf8');
const s2 = html2.indexOf('infinitive: {');
const o2 = html2.indexOf('{', s2);
let d2 = 0, e2 = -1;
for (let i = o2; i < html2.length; i++) {
  const c = html2[i];
  if (c === '{') d2++;
  else if (c === '}') { d2--; if (d2 === 0) { e2 = i; break; } }
}
const ctx2 = {};
vm.createContext(ctx2);
vm.runInContext('var __v2=' + html2.slice(o2, e2 + 1) + ';', ctx2);
const pts2 = ctx2.__v2.points;
let ex = 0;
pts2.forEach(p => ex += (p.examples || []).length);
console.log('验证: 用法 ' + pts2.length + ' 条 / 例句 ' + ex + ' 条 / tips ' + (ctx2.__v2.tips || []).length + ' 条');
const m = html2.match(/<script>([\s\S]*?)<\/script>/);
try { new vm.Script(m[1]); console.log('JS 语法 OK'); } catch (err) { console.error('JS ERR: ' + err.message); process.exit(1); }
const css = html2.match(/<style>([\s\S]*?)<\/style>/)[1];
let dep = 0;
for (const ch of css) { if (ch === '{') dep++; else if (ch === '}') dep--; }
console.log('CSS depth=' + dep);
let allNew = true;
for (const p of pts2) {
  const num = p.title.match(/^(\d+)\./)[1];
  if (p.text !== NEW_TEXTS[num]) { allNew = false; console.error('第 ' + num + ' 条未生效'); }
}
console.log(allNew ? '✅ 19 条全部为易懂版' : '❌ 有条目未生效');
