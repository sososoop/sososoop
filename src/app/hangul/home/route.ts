// 한글놀이 가정과제 링크용 보호자 주소 — 로그인·이용권 없이 열린다.
// 선생님이 앱(/hangul/app)에서 만든 링크(/hangul/home#hw=…)로 들어오면 그 진도로 잠긴 '놀이' 화면만 뜬다.
// #hw 가 없거나 손상되면 앱이 안내 문구만 보여 준다(window.__HW_ONLY__).
import { NextResponse } from 'next/server';
import appHtml from '../app-html.json';

export async function GET() {
  const html = (appHtml as string).replace('<head>', '<head><script>window.__HW_ONLY__=true</script>');
  return new NextResponse(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=300',
      'x-robots-tag': 'noindex, nofollow',
    },
  });
}
