import HeroSlider from '@/components/HeroSlider';
import SectionCarousel from '@/components/SectionCarousel';

import { lectures as staticLectures } from '@/data/lectures';
import { paidResources } from '@/data/resources';
import { games as staticFree } from '@/data/games';
import { getResources, getLectures, getGames } from '@/lib/notion';

export const revalidate = 60;

export default async function HomePage() {
  const [notionResources, notionLectures, notionFree] = await Promise.all([
    getResources(),
    getLectures(),
    getGames(),
  ]);

  const free = notionFree ?? staticFree;
  const paid = notionResources ? notionResources.filter((r) => r.type === 'paid') : paidResources;

  const lectures = notionLectures ?? staticLectures;

  const lectureCards = lectures.map((l) => ({
    id: l.id,
    title: l.title,
    description: l.description,
    meta: `${l.price.toLocaleString()}원 · ${l.duration}`,
    href: `/lectures/${l.id}`,
    badge: l.category,
    image: l.image,
  }));

  // 무료(게임 먼저)를 앞에, 유료를 뒤에 놓는다.
  const resourceCards = [
    ...free.map((g) => ({
      id: g.id,
      title: g.title,
      description: g.description,
      meta: `무료 · ${g.format}`,
      href: `/resources#${g.id}`,
      badge: g.areas[0] ?? g.format,
      image: g.image,
    })),
    ...paid.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      meta: `${r.price?.toLocaleString()}원 · ${r.fileType}`,
      href: `/resources/${r.id}`,
      badge: r.category,
      image: r.image,
    })),
  ];

  return (
    <>
      <HeroSlider />

      <SectionCarousel
        title="자료실"
        viewAllHref="/resources"
        cards={resourceCards}
        dark={false}
      />

      <SectionCarousel
        title="강의"
        viewAllHref="/lectures"
        cards={lectureCards}
        dark={false}
      />
    </>
  );
}
