'use client';

import { useState, useTransition } from 'react';
import { refreshSite } from '../actions';

// Notion을 고친 뒤 누르는 버튼 — 홈·강의·자료 페이지를 Notion 최신 내용으로 다시 만든다.
export default function RefreshSiteButton() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="ml-auto flex items-center gap-2">
      {message && <span className="text-[12px] text-ink-muted">{message}</span>}
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await refreshSite();
            setMessage(result.message);
          })
        }
        className="shrink-0 px-3 py-1 rounded-full text-[12px] font-medium border border-hairline bg-canvas text-ink hover:border-primary/50 transition-colors disabled:opacity-50"
      >
        {pending ? '새로고침 중…' : '사이트 새로고침'}
      </button>
    </div>
  );
}
