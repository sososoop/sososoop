import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';


export const metadata: Metadata = {
  title: '소소숲 소개',
  description:
    '작은 것이 자라서 특별한 것이 됩니다. 언어재활사와 교육 전문가를 위한 배움·기록·나눔 공간, 소소숲을 소개합니다.',
};

export default function AboutPage() {
  return (
    <>
      {/* 히어로 */}
      <section className="relative overflow-hidden bg-tile-dark min-h-[500px] py-24 md:py-32 px-6">
        <img src="/images/about-hero.png" alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 max-w-[800px] mx-auto text-center">
          <div className="flex justify-center mb-8">
            <Image src="/images/sososoop-logo-white.png" alt="소소숲 로고" width={80} height={80} />
          </div>
          <h1 className="text-[40px] md:text-[56px] font-semibold tracking-tight text-white mb-5">
            소소숲:지혜의 기록소
          </h1>
          <p className="text-[21px] text-white/80 mb-6">
            작은 것이 자라서 특별한 것이 됩니다.
          </p>
          <p className="text-[17px] text-white/70 leading-[1.47] max-w-[560px] mx-auto">
            언어재활사와 교육 전문가들이 배움과 기록을 통해 함께 성장하는<br />따뜻한 지식 공동체입니다.
          </p>
        </div>
      </section>

      {/* 비전 */}
      <section className="relative overflow-hidden bg-canvas py-24 px-6">
        <img src="/images/about-mission.png" alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-white/80" />
        <div className="relative z-10 max-w-[800px] mx-auto">
          <h2 className="text-[34px] font-semibold tracking-tight text-ink mb-8">VISION</h2>

          <p className="text-[20px] font-medium text-ink leading-[1.6] mb-6">
            배움이 기록이 되고,<br />
            기록이 나눔이 되며,<br />
            나눔이 다시 누군가의 성장으로 이어지는 공간을 만듭니다.
          </p>
          <p className="text-[16px] text-ink-muted leading-[1.8] mb-4">
            소소숲은 언어재활사와 교육 전문가들이 각자의 현장에서 쌓아온 경험을 따뜻하게 기록하고, AI와 디지털 도구를 활용해 더 효율적으로 일하며, 서로의 시도와 고민을 나누는 지식 공동체를 꿈꿉니다.
          </p>
          <p className="text-[16px] text-ink-muted leading-[1.8] mb-14">
            작은 배움 하나, 짧은 기록 하나가 모여 더 나은 실천이 되고, 그 실천이 다시 누군가에게 용기와 방향이 되는 숲. 소소숲은 그런 성장을 오래도록 함께 가꾸는 기록소가 되고자 합니다.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: '기록하는 배움', desc: '배움은 기록될 때 오래 남고, 나눌 수 있는 지식이 됩니다.' },
              { title: '나누는 지혜', desc: '혼자만의 경험을 함께 나누며 서로의 시행착오를 줄입니다.' },
              { title: '자라는 실천', desc: '작은 시도와 꾸준한 적용이 현장의 변화를 만듭니다.' },
            ].map((card) => (
              <div key={card.title} className="bg-white/75 rounded-[16px] p-6 border border-black/8">
                <h3 className="text-[16px] font-semibold text-ink mb-2">{card.title}</h3>
                <p className="text-[14px] text-ink-muted leading-[1.7]">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 운영자 소개 */}
      <section className="relative overflow-hidden bg-parchment py-20 px-6">
        <img src="/images/about-hero2.png" alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-white/75" />
        <div className="relative z-10 max-w-[800px] mx-auto">
          <h2 className="text-[34px] font-semibold tracking-tight text-ink mb-10">ABOUT</h2>

          {/* 프로필 카드 */}
          <div className="bg-canvas rounded-[24px] p-8 mb-8 border border-hairline">
            <h3 className="text-[24px] font-semibold text-ink mb-1">언어재활사 이승윤</h3>
            <p className="text-[15px] text-ink-muted mb-5">기록으로 배움을 잇는 사람</p>
            <p className="text-[14px] text-primary font-semibold mb-6">
              언어재활사 · AI 활용 강사 · 교육 콘텐츠 제작자
            </p>
            <p className="text-[15px] text-ink-muted leading-[1.7] mb-4">
              임상 현장에서 일하며 늘 이런 질문을 품었습니다.<br />
              "더 효율적으로 일하고, 더 잘 기록하고, 더 따뜻하게 나눌 수는 없을까?"
            </p>
            <p className="text-[15px] text-ink-muted leading-[1.7]">
              AI 도구를 활용해 임상 업무를 효율화하고, 그 경험을 강의와 콘텐츠로 나누고 있습니다. 소소숲은 그 여정에서 시작된 배움과 기록의 공간입니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 경력 */}
            <div className="bg-canvas rounded-[18px] p-6 border border-hairline">
              <p className="text-[13px] font-semibold text-primary mb-4 tracking-wide">경력</p>
              <ul className="flex flex-col gap-2">
                {[
                  '現) 라온 정신건강의학과 언어치료사',
                  '前) 송정중 신경정신과 언어치료사',
                  '前) 햇살소아정신과 언어치료사',
                  '前) 참빛아동발달센터 언어치료사',
                  '캔바 크리에이터 / 미리캔버스 기여자',
                  '선생님을 위한 캔바 AI 크리에이터 LAB 운영',
                ].map((item) => (
                  <li key={item} className="text-[14px] text-ink-muted leading-relaxed flex gap-2">
                    <span className="text-primary mt-0.5 flex-none">·</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* 자격 */}
            <div className="bg-canvas rounded-[18px] p-6 border border-hairline">
              <p className="text-[13px] font-semibold text-primary mb-4 tracking-wide">자격</p>
              <ul className="flex flex-col gap-2">
                {[
                  '언어재활사 1급 (보건복지부)',
                  '보육교사 1급 (보건복지부)',
                  '미술심리상담사 1급 (한국임상미술심리상담학회)',
                  '모래놀이심리상담사 1급 (한국교육심리협회)',
                  '난독교육 전문가 3급 (국민대학교 난독교육연구소)',
                  'JSC 주니어 코치 (여성가족부소관 주니어사회단체)',
                  '캔바 디지털콘텐츠 강사 (국제디지털콘텐츠협회)',
                  '생성형 AI 디지털콘텐츠 강사 (국제디지털콘텐츠협회)',
                ].map((item) => (
                  <li key={item} className="text-[14px] text-ink-muted leading-relaxed flex gap-2">
                    <span className="text-primary mt-0.5 flex-none">·</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* 학력 */}
            <div className="bg-canvas rounded-[18px] p-6 border border-hairline">
              <p className="text-[13px] font-semibold text-primary mb-4 tracking-wide">학력</p>
              <ul className="flex flex-col gap-2">
                {[
                  '미술치료학 석사',
                  '언어치료학 학사',
                  '아동학 · 특수교육학 학사',
                ].map((item) => (
                  <li key={item} className="text-[14px] text-ink-muted leading-relaxed flex gap-2">
                    <span className="text-primary mt-0.5 flex-none">·</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* 전문 과정 */}
            <div className="bg-canvas rounded-[18px] p-6 border border-hairline">
              <p className="text-[13px] font-semibold text-primary mb-4 tracking-wide">전문 과정 수료</p>
              <ul className="flex flex-col gap-2">
                {[
                  '난독증 및 읽기부진 중재 전문가 과정',
                  '영어 난독 중재 전문가 과정 (English Phonics Specialist Course for SLPs)',
                  '읽기·쓰기 장애 전문가 심화과정 (의사소통 및 학습장애 아동)',
                ].map((item) => (
                  <li key={item} className="text-[14px] text-ink-muted leading-relaxed flex gap-2">
                    <span className="text-primary mt-0.5 flex-none">·</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-tile-dark py-20 px-6 text-center">
        <h2 className="text-[34px] font-semibold text-on-dark mb-4">함께 성장을 시작하세요.</h2>
        <p className="text-[17px] text-on-dark/70 mb-8">
          강의와 자료로 소소숲을 경험해보세요.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/lectures"
            className="px-6 py-3 rounded-full bg-primary text-white text-[17px] hover:bg-primary-dark transition-colors"
          >
            강의 보러가기
          </Link>
          <Link
            href="/resources"
            className="px-6 py-3 rounded-full border border-on-dark/30 text-on-dark text-[17px] hover:border-on-dark/60 transition-colors"
          >
            자료 보러가기
          </Link>
        </div>
      </section>
    </>
  );
}
