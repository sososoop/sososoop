'use client';

// 모의 CBT FAQ 목록 + 검색. 질문·답·검색어(k)를 띄어쓰기 없이 비교해서 걸린 순으로 보여 준다.
// 검색어가 있으면 가장 잘 맞는 답을 펼쳐 보여 준다. 주소에 ?q=검색어 를 붙이면 그 검색으로 시작한다.
import { useState, useSyncExternalStore, type ReactNode } from 'react';

type Item = { q: string; a: ReactNode; text: string };

const noop = () => () => {};
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

export default function FaqList({ items }: { items: Item[] }) {
  // 고객센터 답장에 '?q=기기' 같은 링크를 보내면 검색한 상태로 열린다(직접 입력하면 그 글자로 바뀜)
  const urlQuery = useSyncExternalStore(
    noop,
    () => new URLSearchParams(location.search).get('q') ?? '',
    () => '',
  );
  const [typed, setQuery] = useState<string | null>(null);
  const query = typed ?? urlQuery;
  // 여러 낱말이면 모두 들어 있는 것만
  const words = query.trim().split(/\s+/).filter(Boolean).map(squash);
  const shown = words.length ? rank(items, words, (it) => squash(it.text)) : items;

  return (
    <>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="궁금한 것을 검색해 보세요 (예: 기기 변경, 해설, 쿠폰)"
        aria-label="자주 묻는 질문 검색"
        className="w-full mb-3 px-4 py-3 border-2 border-cbt-ink bg-parchment text-[15px] text-cbt-ink placeholder:text-cbt-gray focus:outline-none focus:border-cbt-pop"
      />
      {shown.length === 0 && (
        <p className="py-4 text-[15px] text-ink-muted">
          찾는 내용이 없어요. 고객센터로 물어봐 주세요.
        </p>
      )}
      <div className="flex flex-col">
        {shown.map(({ q, a }, i) => (
          // 검색 중엔 가장 잘 맞는 답만 펼친다(key를 바꿔 새로 그림)
          <details key={`${q}${words.length ? `:${query}` : ''}`} open={words.length > 0 && i === 0} className="group border-t border-hairline first:border-t-0">
            <summary className="flex items-center justify-between gap-4 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden text-[16px] font-extrabold text-cbt-ink [word-break:keep-all]">
              <span>
                <span className="text-cbt-pop mr-2">Q.</span>
                {q}
              </span>
              <span className="flex-none text-cbt-gray transition-transform group-open:rotate-45 text-[20px] leading-none">+</span>
            </summary>
            <div className="pb-5 pl-7 text-[15px] text-ink-muted leading-relaxed [word-break:keep-all]">{a}</div>
          </details>
        ))}
      </div>
    </>
  );
}
