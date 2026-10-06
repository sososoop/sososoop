// CBT 연습앱(index.html + questions.js)을 로그인프리 단일 HTML로 묶어
// src/app/slp-cbt-practice/app-html.json (JSON 문자열)로 저장한다.
//
// - Firebase 스크립트 4줄 제거 → window.FIREBASE_CONFIG 미정의 → 앱이 enterApp('local')로
//   자체 로그인 없이 실행(게이팅은 소소숲 라우트가 담당).
// - questions.js 내용을 인라인 → 문항 소스가 별도 URL로 노출되지 않게(전체 게이트 뒤).
//
// 문항을 고친 뒤 재생성:  node scripts/build-cbt-bundle.mjs
// 소스 경로 지정:        node scripts/build-cbt-bundle.mjs "/path/to/kcbt-practice"
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SRC_DIR =
  process.argv[2] || '/Users/irudassam/클로드/kcbt-practice';
const OUT = join(__dirname, '..', 'src', 'app', 'slp-cbt-practice', 'app-html.json');

let html = readFileSync(join(SRC_DIR, 'index.html'), 'utf8');
const questionsSrc = readFileSync(join(SRC_DIR, 'questions.js'), 'utf8');

// questions.js를 평가해 HIDDEN_SETS(비공개 급수/회차)를 번들에서 **아예 제외**한다.
// 화면에서만 숨기면 HTML 소스에 문항이 남아 유출되므로, 서빙 데이터 자체에서 뺀다.
const sandbox = { window: {} };
vm.runInNewContext(questionsSrc, sandbox);
const W = sandbox.window;
const hidden = W.HIDDEN_SETS || [];
const isHidden = (q) => hidden.some((h) => h.grade === (q.grade || 1) && h.set === (q.set || 1));

// 공개할 급수·회차와 문항 수를 여기에 직접 적는다(2026-09-30).
// HIDDEN_SETS 한 줄만 믿으면, 그 줄이 실수로 비었을 때 숨김 회차가 통째로 번들에 실린다.
// 이 목록에 없는 회차는 절대 싣지 않고, 문항 수가 다르거나 목록과 HIDDEN_SETS가 겹치면 빌드를 멈춘다.
// 회차를 새로 공개할 때: 여기에 한 줄 더하고, questions.js의 HIDDEN_SETS에서도 빼기.
const PUBLIC_SETS = [
  { grade: 1, set: 1, n: 140 },
  { grade: 1, set: 2, n: 140 },
  { grade: 1, set: 3, n: 140 },
  { grade: 2, set: 1, n: 150 },
];
const keyOf = (q) => `${q.grade || 1}-${q.set || 1}`;
const publicKeys = new Set(PUBLIC_SETS.map((p) => `${p.grade}-${p.set}`));
for (const p of PUBLIC_SETS) {
  if (isHidden({ grade: p.grade, set: p.set })) {
    throw new Error(`${p.grade}급 ${p.set}회차가 공개 목록과 HIDDEN_SETS에 둘 다 있음 — 어느 쪽이 맞는지 확인 필요`);
  }
}
const visible = (W.QUESTIONS || []).filter((q) => publicKeys.has(keyOf(q)) && !isHidden(q));
for (const p of PUBLIC_SETS) {
  const got = visible.filter((q) => keyOf(q) === `${p.grade}-${p.set}`).length;
  if (got !== p.n) throw new Error(`${p.grade}급 ${p.set}회차 문항 수 ${got}개 — 공개 목록엔 ${p.n}개로 적혀 있음`);
}
const stripped = (W.QUESTIONS || []).length - visible.length;
const questions =
  `window.EXAM_TITLE = ${JSON.stringify(W.EXAM_TITLE || '언어재활사 모의 CBT')};\n` +
  `window.HIDDEN_SETS = [];\n` + // 번들엔 숨김 세트가 없으므로 비움
  `window.QUESTIONS = ${JSON.stringify(visible)};`;

// 1) Firebase 관련 <script> 4줄 제거(로그인프리 모드로 전환)
html = html
  .replace(/^.*firebasejs\/.*$\n?/gm, '')
  .replace(/^.*src="firebase-config\.js".*$\n?/gm, '')
  .replace(/^\s*<!--\s*Firebase.*-->\s*$\n?/gm, '');

