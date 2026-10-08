'use server';

// 무료 LIVE 신청·취소. 서버 액션은 누구나 POST할 수 있으므로 로그인과 입력을 매번 다시 확인한다.
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getFreeLive, isLiveOpen } from '@/data/freeLives';

export type ApplyState = { ok: boolean; message: string };

function text(formData: FormData, key: string, max: number): string {
  return String(formData.get(key) ?? '').trim().slice(0, max);
}

export async function applyFreeLive(_prev: ApplyState, formData: FormData): Promise<ApplyState> {
  const live = getFreeLive(text(formData, 'slug', 60));
  if (!live) return { ok: false, message: '찾을 수 없는 LIVE예요.' };
  if (!isLiveOpen(live)) return { ok: false, message: '신청이 마감되었어요.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: '로그인한 뒤 신청해 주세요.' };

  const name = text(formData, 'name', 40);
  const phone = text(formData, 'phone', 20).replace(/[^0-9]/g, '');
  const examPick = text(formData, 'exam', 20);
  const worries = formData
    .getAll('worries')
    .map((w) => String(w))
    .filter((w) => live.worryOptions.includes(w));
  const worryOther = text(formData, 'worryOther', 100);
  const question = text(formData, 'question', 1000) || null;
  const offline = text(formData, 'offline', 40);

  if (!name) return { ok: false, message: '이름을 적어 주세요.' };
  if (!/^01[0-9]{8,9}$/.test(phone)) return { ok: false, message: '휴대폰 번호를 다시 확인해 주세요. (예: 010-1234-5678)' };
  if (!live.examOptions.includes(examPick)) return { ok: false, message: '준비 중인 시험을 골라 주세요.' };
  if (formData.get('attend') !== 'yes') return { ok: false, message: '실시간 참석 여부를 확인해 주세요.' };
  if (formData.get('agree') !== 'yes') return { ok: false, message: '개인정보 활용에 동의해 주세요.' };

  const db = createAdminClient();
  if (!db) return { ok: false, message: '지금은 신청을 받을 수 없어요. 잠시 뒤 다시 시도해 주세요.' };

  const row = {
    event_slug: live.slug,
    user_id: user.id,
    email: user.email ?? null,
    name,
    phone: phone.replace(/^(\d{3})(\d{3,4})(\d{4})$/, '$1-$2-$3'),
    exam: examPick,
    worries: worryOther ? [...worries, `기타: ${worryOther}`] : worries,
    question,
    offline_interest: live.offlineOptions.includes(offline) ? offline : null,
    agreed_at: new Date().toISOString(),
    canceled_at: null,
  };
  // 한 사람이 같은 LIVE에 한 번만. 취소했다가 다시 신청하면 같은 행을 되살린다.
  const { error } = await db.from('free_live_registrations').upsert(row, { onConflict: 'event_slug,user_id' });
  if (error) return { ok: false, message: '신청을 저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.' };

  revalidatePath(`/lectures/live/${live.slug}`);
  revalidatePath('/mypage');
  return { ok: true, message: '신청이 완료되었어요.' };
}

export async function cancelFreeLive(formData: FormData) {
  const live = getFreeLive(String(formData.get('slug') ?? ''));
  if (!live) return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const db = createAdminClient();
  if (!db) return;
  await db
    .from('free_live_registrations')
    .update({ canceled_at: new Date().toISOString() })
    .eq('event_slug', live.slug)
    .eq('user_id', user.id)
    .is('canceled_at', null);
  revalidatePath(`/lectures/live/${live.slug}`);
  revalidatePath('/mypage');
}
