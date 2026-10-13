'use client';

// 설문 응답서. 저장은 서버 액션(submitSurvey)이 하고, 성공하면 페이지가 '감사 인사'로 바뀐다.
import { startTransition, useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitSurvey, type SurveyState } from '../actions';
import { OTHER_PREFIX, type Survey } from '@/data/surveys';
import type { SurveyAnswers } from '@/lib/surveys';

type Props = {
  survey: Survey;
  email: string;
  defaultName: string;
  previous: { answers: SurveyAnswers; name: string | null; contact: string | null } | null;
};

const initial: SurveyState = { ok: false, message: '' };

const label = 'block text-[15px] font-extrabold text-cbt-ink mb-2';
const input =
  'w-full px-4 py-3 border-2 border-cbt-ink bg-white text-[15px] text-cbt-ink placeholder:text-cbt-gray/70 focus:outline-none focus:ring-4 focus:ring-cbt-mint/30';
const req = <span className="text-cbt-red ml-0.5">*</span>;
const choice =
  'flex items-center gap-2.5 px-4 py-3 border-2 border-cbt-ink/15 bg-white cursor-pointer has-[:checked]:border-cbt-mint has-[:checked]:bg-cbt-mint-soft';

function Num({ n }: { n: number }) {
  return (
    <span className="mr-2 inline-flex w-7 h-7 align-[-3px] bg-cbt-ink text-white text-[13px] font-black items-center justify-center">{n}</span>
  );
}

