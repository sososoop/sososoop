'use client';

import { useEffect, useState } from 'react';

// 1계정 = 1기기. 서버(/slp-cbt-practice/bind)가 기기 번호를 쿠키로 확인하고, 들어올 때마다 새 번호로 바꾼다.
// 통과하면 CBT 앱(iframe)을 띄운다. 다른 기기면 안내를 보여준다.
// 예전(2026-09-30 전)엔 브라우저가 만든 기기 ID를 localStorage에 두었다 → 남아 있으면 한 번 보내서 새 방식으로 옮기고 지운다.
const LEGACY_KEY = 'slp_cbt_device_id';

function legacyDeviceId(): string {
  try {
    return localStorage.getItem(LEGACY_KEY) ?? '';
  } catch {
    return '';
  }
}

// 번호를 바꾸는 요청이 동시에 두 번 가면 뒤의 것이 '다른 기기'로 막힌다 → 한 화면에서는 한 번만 보낸다
let binding: Promise<number> | null = null;
function bindOnce(): Promise<number> {
  binding ??= fetch('/slp-cbt-practice/bind', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ deviceId: legacyDeviceId() }),
  })
    .then((res) => res.status)
    .finally(() => {
      binding = null;
    });
  return binding;
}

type State = 'checking' | 'ok' | 'conflict' | 'error';

export default function DeviceGate() {
  const [state, setState] = useState<State>('checking');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const status = await bindOnce();
        if (!alive) return;
        if (status >= 200 && status < 300) {
          try {
            localStorage.removeItem(LEGACY_KEY);
          } catch {
            // no-op
          }
          setState('ok');
        } else if (status === 409) {
          setState('conflict');
        } else {
          setState('error');
        }
      } catch {
        if (alive) setState('error');
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (state === 'ok') {
    return (
      <div className="w-full" style={{ height: 'calc(100dvh - 2.75rem)' }}>
        <iframe
          src="/slp-cbt-practice/app"
          title="언어재활사 CBT 연습"
          className="block w-full h-full border-0"
          allow="fullscreen; clipboard-write"
        />
      </div>
    );
  }

  const box = 'w-full max-w-[440px] bg-pearl border border-hairline rounded-[18px] p-8 text-center';

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-5 py-12">
      {state === 'checking' && (
        <div className={box}>
          <p className="text-[14px] text-ink-muted">이용 환경을 확인하고 있어요…</p>
        </div>
      )}
      {state === 'conflict' && (
        <div className={box}>
          <h1 className="text-[19px] font-bold text-ink mb-2">다른 기기에 등록된 계정이에요</h1>
          <p className="text-[14px] text-ink-muted leading-relaxed">
            이 이용권은 한 대의 기기(브라우저)에서만 사용할 수 있어요.
            <br />
            다른 기기나 다른 브라우저에서 들어갔거나, 이 브라우저의 쿠키를 지웠을 때도 이 화면이 나와요.
            <br />
            기기 변경이 필요하면 소소숲 카카오채널로 문의해 주세요.
          </p>
        </div>
      )}
      {state === 'error' && (
        <div className={box}>
          <h1 className="text-[19px] font-bold text-ink mb-2">잠시 문제가 있었어요</h1>
          <p className="text-[14px] text-ink-muted leading-relaxed">
            페이지를 새로고침해 주세요. 계속 안 되면 문의해 주세요.
          </p>
        </div>
      )}
    </main>
  );
}
