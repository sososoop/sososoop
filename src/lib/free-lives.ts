// 무료 LIVE 신청·ZOOM 링크 — 서버 전용. 신청 기록과 링크는 service_role 키로만 읽고 쓴다.
import { createAdminClient } from '@/lib/supabase/admin';
import { FREE_LIVES, getFreeLive, isLiveOver, isMaterialsOpen, isReplaySignup, type FreeLive } from '@/data/freeLives';

export type LiveRegistration = {
  id: string;
  eventSlug: string;
  userId: string;
  email: string | null;
  name: string;
  phone: string;
  instagram: string | null;
  exam: string | null;
  worries: string[];
  question: string | null;
  offlineInterest: string | null;
  createdAt: string;
  canceledAt: string | null;
};

export type LiveZoom = { url: string | null; note: string | null };
// 다시보기(녹화본) 링크 — 저장소가 공개라 코드가 아니라 DB에 둔다. 신청자 전원에게 보인다.
export type LiveReplay = { url: string | null; note: string | null };
type EventRow = { zoom: LiveZoom; replay: LiveReplay };
const EMPTY: EventRow = { zoom: { url: null, note: null }, replay: { url: null, note: null } };

// 마이페이지용: 내가 신청한 LIVE와 (있으면) ZOOM 링크
export type MyLive = {
  live: FreeLive;
  over: boolean;
  replay: boolean; // 좌석 마감 뒤 '다시보기 신청' — ZOOM 링크를 보여 주지 않는다
  materialsOpen: boolean; // 강의 자료 다운로드 버튼을 보여 줄 때
  zoom: LiveZoom;
  replayLink: LiveReplay;
};

type Row = Record<string, unknown>;

function toRegistration(r: Row): LiveRegistration {
  return {
    id: String(r.id),
    eventSlug: String(r.event_slug),
    userId: String(r.user_id),
    email: (r.email as string | null) ?? null,
    name: String(r.name ?? ''),
    phone: String(r.phone ?? ''),
    instagram: (r.instagram as string | null) ?? null,
    exam: (r.exam as string | null) ?? null,
    worries: Array.isArray(r.worries) ? (r.worries as string[]) : [],
    question: (r.question as string | null) ?? null,
    offlineInterest: (r.offline_interest as string | null) ?? null,
    createdAt: String(r.created_at),
    canceledAt: (r.canceled_at as string | null) ?? null,
  };
}

// 이 LIVE에 내가 (취소하지 않고) 신청해 두었는지
export async function getMyRegistration(slug: string, userId: string): Promise<LiveRegistration | null> {
  const db = createAdminClient();
  if (!db) return null;
  const { data, error } = await db
    .from('free_live_registrations')
    .select('*')
    .eq('event_slug', slug)
    .eq('user_id', userId)
    .is('canceled_at', null)
    .maybeSingle();
  if (error || !data) return null;
  return toRegistration(data);
}

async function eventMap(slugs: string[]): Promise<Map<string, EventRow>> {
  const db = createAdminClient();
  const map = new Map<string, EventRow>();
  if (!db || slugs.length === 0) return map;
  const { data } = await db
    .from('free_live_events')
    .select('slug, zoom_url, zoom_note, replay_url, replay_note')
    .in('slug', slugs);
  for (const r of data ?? []) {
    map.set(String(r.slug), {
      zoom: { url: r.zoom_url ?? null, note: r.zoom_note ?? null },
      replay: { url: r.replay_url ?? null, note: r.replay_note ?? null },
    });
  }
  return map;
}

export async function getLiveZoom(slug: string): Promise<LiveZoom> {
  return ((await eventMap([slug])).get(slug) ?? EMPTY).zoom;
}

// 마이페이지: 내가 신청한 LIVE 목록(가까운 순), 신청자에게만 ZOOM 링크를 붙인다.
export async function getMyLives(userId: string): Promise<MyLive[]> {
  const db = createAdminClient();
  if (!db) return [];
  const { data, error } = await db
    .from('free_live_registrations')
    .select('event_slug, created_at')
    .eq('user_id', userId)
    .is('canceled_at', null);
  if (error) return [];
  const mine = (data ?? [])
    .map((r) => ({ live: getFreeLive(String(r.event_slug)), createdAt: String(r.created_at) }))
    .filter((m): m is { live: FreeLive; createdAt: string } => !!m.live)
    .sort((a, b) => a.live.startsAt.localeCompare(b.live.startsAt));
  const events = await eventMap(mine.map((m) => m.live.slug));
  return mine.map(({ live, createdAt }) => {
    const replay = isReplaySignup(live, createdAt);
    const ev = events.get(live.slug) ?? EMPTY;
    return {
      live,
      over: isLiveOver(live),
      replay,
      materialsOpen: isMaterialsOpen(live),
      zoom: replay ? EMPTY.zoom : ev.zoom,
      replayLink: ev.replay,
    };
  });
}

// 관리자: LIVE별 신청자(취소 포함)와 ZOOM 링크. 표가 없으면 tableReady=false.
export async function listLiveRegistrations(): Promise<{
  tableReady: boolean;
  events: { live: FreeLive; zoom: LiveZoom; replay: LiveReplay; registrations: LiveRegistration[] }[];
} | null> {
  const db = createAdminClient();
  if (!db) return null;
  const { data, error } = await db
    .from('free_live_registrations')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) return { tableReady: false, events: FREE_LIVES.map((live) => ({ live, ...EMPTY, registrations: [] })) };
  const rows = (data ?? []).map(toRegistration);
  const events = await eventMap(FREE_LIVES.map((l) => l.slug));
  return {
    tableReady: true,
    events: [...FREE_LIVES]
      .sort((a, b) => b.startsAt.localeCompare(a.startsAt))
      .map((live) => ({
        live,
        ...(events.get(live.slug) ?? EMPTY),
        registrations: rows.filter((r) => r.eventSlug === live.slug),
      })),
  };
}
