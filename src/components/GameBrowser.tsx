'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { type Game } from '@/data/games';

// 필터 칩 순서. Notion에 새 키워드를 넣으면 목록 끝에 붙는다.
const AUDIENCE_ORDER = ['유아', '초저', '초고', '중등', '선생님용'];
const AREA_ORDER = ['어휘', '한자어', '문장', '읽기·해독', '쓰기', '공간·방향'];
const FORMAT_ORDER = ['게임', '퀴즈', '만들기 도구'];

const formatColors: Record<string, string> = {
  게임: 'bg-blue-50 text-blue-700',
  퀴즈: 'bg-green-50 text-green-700',
  '만들기 도구': 'bg-purple-50 text-purple-700',
};

function ordered(values: string[], order: string[]): string[] {
  const set = new Set(values);
  return [...order.filter((v) => set.has(v)), ...[...set].filter((v) => !order.includes(v))];
}

function FilterRow({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  if (options.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-12 shrink-0 text-[13px] font-semibold text-ink-light">{label}</span>
      {options.map((opt) => {
        const on = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            aria-pressed={on}
            className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
              on
                ? 'bg-primary text-white'
                : 'bg-canvas border border-hairline text-ink-muted hover:border-primary/40 hover:text-ink'
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

const btnClass =
  'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-primary text-white text-[14px] font-medium hover:bg-primary-dark transition-colors active:scale-95 self-start';

function GameCard({ game, loggedIn }: { game: Game; loggedIn: boolean }) {
  return (
    <article
      id={game.id}
      className="bg-pearl rounded-[18px] overflow-hidden border border-hairline flex flex-col scroll-mt-24"
    >
      <div className="w-full h-44 overflow-hidden bg-stone-100">
        {game.image && <img src={game.image} alt={game.title} className="w-full h-full object-cover object-top" />}
      </div>
      <div className="p-6 flex flex-col flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span
            className={`text-[12px] font-semibold px-3 py-1 rounded-full ${
              formatColors[game.format] ?? 'bg-primary/10 text-primary'
            }`}
          >
            {game.format}
          </span>
          {game.level && (
            <span className="text-[12px] text-amber-600 bg-amber-50 px-2 py-1 rounded" aria-label={`난이도 ${game.level.length}단계`}>
              난이도 {game.level}
            </span>
          )}
          {game.time && <span className="text-[12px] text-ink-light bg-hairline px-2 py-1 rounded">{game.time}</span>}
        </div>
        <h2 className="text-[17px] font-semibold text-ink mb-2 leading-snug">{game.title}</h2>
        {game.goal && (
          <p className="text-[14px] font-medium text-primary mb-2 leading-snug">목표 · {game.goal}</p>
        )}
        <p className="text-[14px] text-ink-muted leading-relaxed mb-4 flex-1">{game.description}</p>
        <div className="flex flex-wrap gap-1.5 mb-5">
          {[...game.audiences, ...game.areas].map((tag) => (
            <span key={tag} className="text-[12px] text-ink-muted bg-canvas border border-hairline px-2 py-0.5 rounded-full">
              #{tag}
            </span>
          ))}
        </div>
        {loggedIn && game.linkUrl ? (
          <a href={game.linkUrl} target="_blank" rel="noopener noreferrer" className={btnClass}>
            {game.format === '만들기 도구' ? '도구 열기' : '바로 하기'}
          </a>
        ) : (
          <Link href={`/login?next=${encodeURIComponent(`/resources/games#${game.id}`)}`} className={btnClass}>
            <svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 1110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            로그인하고 무료로 하기
          </Link>
        )}
      </div>
    </article>
  );
}

export default function GameBrowser({ games, loggedIn }: { games: Game[]; loggedIn: boolean }) {
  const [query, setQuery] = useState('');
  const [audiences, setAudiences] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [formats, setFormats] = useState<string[]>([]);

  const audienceOptions = useMemo(() => ordered(games.flatMap((g) => g.audiences), AUDIENCE_ORDER), [games]);
  const areaOptions = useMemo(() => ordered(games.flatMap((g) => g.areas), AREA_ORDER), [games]);
  const formatOptions = useMemo(() => ordered(games.map((g) => g.format).filter(Boolean), FORMAT_ORDER), [games]);

  const toggle = (set: (fn: (prev: string[]) => string[]) => void) => (value: string) =>
    set((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));

  // 같은 줄 안에서는 하나라도 맞으면, 줄끼리는 모두 맞아야 보인다.
  const q = query.trim().toLowerCase();
  const visible = games.filter(
    (g) =>
      (audiences.length === 0 || g.audiences.some((a) => audiences.includes(a))) &&
      (areas.length === 0 || g.areas.some((a) => areas.includes(a))) &&
      (formats.length === 0 || formats.includes(g.format)) &&
      (q === '' ||
        [g.title, g.description, g.goal, ...g.audiences, ...g.areas].some((t) => t.toLowerCase().includes(q))),
  );

  const filtered = q !== '' || audiences.length + areas.length + formats.length > 0;

  return (
    <>
      <div className="bg-pearl border border-hairline rounded-[18px] p-5 md:p-6 mb-8 flex flex-col gap-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="예: 한자, 방향, 쓰기"
          aria-label="학습게임 검색"
          className="w-full px-4 py-3 rounded-full border border-hairline bg-canvas text-[15px] text-ink placeholder:text-ink-light focus:outline-none focus:border-primary"
        />
        <FilterRow label="대상" options={audienceOptions} selected={audiences} onToggle={toggle(setAudiences)} />
        <FilterRow label="영역" options={areaOptions} selected={areas} onToggle={toggle(setAreas)} />
        <FilterRow label="형태" options={formatOptions} selected={formats} onToggle={toggle(setFormats)} />
      </div>

      <div className="flex items-center justify-between mb-6">
        <p className="text-[13px] text-ink-light">
          {loggedIn
            ? `소소숲 회원에게 무료로 열려 있어요 · ${visible.length}개`
            : `로그인하면 모두 무료로 쓸 수 있어요. 구글·카카오 계정으로 바로 로그인할 수 있어요 · ${visible.length}개`}
        </p>
        {filtered && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setAudiences([]);
              setAreas([]);
              setFormats([]);
            }}
            className="text-[13px] text-primary hover:underline shrink-0 ml-3"
          >
            필터 지우기
          </button>
        )}
      </div>

      {visible.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visible.map((game) => (
            <GameCard key={game.id} game={game} loggedIn={loggedIn} />
          ))}
        </div>
      ) : (
        <div className="bg-canvas rounded-[18px] p-10 border border-hairline text-center">
          <p className="text-[17px] text-ink-muted">조건에 맞는 활동이 아직 없어요.</p>
          <p className="text-[14px] text-ink-light mt-2">필터를 줄여 보거나, 곧 추가될 새 게임을 기다려 주세요.</p>
        </div>
      )}
    </>
  );
}
