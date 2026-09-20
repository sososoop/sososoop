'use client';

import { useState } from 'react';
import Link from 'next/link';
import { type Resource } from '@/data/resources';

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

const btnClass =
  'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-primary text-white text-[14px] font-medium hover:bg-primary-dark transition-colors active:scale-95 self-start';

// 비로그인 방문자에게 보여주는 잠금 버튼. 로그인 후 원래 보던 자리로 돌아온다.
function LoginGateButton({ nextHref, label }: { nextHref: string; label: string }) {
  return (
    <Link href={`/login?next=${encodeURIComponent(nextHref)}`} className={btnClass}>
      <svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M5 9V7a5 5 0 1110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
          clipRule="evenodd"
        />
      </svg>
      {label}
    </Link>
  );
}

function FreeResourceCard({ resource, loggedIn }: { resource: Resource; loggedIn: boolean }) {
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
      <p className="text-[14px] text-ink-muted leading-relaxed mb-6 flex-1">
        {resource.description}
      </p>
      {!loggedIn ? (
        <LoginGateButton
          nextHref={`/resources#${resource.id}`}
          label={resource.linkUrl ? '로그인하고 무료로 이용하기' : '로그인하고 무료로 받기'}
        />
      ) : resource.linkUrl ? (
        <a
          href={resource.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={btnClass}
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
          </svg>
          {resource.fileType} 사용하러 가기
        </a>
      ) : (
        <a
          href={resource.fileUrl}
          download={resource.downloadName ?? ''}
          className={btnClass}
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          무료 다운로드
        </a>
      )}
      </div>
    </article>
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
  freeResources: Resource[];
  paidResources: Resource[];
  loggedIn: boolean;
};

export default function ResourceTabs({ freeResources, paidResources, loggedIn }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('free');

  return (
    <>
      {/* 탭 버튼 */}
      <div className="flex gap-3 mb-10">
        <button
          onClick={() => setActiveTab('free')}
          className={`px-6 py-3 rounded-full text-[15px] font-semibold transition-colors ${
            activeTab === 'free'
              ? 'bg-primary text-white'
              : 'bg-canvas border border-hairline text-ink-muted hover:border-primary/40 hover:text-ink'
          }`}
        >
          무료 자료
        </button>
        <button
          onClick={() => setActiveTab('paid')}
          className={`px-6 py-3 rounded-full text-[15px] font-semibold transition-colors ${
            activeTab === 'paid'
              ? 'bg-primary text-white'
              : 'bg-canvas border border-hairline text-ink-muted hover:border-primary/40 hover:text-ink'
          }`}
        >
          유료 자료
        </button>
      </div>

      {/* 무료 자료 */}
      {activeTab === 'free' && (
        <div>
          <p className="text-[13px] text-ink-light mb-6">
            {loggedIn
              ? '소소숲 회원에게 무료로 제공되는 자료입니다.'
              : '로그인하면 모두 무료로 받을 수 있습니다. 구글·카카오 계정으로 바로 로그인할 수 있어요.'}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {freeResources.map((resource) => (
              <FreeResourceCard key={resource.id} resource={resource} loggedIn={loggedIn} />
            ))}
          </div>
        </div>
      )}

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
