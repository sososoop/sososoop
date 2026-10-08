'use client';

// 무료 LIVE 신청서. 저장은 서버 액션(applyFreeLive)이 하고, 성공하면 페이지가 '신청 완료'로 바뀐다.
import { useActionState } from 'react';
import { applyFreeLive, type ApplyState } from '../actions';

type Props = {
  slug: string;
  defaultName: string;
  email: string;
  examOptions: string[];
  worryOptions: string[];
  offlineOptions: string[];
  dateLabel: string;
  timeLabel: string;
  consent: string;
};

const initial: ApplyState = { ok: false, message: '' };

const label = 'block text-[15px] font-extrabold text-cbt-ink mb-2';
const input =
  'w-full px-4 py-3 border-2 border-cbt-ink bg-white text-[15px] text-cbt-ink placeholder:text-cbt-gray/70 focus:outline-none focus:ring-4 focus:ring-cbt-mint/30';
const req = <span className="text-cbt-red ml-0.5">*</span>;

export default function LiveApplyForm(p: Props) {
  const [state, action, pending] = useActionState(applyFreeLive, initial);

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="slug" value={p.slug} />

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="name" className={label}>이름{req}</label>
          <input id="name" name="name" required maxLength={40} defaultValue={p.defaultName} className={input} />
        </div>
        <div>
          <label htmlFor="phone" className={label}>휴대폰 번호{req}</label>
          <input
            id="phone"
            name="phone"
            required
            inputMode="tel"
            autoComplete="tel"
            placeholder="010-1234-5678"
            aria-describedby="phone-why"
            className={input}
          />
        </div>
      </div>
      <p id="phone-why" className="-mt-3 text-[13px] text-cbt-gray leading-relaxed [word-break:keep-all]">
        📱 LIVE를 잊지 않고 들어오실 수 있도록 <strong className="text-cbt-ink">시작 전에 알림 문자</strong>를 보내 드려요.
      </p>

      <fieldset>
        <legend className={label}>준비 중인 시험{req}</legend>
        <div className="flex flex-wrap gap-2">
          {p.examOptions.map((o) => (
            <label key={o} className="cursor-pointer">
              <input
                type="radio"
                name="exam"
                value={o}
                required
                className="peer sr-only"
              />
              <span className="inline-block px-5 py-2.5 border-2 border-cbt-ink bg-white text-[15px] font-bold peer-checked:bg-cbt-ink peer-checked:text-white peer-focus-visible:ring-4 peer-focus-visible:ring-cbt-mint/40">
                {o}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={label}>CBT에서 가장 걱정되는 부분 <span className="text-[13px] font-semibold text-cbt-gray">(여러 개 선택 가능)</span></legend>
        <div className="grid sm:grid-cols-2 gap-2">
          {p.worryOptions.map((o) => (
            <label key={o} className="flex items-center gap-2.5 px-4 py-3 border-2 border-cbt-ink/15 bg-white cursor-pointer has-[:checked]:border-cbt-mint has-[:checked]:bg-cbt-mint-soft">
              <input type="checkbox" name="worries" value={o} className="w-4 h-4 accent-cbt-mint" />
              <span className="text-[14.5px] font-semibold">{o}</span>
            </label>
          ))}
        </div>
        <input name="worryOther" maxLength={100} placeholder="기타 (직접 적기)" className={`${input} mt-2`} />
      </fieldset>

      <div>
        <label htmlFor="question" className={label}>
          LIVE에서 꼭 묻고 싶은 질문 <span className="text-[13px] font-semibold text-cbt-gray">(선택)</span>
        </label>
        <textarea id="question" name="question" rows={3} maxLength={1000} className={input} />
      </div>

      <fieldset>
        <legend className={label}>소수정예 오프라인 CBT 실전 모의훈련에 관심 있으세요? <span className="text-[13px] font-semibold text-cbt-gray">(선택)</span></legend>
        <div className="flex flex-wrap gap-2">
          {p.offlineOptions.map((o) => (
            <label key={o} className="cursor-pointer">
              <input type="radio" name="offline" value={o} className="peer sr-only" />
              <span className="inline-block px-4 py-2.5 border-2 border-cbt-ink/20 bg-white text-[14.5px] font-semibold peer-checked:border-cbt-ink peer-checked:bg-cbt-ink peer-checked:text-white">
                {o}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-3 border-t-2 border-cbt-ink/10 pt-6">
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" name="attend" value="yes" required className="mt-1 w-5 h-5 accent-cbt-mint shrink-0" />
          <span className="text-[15px] font-bold">
            {p.dateLabel} {p.timeLabel}, 실시간으로 참석할게요.{req}
          </span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" name="agree" value="yes" required className="mt-1 w-5 h-5 accent-cbt-mint shrink-0" />
          <span className="text-[15px] font-bold">
            개인 정보 활용에 동의합니다.{req}
            <span className="block mt-1 text-[13px] font-medium text-cbt-gray leading-relaxed">{p.consent}</span>
          </span>
        </label>
      </div>

      {state.message && !state.ok && (
        <p role="alert" className="px-4 py-3 bg-red-50 border-2 border-cbt-red text-[14px] font-bold text-cbt-red">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full py-4 border-2 border-cbt-ink bg-cbt-mint text-white text-[18px] font-black shadow-[6px_6px_0_0_#1a1a1a] hover:bg-cbt-mint-dark active:translate-x-[3px] active:translate-y-[3px] active:shadow-[3px_3px_0_0_#1a1a1a] transition disabled:opacity-60"
      >
        {pending ? '신청하는 중…' : '무료 LIVE 신청하기'}
      </button>
      <p className="-mt-2 text-center text-[13px] text-cbt-gray">
        {p.email ? `${p.email} 계정으로 신청돼요. ` : ''}ZOOM 접속 링크는 마이페이지에서 확인할 수 있어요.
      </p>
    </form>
  );
}
