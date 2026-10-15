'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import GiftNotice from '@/components/cbt/GiftNotice';
import { formatKoreanDate } from '@/lib/period';

// 1계정 = 1기기. 서버(/slp-cbt-practice/bind)가 기기 번호를 쿠키로 확인하고, 들어올 때마다 새 번호로 바꾼다.
// 통과하면 CBT 앱(iframe)을 띄운다. 다른 기기면 안내와 [이 기기로 옮기기](/slp-cbt-practice/move)를 보여준다.
// 예전(2026-09-30 전)엔 브라우저가 만든 기기 ID를 localStorage에 두었다 → 남아 있으면 한 번 보내서 새 방식으로 옮기고 지운다.
const LEGACY_KEY = 'slp_cbt_device_id';
const KAKAO_CHAT = 'http://pf.kakao.com/_gngTX/chat';

// 앱(index.html)의 'PC에서 이용해 주세요'와 같은 조건. 휴대폰·세로 태블릿에선 기기를 등록하지 않는다(2026-10-15) —
// 휴대폰으로 먼저 열면 휴대폰이 등록돼서 PC에서 막히는 문의가 가장 많았다.
const PHONE_QUERY = '(max-width:899px) and (pointer:coarse)';
function subscribePhone(onChange: () => void) {
  const mq = matchMedia(PHONE_QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

function legacyDeviceId(): string {
  try {
    return localStorage.getItem(LEGACY_KEY) ?? '';
  } catch {
    return '';
  }
}

type BindResult = { status: number; nextMoveAt: string | null };

// 번호를 바꾸는 요청이 동시에 두 번 가면 뒤의 것이 '다른 기기'로 막힌다 → 한 화면에서는 한 번만 보낸다
let binding: Promise<BindResult> | null = null;
function bindOnce(): Promise<BindResult> {
  binding ??= fetch('/slp-cbt-practice/bind', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ deviceId: legacyDeviceId() }),
  })
    .then(async (res) => {
      const body = (await res.json().catch(() => ({}))) as { nextMoveAt?: string | null };
      return { status: res.status, nextMoveAt: body.nextMoveAt ?? null };
    })
    .finally(() => {
      binding = null;
    });
  return binding;
}

type State = 'checking' | 'ok' | 'conflict' | 'error';

