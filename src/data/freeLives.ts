// 무료 LIVE(줌 특강) 소개·일정. 신청 기록과 ZOOM 링크는 Supabase(db/free_lives.sql)에 있다.
// 새 LIVE를 열 때는 이 배열에 하나를 더하고, 관리자 화면(/admin/lives)에서 ZOOM 링크를 넣는다.

export type FreeLive = {
  slug: string; // 주소: /lectures/live/<slug>
  title: string;
  kicker: string; // 제목 위 작은 줄
  summary: string; // 목록·검색용 한 줄
  startsAt: string; // ISO(+09:00)
  dateLabel: string; // 화면 표기
  timeLabel: string;
  place: string;
  worries: string[]; // 공감 문구
  topics: string[]; // 다루는 내용
  excluded: string[]; // 이번에 다루지 않는 것
  notes: string[]; // 미리 알려 드릴 것
  offline: string;
  // 신청서 선택지
  examOptions: string[];
  worryOptions: string[];
  offlineOptions: string[];
};

export const FREE_LIVES: FreeLive[] = [
  {
    slug: 'cbt-1013',
    title: '언어재활사 CBT 실전 적응 무료 LIVE',
    kicker: '시험 전에 한번 같이 봐요',
    summary: '시험 전에 실제 CBT 환경을 어떻게 연습하면 좋을지 같이 보는 무료 LIVE',
    startsAt: '2026-10-13T21:00:00+09:00',
    dateLabel: '2026년 10월 13일 (화)',
    timeLabel: '저녁 9시',
    place: 'ZOOM',
    worries: [
      'CBT 화면이 낯설면 어떡하지?',
      '답 수정하다가 실수하면?',
      '시간 안에 다 풀 수 있을까?',
      '시험장에서 조작 때문에 당황하면 어떡하지?',
    ],
    topics: [
      '제가 실제 CBT를 응시하면서 느꼈던 점',
      '시험 전에 꼭 익혀두면 좋은 기능',
      '시간관리 연습 포인트',
      '문제 이동 · 답안 수정 · 화면 조작',
      '모의 CBT 실제 화면 시연',
      '오답노트와 취약영역 활용법',
      'Q&A',
    ],
    excluded: ['과목별 문제풀이', '암기법', '공부전략', '기출문제 해설'],
    notes: [
      '직접 개발한 유료 모의 CBT 프로그램 소개와 시연이 포함되어 있어요. 다만 프로그램 구매는 전혀 필수가 아니에요.',
      '무료로 진행되는 만큼 실제로 참석 가능하신 분들만 신청해 주세요 :)',
    ],
    offline:
      '혼자 CBT를 연습하는 게 어려운 선생님들을 위한 소수정예 오프라인 CBT 실전 모의훈련도 준비해 보려고 해요. LIVE에서 관심 있는 분들을 먼저 확인한 뒤 일정과 장소를 결정할 예정이에요.',
    examOptions: ['1급', '2급'],
    worryOptions: [
      'CBT 화면이 낯설어요',
      '답 수정하다가 실수할까 봐 걱정돼요',
      '시간 안에 다 풀 수 있을지 걱정돼요',
      '문제 이동·화면 조작이 헷갈려요',
    ],
    offlineOptions: ['관심 있어요', '일정·장소를 보고 결정할게요', '아직은 괜찮아요'],
  },
];

export function getFreeLive(slug: string): FreeLive | undefined {
  return FREE_LIVES.find((l) => l.slug === slug);
}

// 시작 시각이 지나면 신청을 닫는다.
export function isLiveOpen(live: FreeLive, now = Date.now()): boolean {
  return now < new Date(live.startsAt).getTime();
}

// LIVE가 끝난 것으로 보는 시각(시작 + 3시간) — 마이페이지에서 '지난 LIVE'로 접는다.
export function isLiveOver(live: FreeLive, now = Date.now()): boolean {
  return now > new Date(live.startsAt).getTime() + 3 * 60 * 60 * 1000;
}

// 개인정보 활용 동의 문구(기존 신청서와 같은 구성)
export const FREE_LIVE_CONSENT =
  '1. 수집 항목: 이름, 연락처, 이메일 · 2. 수집 목적: LIVE 접속 안내, 강의·프로그램 안내 · 3. 이용 기간: 1년';