// 2) questions.js 외부 참조 → 인라인
const before = html;
html = html.replace(
  /<script\s+src="questions\.js"><\/script>/,
  `<script>\n${questions}\n</script>`,
);
if (html === before) throw new Error('questions.js <script> 태그를 찾지 못함 — index.html 구조 확인 필요');

// 2-a) 상세해설(details.js) 인라인 — 공개 회차 문항의 것만 싣는다(키 = 급수-회차-교시-번호)
{
  let detailsSrc = '';
  try { detailsSrc = readFileSync(join(SRC_DIR, 'details.js'), 'utf8'); } catch { /* 없으면 상세해설 없이 */ }
  const dBox = { window: {} };
  if (detailsSrc) vm.runInNewContext(detailsSrc, dBox);
  const all = dBox.window.DETAILS || {};
  const kept = {};
  for (const [k, v] of Object.entries(all)) {
    const [g, s] = k.split('-').map(Number);
    if (publicKeys.has(`${g}-${s}`) && !isHidden({ grade: g, set: s })) kept[k] = v;
  }
  const beforeD = html;
  html = html.replace(
    /<script\s+src="details\.js"><\/script>/,
    `<script>\nwindow.DETAILS = ${JSON.stringify(kept)};\n</script>`,
  );
  if (html === beforeD) throw new Error('details.js <script> 태그를 찾지 못함 — index.html 구조 확인 필요');
  console.log(`상세해설: ${Object.keys(kept).length}문항 실음 (전체 ${Object.keys(all).length})`);
}

// 2-b) 정식판 전용 대문(시험일정·주의사항) 켜기 — 베타·체험판은 이 플래그가 없어 바로 응시 정보 입력으로 간다
const beforeHome = html;
html = html.replace('</head>', '<script>window.SHOW_HOME = true;</script>\n</head>');
if (html === beforeHome) throw new Error('</head>를 찾지 못함 — 대문 플래그를 넣을 수 없음');
if (!html.includes('id="homeScreen"')) throw new Error('index.html에 대문(homeScreen)이 없음 — 소스 확인 필요');

// 3) 잔여 firebase-config.js 참조가 없는지 안전 점검
if (/firebase-config\.js|firebasejs\//.test(html)) {
  throw new Error('Firebase 참조가 남아있음 — 제거 로직 확인 필요');
}

// 4) 완성된 번들을 다시 읽어 실린 문항이 공개 목록과 정확히 같은지 확인(다른 경로로 섞여 들어간 문항까지 잡는다)
{
  const m = /<script>\n(window\.EXAM_TITLE[\s\S]*?)\n<\/script>/.exec(html);
  if (!m) throw new Error('번들에서 문항 스크립트를 찾지 못함');
  const box = { window: {} };
  vm.runInNewContext(m[1], box);
  const shipped = box.window.QUESTIONS || [];
  const outside = shipped.filter((q) => !publicKeys.has(keyOf(q)));
  if (outside.length) throw new Error(`공개 목록 밖 문항 ${outside.length}개가 번들에 있음`);
  const total = PUBLIC_SETS.reduce((a, p) => a + p.n, 0);
  if (shipped.length !== total) throw new Error(`번들 문항 ${shipped.length}개 — 공개 목록 합계 ${total}개와 다름`);
  if ((html.match(/window\.QUESTIONS\s*=/g) || []).length !== 1) throw new Error('번들에 문항 목록이 두 번 이상 있음');
}

writeFileSync(OUT, JSON.stringify(html), 'utf8');
console.log(`OK  ${OUT}  (${(html.length / 1024).toFixed(0)} KB HTML)`);
console.log(`문항: 공개 ${visible.length}개 / 비공개 제외 ${stripped}개 (HIDDEN_SETS=${JSON.stringify(hidden)})`);
console.log(`공개 회차 확인: ${PUBLIC_SETS.map((p) => `${p.grade}급 ${p.set}회차 ${p.n}`).join(' · ')} — 번들 재검사 통과`);
