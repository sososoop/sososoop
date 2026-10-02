'use client';

import { useState } from 'react';
import Link from 'next/link';
import { type Resource } from '@/data/resources';
import { type Game } from '@/data/games';
import GameBrowser from '@/components/GameBrowser';

const categoryColors: Record<string, string> = {
  'AI 활용': 'bg-blue-50 text-blue-700',
  '평가': 'bg-purple-50 text-purple-700',
  '기록': 'bg-green-50 text-green-700',
  '학습': 'bg-yellow-50 text-yellow-700',
  '임상': 'bg-rose-50 text-rose-700',
};

function ResourceThumbnail({ image, title }: { image?: string; title: string }) {
  return (
    <div className="w-full h-44 overflow-hidden bg-stone-100 flex items-center justify-center">
      {image ? (
        <img src={image} alt={title} className="w-full h-full object-cover" />
      ) : (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-stone-300" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      )}
    </div>
  );
}

function PaidResourceCard({ resource }: { resource: Resource }) {
  return (
    <article
      id={resource.id}
      className="bg-pearl rounded-[18px] overflow-hidden border border-hairline flex flex-col"
    >
      <ResourceThumbnail image={resource.image} title={resource.title} />
      <div className="p-6 flex flex-col flex-1">
      <div className="flex items-start justify-between mb-4">
        <span
          className={`text-[12px] font-semibold px-3 py-1 rounded-full ${
            categoryColors[resource.category] ?? 'bg-primary/10 text-primary'
          }`}
        >
          {resource.category}
        </span>
        <span className="text-[12px] text-ink-light bg-hairline px-2 py-1 rounded">
          {resource.fileType}
        </span>
      </div>
      <h2 className="text-[17px] font-semibold text-ink mb-2 leading-snug">
        {resource.title}
      </h2>
      <p className="text-[14px] text-ink-muted leading-relaxed mb-4 flex-1">
        {resource.description}
      </p>
      <p className="text-[19px] font-semibold text-ink mb-4">
        {resource.price?.toLocaleString()}원
      </p>
      <Link
        href={`/resources/${resource.id}`}
        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-primary text-white text-[14px] font-medium hover:bg-primary-dark transition-colors active:scale-95 self-start"
      >
        자세히 보기
      </Link>
      </div>
    </article>
  );
}

type Tab = 'free' | 'paid';

type Props = {
  freeItems: Game[];
  paidResources: Resource[];
  loggedIn: boolean;
  initialTab?: Tab;
};

export default function ResourceTabs({ freeItems, paidResources, loggedIn, initialTab = 'free' }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  return (
    <>
      {/* 탭 버튼 */}
      <div className="flex flex-wrap gap-2 md:gap-3 mb-10">
        <button
          onClick={() => setActiveTab('free')}
          className={`px-4 md:px-6 py-2.5 md:py-3 rounded-full text-[14px] md:text-[15px] font-semibold transition-colors ${
            activeTab === 'free'
              ? 'bg-primary text-white'
              : 'bg-canvas border border-hairline text-ink-muted hover:border-primary/40 hover:text-ink'
          }`}
        >
          무료 자료
        </button>
        <button
          onClick={() => setActiveTab('paid')}
          className={`px-4 md:px-6 py-2.5 md:py-3 rounded-full text-[14px] md:text-[15px] font-semibold transition-colors ${
            activeTab === 'paid'
              ? 'bg-primary text-white'
              : 'bg-canvas border border-hairline text-ink-muted hover:border-primary/40 hover:text-ink'
          }`}
        >
          유료 자료
        </button>
      </div>

      {/* 무료 자료 */}
      {activeTab === 'free' && <GameBrowser games={freeItems} loggedIn={loggedIn} />}

      {/* 유료 자료 */}
      {activeTab === 'paid' && (
        <div>
          {paidResources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {paidResources.map((resource) => (
                <PaidResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          ) : (
            <div className="bg-canvas rounded-[18px] p-10 border border-hairline text-center">
              <p className="text-[17px] text-ink-muted">유료 자료를 준비 중입니다.</p>
              <p className="text-[14px] text-ink-light mt-2">
                카카오채널에서 업데이트 소식을 받아보세요.
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