// expiresOn: 이용권이 끝나는 날(예: '2027년 1월 3일'). 관리자 계정은 null.
export default function DeviceGate({ expiresOn }: { expiresOn: string | null }) {
  const [state, setState] = useState<State>('checking');
  // 다른 기기일 때: 이 기기로 옮길 수 있는 날(null = 지금 옮길 수 있음)
  const [nextMoveAt, setNextMoveAt] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);
  const [moveError, setMoveError] = useState(false);
  // 서버 화면에선 모름(null) → 브라우저에서 판단. 태블릿을 가로로 돌리면 바로 다시 판단한다.
  const phone = useSyncExternalStore(subscribePhone, () => matchMedia(PHONE_QUERY).matches, () => null);

  useEffect(() => {
    // 기기 확인 쿠키는 https에서만 오간다 → http://로 들어오면 같은 기기도 '다른 기기'로 막혔다(2026-10-14)
    if (location.protocol === 'http:' && location.hostname !== 'localhost') {
      location.replace(`https://${location.host}${location.pathname}${location.search}${location.hash}`);
      return;
    }
    if (phone !== false) return; // 휴대폰이거나 아직 모름 → 등록하지 않는다
    let alive = true;
    (async () => {
      try {
        const { status, nextMoveAt: next } = await bindOnce();
        if (!alive) return;
        if (status >= 200 && status < 300) {
          try {
            localStorage.removeItem(LEGACY_KEY);
          } catch {
            // no-op
          }
          setState('ok');
        } else if (status === 409) {
          setNextMoveAt(next);
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
  }, [phone]);

  async function moveHere() {
    setMoving(true);
    setMoveError(false);
    try {
      const res = await fetch('/slp-cbt-practice/move', { method: 'POST' });
      const body = (await res.json().catch(() => ({}))) as { nextMoveAt?: string | null };
      if (res.ok) {
        setState('ok');
      } else if (res.status === 429) {
        setNextMoveAt(body.nextMoveAt ?? null);
      } else {
        setMoveError(true);
      }
    } catch {
      setMoveError(true);
    } finally {
      setMoving(false);
    }
  }

  if (state === 'ok') {
    return (
      <div className="w-full flex flex-col" style={{ height: 'calc(100dvh - 2.75rem)' }}>
        {expiresOn && (
          <p className="shrink-0 py-1 text-center text-[12px] text-ink-muted bg-pearl border-b border-hairline">
            이용기간: {expiresOn}까지
          </p>
        )}
        <GiftNotice delay={900} />
        <iframe
          src="/slp-cbt-practice/app"
          title="언어재활사 CBT 연습"
          className="block w-full flex-1 min-h-0 border-0"
          allow="fullscreen; clipboard-write"
        />
      </div>
    );
  }

  const box = 'w-full max-w-[440px] bg-pearl border border-hairline rounded-[18px] p-8 text-center';
  const note = 'text-[14px] text-ink-muted leading-relaxed';
  const nextDate = nextMoveAt ? formatKoreanDate(new Date(nextMoveAt)) : null;

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-5 py-12">
      {phone === true && (
        <div className={box}>
          <p className="text-[40px] leading-none mb-3" aria-hidden>
            💻
          </p>
          <h1 className="text-[19px] font-bold text-ink mb-2">PC에서 이용해 주세요</h1>
          <p className={note}>
            실제 국가시험은 컴퓨터로 치릅니다. PC나 노트북 브라우저에서
            <br />
            <b className="text-ink">sososoop.com/slp-cbt-practice</b>
            <br />
            로 들어오시면 바로 시작돼요.
          </p>
          <p className="mt-4 text-[12.5px] text-ink-light leading-relaxed">
            이 기기는 등록되지 않았어요. 처음 여는 PC가 이용 기기로 등록돼요.
            <br />
            아이패드는 가로로 돌리면 이용할 수 있어요.
          </p>
        </div>
      )}
      {phone !== true && state === 'checking' && (
        <div className={box}>
          <p className="text-[14px] text-ink-muted">이용 환경을 확인하고 있어요…</p>
        </div>
      )}
      {phone !== true && state === 'conflict' && (
        <div className={box}>
          <h1 className="text-[19px] font-bold text-ink mb-2">다른 기기에 등록된 계정이에요</h1>
          <p className={note}>
            이용권은 한 대의 기기(브라우저)에서만 쓸 수 있어요. 다른 기기나 다른 브라우저, 시크릿 창으로 들어왔거나 쿠키를
            지웠을 때 이 화면이 나와요.
          </p>
          {nextDate ? (
            <>
              <p className="mt-4 rounded-[12px] bg-white border border-hairline px-4 py-3 text-[14px] text-ink leading-relaxed">
                기기는 14일에 한 번 옮길 수 있어요.
                <br />
                <b>{nextDate}</b>부터 이 기기로 옮길 수 있어요.
              </p>
              <p className="mt-3 text-[13px] text-ink-muted leading-relaxed">
                지금은 등록된 기기·브라우저로 들어가면 이용할 수 있어요. 급하게 바꿔야 하면{' '}
                <a href={KAKAO_CHAT} target="_blank" rel="noopener noreferrer" className="text-primary font-semibold underline">
                  고객센터
                </a>
                로 알려 주세요.
              </p>
            </>
          ) : (
            <>
              <p className="mt-4 rounded-[12px] bg-white border border-hairline px-4 py-3 text-[13px] text-ink-muted leading-relaxed text-left">
                · 이 기기로 옮기면 이전 기기에서는 더 이상 열리지 않아요.
                <br />· 이전 기기의 응시 기록·오답노트는 옮겨지지 않아요.
                <br />· 옮긴 날부터 <b className="text-ink">14일 동안은 다시 옮길 수 없어요.</b>
              </p>
              <button
                type="button"
                onClick={moveHere}
                disabled={moving}
                className="mt-5 w-full py-3 rounded-full bg-primary text-white text-[15px] font-semibold hover:bg-primary-dark transition-colors disabled:opacity-60"
              >
                {moving ? '옮기는 중…' : '이 기기로 옮기기'}
              </button>
              {moveError && (
                <p className="mt-3 text-[13px] text-red-600">잠시 문제가 있었어요. 다시 눌러 주세요.</p>
              )}
            </>
          )}
        </div>
      )}
      {phone !== true && state === 'error' && (
        <div className={box}>
          <h1 className="text-[19px] font-bold text-ink mb-2">잠시 문제가 있었어요</h1>
          <p className={note}>페이지를 새로고침해 주세요. 계속 안 되면 문의해 주세요.</p>
        </div>
      )}
    </main>
  );
}
