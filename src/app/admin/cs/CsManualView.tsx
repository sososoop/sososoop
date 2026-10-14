'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { CsCase } from './manual';

// 낱말이 하나라도 걸리면 보여 주고, 많이 걸린 순으로 세운다.
// 고객은 '바꿨어요'처럼 활용해서 쓰니, 두 글자 넘는 낱말은 앞 두 글자로도 한 번 더 찾는다(점수는 반).
function rank<T>(list: T[], words: string[], textOf: (x: T) => string): T[] {
  return list
    .map((x, i) => {
      const t = textOf(x);
      const score = words.reduce(
        (n, w) => n + (t.includes(w) ? 1 : w.length > 2 && t.includes(w.slice(0, 2)) ? 0.5 : 0),
        0,
      );
      return { x, i, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .map((r) => r.x);
}

const squash = (s: string) => s.replace(/\s+/g, '').toLowerCase();
const caseText = (c: CsCase) =>
  squash([c.title, c.keywords, ...c.check, ...c.steps, c.note ?? '', ...c.replies.map((r) => r.text)].join(' '));

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          // 복사가 막힌 브라우저 — 글을 직접 길게 눌러 복사
        }
      }}
      className="shrink-0 px-3 py-1 rounded-full text-[12px] font-medium border border-hairline bg-canvas text-ink hover:border-primary/50 transition-colors"
    >
      {done ? '복사됨 ✓' : '복사'}
    </button>
  );
}

export default function CsManualView({ cases }: { cases: CsCase[] }) {
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(cases.find((c) => c.hot)?.id ?? null);
  const words = query.trim().split(/\s+/).filter(Boolean).map(squash);
  const shown = words.length ? rank(cases, words, caseText) : cases;

  return (
    <main className="max-w-[860px] mx-auto px-4 md:px-6 py-8 flex flex-col gap-5">
      <div>
        <h1 className="text-[22px] font-bold text-ink">문의응대 매뉴얼</h1>
        <p className="mt-1 text-[13px] text-ink-muted">
          고객센터(카카오채널) 문의 종류별로 확인할 것 → 처리 → 답장 순서예요. 답장은 [복사]해서 카톡에 붙여 넣고 [ ] 부분만
          바꿔 보내세요. 고객용 답은{' '}
          <Link href="/slp-cbt-practice/faq" target="_blank" className="text-primary hover:underline">
            FAQ
          </Link>
          에도 있어요.
        </p>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="고객이 쓴 말로 검색 (예: 노트북 바꿨어요, 결제, 쿠폰)"
        className="w-full px-4 py-2.5 rounded-full border border-hairline bg-canvas text-[14px] text-ink focus:outline-none focus:border-primary"
      />

      {shown.length === 0 && <p className="text-[14px] text-ink-muted">맞는 항목이 없어요. 다른 말로 찾아보세요.</p>}

      <div className="flex flex-col gap-3">
        {shown.map((c) => {
          const open = words.length > 0 || openId === c.id;
          return (
            <section key={c.id} className="bg-pearl border border-hairline rounded-[14px] overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenId(openId === c.id ? null : c.id)}
                className="w-full flex items-center gap-2 px-5 py-4 text-left"
              >
                {c.hot && (
                  <span className="shrink-0 px-2 py-0.5 rounded-full bg-primary text-white text-[11px] font-bold">문의 많음</span>
                )}
                <span className="flex-1 text-[15px] font-bold text-ink [word-break:keep-all]">{c.title}</span>
                <span className="text-ink-light text-[18px] leading-none">{open ? '−' : '+'}</span>
              </button>

              {open && (
                <div className="px-5 pb-5 flex flex-col gap-4 text-[14px] text-ink [word-break:keep-all]">
                  <div>
                    <h3 className="text-[12px] font-semibold text-ink-light mb-1">① 확인할 것</h3>
                    <ul className="list-disc pl-5 flex flex-col gap-1">
                      {c.check.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-[12px] font-semibold text-ink-light mb-1">② 처리</h3>
                    <ol className="list-decimal pl-5 flex flex-col gap-1">
                      {c.steps.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ol>
                    {c.id === 'device' && (
                      <Link href="/admin" className="inline-block mt-2 text-[13px] text-primary hover:underline">
                        회원관리에서 이메일 검색하기 →
                      </Link>
                    )}
                  </div>
                  {c.note && (
                    <p className="px-3 py-2 rounded-[10px] bg-canvas border border-hairline text-[13px] text-ink-muted">
                      주의 · {c.note}
                    </p>
                  )}
                  <div>
                    <h3 className="text-[12px] font-semibold text-ink-light mb-1">③ 답장</h3>
                    <div className="flex flex-col gap-2">
                      {c.replies.map((r) => (
                        <div key={r.label} className="rounded-[10px] bg-canvas border border-hairline p-3">
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-[13px] font-semibold text-ink">{r.label}</span>
                            <CopyButton text={r.text} />
                          </div>
                          <p className="whitespace-pre-line text-[13px] text-ink-muted leading-relaxed">{r.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