export default function SurveyForm({ survey, email, defaultName, previous }: Props) {
  const [state, action, pending] = useActionState(submitSurvey, initial);
  const router = useRouter();
  // 저장되면 (응답 고치기 화면이었어도) 감사 인사 화면으로
  useEffect(() => {
    if (state.ok) router.replace(`/survey/${survey.slug}#form`);
  }, [state, router, survey.slug]);
  const [notify, setNotify] = useState(String(previous?.answers[survey.notify.id] ?? ''));
  const [checkMsg, setCheckMsg] = useState('');
  const before = (id: string) => [previous?.answers[id] ?? []].flat();

  // form action 대신 직접 보낸다 — action으로 보내면 오류가 나도 고른 답이 전부 지워진다.
  // 복수 선택·'기타' 내용은 브라우저가 대신 확인해 주지 않으므로 먼저 확인한다(서버에서도 다시 확인).
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    for (const [i, q] of survey.questions.entries()) {
      const picked = fd.getAll(q.id);
      if (picked.length === 0) return setCheckMsg(`${i + 1}번 문항을 골라 주세요.`);
      if (picked.includes('기타') && !String(fd.get(`${q.id}Other`) ?? '').trim()) return setCheckMsg(`${i + 1}번 '기타' 내용을 적어 주세요.`);
    }
    setCheckMsg('');
    startTransition(() => action(fd));
  };
  const message = checkMsg || (!state.ok ? state.message : '');

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-8">
      <input type="hidden" name="slug" value={survey.slug} />

      {survey.questions.map((q, i) => {
        const prev = before(q.id);
        const prevOther = prev.find((v) => v.startsWith(OTHER_PREFIX))?.slice(OTHER_PREFIX.length) ?? '';
        const type = q.multi ? 'checkbox' : 'radio';
        const short = q.options.every((o) => o.length <= 12); // 짧은 보기는 휴대폰에서도 두 줄로
        return (
          <fieldset key={q.id}>
            <legend className={`${label} leading-snug [word-break:keep-all]`}>
              <Num n={i + 1} />
              {q.title}
              {req}
              {q.hint && <span className="ml-1 text-[13px] font-semibold text-cbt-gray">({q.hint})</span>}
            </legend>
            <div className={`grid ${short ? 'grid-cols-2' : 'sm:grid-cols-2'} gap-2`}>
              {q.options.map((o) => (
                <label key={o} className={choice}>
                  <input
                    type={type}
                    name={q.id}
                    value={o}
                    defaultChecked={prev.includes(o)}
                    required={!q.multi}
                    className="w-4 h-4 shrink-0 accent-cbt-mint"
                  />
                  <span className="text-[14.5px] font-semibold [word-break:keep-all]">{o}</span>
                </label>
              ))}
              {q.other && (
                <label className={`${choice} ${short ? 'col-span-2' : 'sm:col-span-2'}`}>
                  <input
                    id={`${q.id}-other`}
                    type={type}
                    name={q.id}
                    value="기타"
                    defaultChecked={!!prevOther}
                    className="w-4 h-4 shrink-0 accent-cbt-mint"
                  />
                  <span className="text-[14.5px] font-semibold shrink-0">기타:</span>
                  <input
                    name={`${q.id}Other`}
                    maxLength={100}
                    defaultValue={prevOther}
                    placeholder="직접 적기"
                    aria-label={`${i + 1}번 기타 내용`}
                    onChange={(e) => {
                      // 적기 시작하면 '기타'를 자동으로 고른다
                      const box = document.getElementById(`${q.id}-other`) as HTMLInputElement | null;
                      if (box && e.currentTarget.value.trim()) box.checked = true;
                    }}
                    className="flex-1 min-w-0 px-2 py-1 border-b-2 border-cbt-ink/30 bg-transparent text-[14.5px] focus:outline-none focus:border-cbt-mint"
                  />
                </label>
              )}
            </div>
          </fieldset>
        );
      })}

      <fieldset>
        <legend className={`${label} leading-snug [word-break:keep-all]`}>
          <Num n={survey.questions.length + 1} />
          {survey.notify.title}
          {req}
        </legend>
        <div className="flex flex-wrap gap-2">
          {[survey.notify.yes, survey.notify.no].map((o) => (
            <label key={o} className="cursor-pointer">
              <input
                type="radio"
                name={survey.notify.id}
                value={o}
                required
                checked={notify === o}
                onChange={() => setNotify(o)}
                className="peer sr-only"
              />
              <span className="inline-block px-5 py-2.5 border-2 border-cbt-ink bg-white text-[15px] font-bold peer-checked:bg-cbt-ink peer-checked:text-white peer-focus-visible:ring-4 peer-focus-visible:ring-cbt-mint/40">
                {o}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {notify === survey.notify.yes && (
        <fieldset className="bg-cbt-mint-soft border-2 border-cbt-mint p-5 md:p-6 flex flex-col gap-5">
          <legend className="sr-only">연락 정보</legend>
          <p className="text-[15px] font-extrabold leading-snug [word-break:keep-all]">
            <Num n={survey.questions.length + 2} />
            {survey.notify.contactTitle}
          </p>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="name" className={label}>이름{req}</label>
              <input id="name" name="name" required maxLength={40} defaultValue={previous?.name ?? defaultName} className={input} />
            </div>
            <div>
              <label htmlFor="contact" className={label}>연락처 또는 카카오톡 ID{req}</label>
              <input
                id="contact"
                name="contact"
                required
                maxLength={60}
                defaultValue={previous?.contact ?? ''}
                placeholder="010-1234-5678 또는 카톡 ID"
                className={input}
              />
            </div>
          </div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" name="agree" value="yes" required className="mt-1 w-5 h-5 accent-cbt-mint shrink-0" />
            <span className="text-[15px] font-bold">
              개인 정보 활용에 동의합니다.{req}
              <span className="block mt-1 text-[13px] font-medium text-cbt-gray leading-relaxed">{survey.consent}</span>
            </span>
          </label>
        </fieldset>
      )}

      <div className="bg-[#fff8db] border-2 border-cbt-ink p-5 md:p-6 shadow-[6px_6px_0_0_#1a1a1a]">
        <p className="text-[16px] font-black">🎟️ 설문 응답자 우선 안내</p>
        <div className="mt-2 flex flex-col gap-1.5 text-[14.5px] font-semibold text-[#3a3a36] leading-relaxed [word-break:keep-all]">
          {survey.perk.map((t) => (
            <p key={t}>{t}</p>
          ))}
        </div>
        <p className="mt-3 text-[13px] font-semibold text-cbt-gray leading-relaxed [word-break:keep-all]">※ {survey.perkNote}</p>
      </div>

      {message && (
        <p role="alert" className="px-4 py-3 bg-red-50 border-2 border-cbt-red text-[14px] font-bold text-cbt-red">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full py-4 border-2 border-cbt-ink bg-cbt-mint text-white text-[18px] font-black shadow-[6px_6px_0_0_#1a1a1a] hover:bg-cbt-mint-dark active:translate-x-[3px] active:translate-y-[3px] active:shadow-[3px_3px_0_0_#1a1a1a] transition disabled:opacity-60"
      >
        {pending ? '보내는 중…' : previous ? '응답 고쳐서 보내기' : '설문 보내기'}
      </button>
      <p className="-mt-4 text-center text-[13px] text-cbt-gray">
        {email ? `${email} 계정으로 응답돼요. ` : ''}확정 신청이 아니니 부담 없이 남겨주세요.
      </p>
    </form>
  );
}
