// 무료 학습게임(/resources/games) 데이터.
// 실제 소스는 Notion 「소소숲 무료 학습게임」 표이고, 여기 목록은 Notion을 못 읽을 때만 쓰는 폴백이다.
export type Game = {
  id: string;
  title: string;
  description: string;
  goal: string;
  audiences: string[];
  areas: string[];
  level?: string;
  format: string;
  time: string;
  linkUrl?: string;
  image?: string;
};

export const games: Game[] = [
  {
    id: 'hanja-weather',
    title: '한자 날씨 탐정대',
    description:
      "폭염·폭우·폭설에 똑같이 들어 있는 '사나울 폭(暴)'을 찾아내는 3단계 탐정 게임이에요. 한자 카드를 뒤집고, 같은 한자 단어를 조립하고, 상황 속 단서로 날씨를 구별해요.",
    goal: '한자의 뜻과 음으로 폭염·폭우·폭설 구별하기',
    audiences: ['초고'],
    areas: ['한자어', '어휘'],
    level: '★★',
    format: '게임',
    time: '15분',
    linkUrl: 'https://sososoop.github.io/language-game/',
    image: '/images/games/hanja-weather.webp',
  },
  {
    id: 'direction-quiz',
    title: '방향 쏙쏙 퀴즈',
    description:
      '가로·세로, 왼쪽·오른쪽, 좌·우를 그림을 보며 반복해서 맞혀 보는 퀴즈예요. 틀리면 기억하기 쉬운 힌트가 나오고, 기록이 남아요.',
    goal: '가로·세로, 왼쪽·오른쪽, 좌·우 구별하기',
    audiences: ['유아', '초저'],
    areas: ['공간·방향', '어휘'],
    level: '★',
    format: '퀴즈',
    time: '5분',
    linkUrl: 'https://sososoop.github.io/direction-vocab-quiz/',
    image: '/images/games/direction-quiz.webp',
  },
  {
    id: 'handwriting',
    title: '글씨 연습장 생성기',
    description: '원하는 낱말과 문장을 넣으면 따라 쓰기 연습장을 바로 만들어 인쇄할 수 있어요.',
    goal: '아이 수준에 맞는 따라 쓰기 연습장 만들기',
    audiences: ['선생님용'],
    areas: ['쓰기'],
    format: '만들기 도구',
    time: '5분',
    linkUrl: 'https://sososoop.github.io/korean-handwriting/',
    image: '/images/resource-handwriting-generat.png',
  },
  {
    id: 'job-character-kit',
    title: '직업 체험 캐릭터 키트',
    description:
      '직업·성별·색상을 고르면 자석 스티커형 캐릭터 키트 이미지 프롬프트와 언어치료 활동 초안을 만들어 줘요.',
    goal: '직업 어휘 놀이 자료를 빠르게 준비하기',
    audiences: ['선생님용'],
    areas: ['어휘'],
    format: '만들기 도구',
    time: '10분',
    linkUrl: 'https://sososoop.github.io/job-character-kit/',
    image: '/images/games/job-character-kit.webp',
  },
];
