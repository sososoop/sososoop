// 설문(관심자 조사) 문항. 응답은 Supabase(db/surveys.sql)에 있다.
// 새 설문을 열 때는 이 배열에 하나를 더한다. 주소: /survey/<slug>, 결과: /admin/surveys

export type SurveyQuestion = {
  id: string; // 응답 저장 키
  title: string;
  hint?: string; // 제목 옆 작은 안내
  multi: boolean; // 복수 선택
  options: string[];
  other: boolean; // '기타: ____' 직접 입력
};

export type Survey = {
  slug: string;
  title: string;
  kicker: string;
  intro: string[]; // 안내문(문단)
  points: string[]; // 진행 방식 목록
  closing: string[]; // 안내문 뒤쪽(문단)
  notice: string; // ※ 확정 신청 아님
  questions: SurveyQuestion[];
  // 마지막 문항: 먼저 안내받기 → '예'를 고르면 이름·연락처를 받는다
  notify: { id: string; title: string; yes: string; no: string; contactTitle: string };
  thanks: string[];
  perk: string[]; // 설문 끝, 보내기 버튼 위: 응답자 우선 안내
  perkNote: string;
  consent: string;
};

export const SURVEYS: Survey[] = [
  {
    slug: 'offline-cbt',
    title: '소수정예 오프라인 CBT 실전 모의훈련 관심자 조사',
    kicker: '혼자 연습하기 어려웠다면',
    intro: [
      '혼자 CBT를 연습하는 게 어렵거나 실제 시험 전에 직접 컴퓨터 앞에서 연습해보고 싶은 선생님들을 위해 오프라인 CBT 실전 모의훈련을 준비하고 있어요.',
      '단순 설명식 강의가 아니라,',
    ],
    points: [
      '실제 시험처럼 CBT 응시',
      '답안 수정 · 문제 이동 · 시간관리 연습',
      '막히는 부분 현장에서 바로 확인',
      '개인별 실수와 어려운 부분 피드백',
    ],
    closing: [
      '을 중심으로 진행할 예정이에요.',
      '한 분 한 분 직접 봐드리기 위해 6명 정도의 소수정예로 생각하고 있어요.',
      '아직 일정과 장소는 확정 전이에요. 실제로 참여를 원하시는 분들의 의견을 먼저 확인한 뒤 결정하려고 합니다 :)',
    ],
    notice: '이 설문은 확정 신청이 아니에요. 부담 없이 남겨주세요.',
    questions: [
      {
        id: 'intent',
        title: '오프라인 CBT 실전 모의훈련이 개설되면 참여 의향이 있으신가요?',
        multi: false,
        options: ['꼭 참여하고 싶어요', '일정이 맞으면 참여하고 싶어요', '아직 고민 중이에요'],
        other: false,
      },
      {
        id: 'times',
        title: '참여 가능한 시간을 모두 선택해주세요.',
        hint: '복수 선택 가능',
        multi: true,
        options: ['평일 오전', '평일 오후', '평일 저녁', '토요일 오전', '토요일 오후', '일요일 오전', '일요일 오후'],
        other: true,
      },
      {
        id: 'region',
        title: '오프라인 진행 지역은 어디가 더 편하신가요?',
        multi: false,
        options: ['서울역권', '강남권', '수서역권', '상관없어요'],
        other: false,
      },
      {
        id: 'worries',
        title: 'CBT 시험에서 가장 걱정되는 부분은 무엇인가요?',
        hint: '복수 선택 가능',
        multi: true,
        options: [
          '컴퓨터 조작 자체가 익숙하지 않아요',
          '문제 이동 · 답안 수정이 걱정돼요',
          '제한시간 안에 끝까지 푸는 게 걱정돼요',
          '실제 시험처럼 처음부터 끝까지 풀어본 경험이 없어요',
          '계산기 · 종이 활용이 걱정돼요',
          '시험 화면 자체가 낯설어요',
        ],
        other: true,
      },
      {
        id: 'priority',
        title: '2~3시간 정도의 소수정예 실전훈련이라면, 참여를 결정할 때 가장 중요한 것은 무엇인가요?',
        multi: false,
        options: ['날짜 · 시간', '장소', '수강료', '소수정예 인원', '개인별 피드백', '실제 CBT 실습시간'],
        other: true,
      },
    ],
    notify: {
      id: 'notify',
      title: '오프라인 일정이 확정되면 먼저 안내받으시겠어요?',
      yes: '네, 먼저 안내받고 싶어요',
      no: '아니요',
      contactTitle: '먼저 안내받기를 원하시면 연락 가능한 정보를 남겨주세요.',
    },
    thanks: [
      '설문 결과를 참고해서 실제 참여하기 가장 좋은 일정과 장소를 정해볼게요.',
      '오프라인 CBT 실전 모의훈련 일정이 확정되면 먼저 안내드리겠습니다.',
      '확정 신청은 그때 다시 받을 예정이에요.',
    ],
    perk: [
      '설문에 응답해주신 선생님께는 오프라인 일정이 확정되면 일반 모집보다 먼저 안내드릴게요.',
      '소수정예로 진행되는 만큼 설문 응답자분들께 우선 신청 기회를 드린 뒤, 남은 자리가 있을 경우 일반 모집을 진행할 예정이에요.',
    ],
    perkNote: '설문 작성만으로 신청이 확정되는 것은 아니며, 추후 안내드리는 기간 내 신청 완료 순으로 확정돼요.',
    consent:
      '1. 수집 항목: 이름, 연락처 또는 카카오톡 ID, 이메일 · 2. 수집 목적: 오프라인 CBT 실전 모의훈련 일정 안내 · 3. 이용 기간: 1년',
  },
];

export function getSurvey(slug: string): Survey | undefined {
  return SURVEYS.find((s) => s.slug === slug);
}

export const OTHER_PREFIX = '기타: ';
