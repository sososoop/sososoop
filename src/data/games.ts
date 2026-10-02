// 자료실 '무료 자료' 탭 데이터(게임·도구·GPT·PDF).
// 실제 소스는 Notion 「소소숲 무료 자료」 표이고, 여기 목록은 Notion을 못 읽을 때만 쓰는 폴백이다.
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
  fileUrl?: string;
  downloadName?: string;
  image?: string;
};

export const games: Game[] = [
  {
    id: 'mushroom-explorer',
    title: '버섯 탐험대',
    description:
      "숲길 정거장 다섯 곳을 돌며 독버섯을 '~처럼'으로 말해 보는 게임이에요. '처럼' 찾기, 세 칸 문장 맞추기, 이름 속 숨은 낱말, 닮은 것 고르기, 안전 약속 O X를 마치면 대원증을 받아요.",
    goal: "'~처럼'으로 닮은 점을 말하는 비유 표현 익히기",
    audiences: ['초저'],
    areas: ['문장', '어휘'],
    level: '★★',
    format: '게임',
    time: '20분',
    linkUrl: 'https://sososoop.github.io/mushroom-explorer/',
    image: '/images/games/mushroom-explorer.webp',
  },
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
    format: '게임',
    time: '5분',
    linkUrl: 'https://sososoop.github.io/direction-vocab-quiz/',
    image: '/images/games/direction-quiz.webp',
  },
  {
    id: 'handwriting',
    title: '글씨 연습장 생성기',
    description:
      '원하는 단어·문장·문단을 넣으면 받아쓰기·따라쓰기 연습지를 바로 만들어 인쇄하거나 PDF로 저장할 수 있어요. 설치도 비용도 없이 바로 써요.',
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
  {
    id: 'reward-timer',
    title: '약속 별판 · 모래시계 타이머',
    description:
      '잘했을 때 별을 하나씩 채우는 강화판과, 기다리는 시간이 줄어드는 것을 눈으로 보여 주는 모래시계 타이머예요. 별 개수와 1·3·5분 또는 직접 정한 시간으로 쓸 수 있어요.',
    goal: '약속 지키기와 기다리기를 눈으로 보며 연습하기',
    audiences: ['선생님용'],
    areas: ['생활·행동'],
    format: '만들기 도구',
    time: '1~5분',
    linkUrl: 'https://reward-timer.sososoop.chatgpt.site/',
    image: '/images/games/reward-timer.webp',
  },
  {
    id: 'reading-ssokssok-gpt',
    title: '소소숲 vol.2 읽기학습지 생성봇 읽기쏙쏙',
    description:
      '학년과 주제 키워드만 입력하면 수준에 맞는 읽기 지문과 문제, 어휘 정리, 어울리는 그림 프롬프트까지 만들어 주는 학습 자료 제작 GPT예요.',
    goal: '학년·주제에 맞는 읽기 학습지 빠르게 만들기',
    audiences: ['선생님용'],
    areas: ['읽기'],
    format: 'GPT',
    time: '',
    linkUrl:
      'https://chatgpt.com/g/g-69573a7815a48191adc238d9d52711d0-sososup-vol2-irudassaemyi-ilggihagseubji-saengseongbos-ilggissogssog',
    image: '/images/resource-reading-gpt.png',
  },
  {
    id: 'coloring-gpt',
    title: '소소숲 vol.2 색칠공부 공방',
    description:
      '키워드나 이미지를 넣으면 굵은 선과 단순한 형태의 색칠 도안을 만들어 주는 GPT예요. 수업 자료, 워크북, 홈스쿨링에 바로 쓸 수 있어요.',
    goal: '유아·아동용 색칠 도안 만들기',
    audiences: ['선생님용'],
    areas: ['그림·놀이'],
    format: 'GPT',
    time: '',
    linkUrl: 'https://chatgpt.com/g/g-69573d8a5ecc819195704bc43e9b7b1b-sososup-vol-2-saegcilgongbu-gongbang',
    image: '/images/resource-coloring-book-gpt.png',
  },
  {
    id: 'pencil-character-gpt',
    title: '소소숲 vol.2 귀여운 색연필 그림봇 콩이',
    description: '간단한 키워드를 넣으면 감성적인 색연필 스타일 일러스트로 그려 주는 GPT예요.',
    goal: '수업 자료에 쓸 색연필 그림 만들기',
    audiences: ['선생님용'],
    areas: ['그림·놀이'],
    format: 'GPT',
    time: '',
    linkUrl:
      'https://chatgpt.com/g/g-69573f1d39508191b4a42c2c4a9d8da6-sososup-vol-2-gwiyeoun-saegyeonpil-geurimbos-kongi',
    image: '/images/resource-cute-pencil-character-gpt.png',
  },
  {
    id: 'ai-prompt-guide',
    title: '언어재활사를 위한 AI 프롬프트 모음집',
    description: '보고서, 치료계획, 부모상담에 바로 쓸 수 있는 프롬프트 50개를 모은 PDF예요.',
    goal: '보고서·치료계획·부모상담 프롬프트 바로 쓰기',
    audiences: ['선생님용'],
    areas: ['AI 활용'],
    format: 'PDF',
    time: '',
    fileUrl: '/files/언어치료·특수교육 AI 활용 프롬프트 50_무료공유_이루다쌤.pdf',
    downloadName: '언어치료·특수교육 AI 활용 프롬프트 50_소소숲.pdf',
    image: '/images/resource-ai-prompt-guide.png',
  },
  {
    id: 'fluency-exam-analysis',
    title: '유창성장애 기출 문항 경향 분석집',
    description: '1급·2급 언어재활사 국가시험 준비를 위한 유창성장애 기출 경향 분석 자료집이에요.',
    goal: '유창성장애 출제 경향 한눈에 정리하기',
    audiences: ['국시 수험생'],
    areas: ['국시'],
    format: 'PDF',
    time: '',
    fileUrl: '/files/유창성장애_출제경향_이루다쌤.pdf',
    downloadName: '유창성장애_출제경향_소소숲.pdf',
    image: '/images/resource-fluency-exam-analysis.png',
  },
];
