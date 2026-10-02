import { redirect } from 'next/navigation';

// 무료 학습게임은 자료실 '무료 자료' 탭으로 합쳤다. 옛 주소로 들어오면 그쪽으로 보낸다.
export default function GamesPage() {
  redirect('/resources');
}
