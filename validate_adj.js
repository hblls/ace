const fs = require('fs');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync('/Users/donlicm/WorkBuddy/2026-07-20-00-52-15/ace.html', 'utf8');
const errors = [];
const vc = new (require('jsdom').VirtualConsole)();
vc.on('jsdomError', e => errors.push('jsdomError: ' + (e.detail || e.message)));

const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, url: 'http://localhost/' });
const { window } = dom;

setTimeout(() => {
  const doc = window.document;
  const sec = doc.getElementById('adjpassive');
  let pass = true;
  const out = [];

  function check(name, cond) { out.push((cond ? 'PASS' : 'FAIL') + ' ' + name); if (!cond) pass = false; }

  check('section exists', !!sec);
  check('toolbar #adjSearch', !!doc.getElementById('adjSearch'));
  check('segmented #adjSeg', !!doc.getElementById('adjSeg'));
  check('#adjSelf exists', !!doc.getElementById('adjSelf'));
  check('#adjRead exists', !!doc.getElementById('adjRead'));

  const grids = sec.querySelectorAll('.adj-grid');
  check('two grids', grids.length === 2);
  check('grid1 data-cat=emotion', grids[0] && grids[0].dataset.cat === 'emotion');
  check('grid2 data-cat=state', grids[1] && grids[1].dataset.cat === 'state');

  const cards = sec.querySelectorAll('.adj-card');
  check('36 cards total', cards.length === 36);
  const spk = sec.querySelectorAll('.adj-card .adj-spk');
  check('36 speaker buttons injected', spk.length === 36);
  const ing = sec.querySelectorAll('.adj-card .adj-ing');
  check('28 -ing spans (emotion)', ing.length === 28);
  // verify a specific mapping
  const amazedCard = Array.from(cards).find(c => (c.querySelector('.adj-word')||{}).textContent === 'amazed');
  check('amazed -> amazing mapping', amazedCard && /amazing/.test(amazedCard.querySelector('.adj-ing').textContent));
  const delightedCard = Array.from(cards).find(c => (c.querySelector('.adj-word')||{}).textContent === 'delighted');
  check('delighted -> delightful (corrected)', delightedCard && /delightful/.test(delightedCard.querySelector('.adj-ing').textContent));

  // self-test toggle
  const selfBtn = doc.getElementById('adjSelf');
  selfBtn.dispatchEvent(new window.Event('click', { bubbles: true }));
  check('self-test adds adj-selfmode', sec.classList.contains('adj-selfmode'));
  check('self button label changed', selfBtn.textContent === '退出自测');
  selfBtn.dispatchEvent(new window.Event('click', { bubbles: true }));
  check('self-test removed', !sec.classList.contains('adj-selfmode'));

  // search filter
  const search = doc.getElementById('adjSearch');
  search.value = 'married';
  search.dispatchEvent(new window.Event('input', { bubbles: true }));
  let visible = Array.from(cards).filter(c => c.style.display !== 'none');
  check('search "married" -> 1 visible', visible.length === 1 && /married/.test(visible[0].textContent));
  // search by zh
  search.value = '惊讶';
  search.dispatchEvent(new window.Event('input', { bubbles: true }));
  visible = Array.from(cards).filter(c => c.style.display !== 'none');
  check('search "惊讶" -> amazed visible', visible.some(c => /amazed/.test(c.textContent)));
  search.value = '';
  search.dispatchEvent(new window.Event('input', { bubbles: true }));

  // category filter state
  const stateBtn = Array.from(doc.getElementById('adjSeg').querySelectorAll('button')).find(b => b.dataset.cat === 'state');
  stateBtn.dispatchEvent(new window.Event('click', { bubbles: true }));
  visible = Array.from(cards).filter(c => c.style.display !== 'none');
  check('category=state -> 8 visible', visible.length === 8);

  // cross-link
  const link = doc.getElementById('adjLinkTenses');
  check('cross-link exists', !!link);

  check('no JS errors', errors.length === 0);

  console.log(out.join('\n'));
  if (errors.length) console.log('\nERRORS:\n' + errors.join('\n'));
  console.log('\n' + (pass && errors.length === 0 ? '✅ ALL PASSED' : '❌ SOME FAILED'));
  process.exit(pass && errors.length === 0 ? 0 : 1);
}, 900);
