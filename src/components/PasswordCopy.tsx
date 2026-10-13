'use client';

// 마이페이지 무료 LIVE: 암호만 한 번에 복사하는 칸(ZOOM·녹화본 공통)
import { useState } from 'react';

export default function PasswordCopy({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // 클립보드 API를 쓸 수 없는 환경 대비 폴백
      const el = document.createElement('textarea');
      el.value = value;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="inline-flex items-stretch rounded-full border border-primary/30 bg-canvas overflow-hidden">
      <span className="pl-4 pr-3 py-2 text-[13px] text-ink-muted">
        암호 <strong className="font-mono text-[14px] text-ink select-all">{value}</strong>
      </span>
      <button
        type="button"
        onClick={handleCopy}
        aria-label="암호 복사"
        className={`px-4 text-[13px] font-semibold transition-colors active:scale-95 ${
          copied ? 'bg-primary text-white' : 'bg-primary/10 text-primary hover:bg-primary/20'
        }`}
      >
        {copied ? '복사됨 ✓' : '복사'}
      </button>
    </div>
  );
}
