'use server';

// 설문 응답 저장. 서버 액션은 누구나 POST할 수 있으므로 로그인과 입력을 매번 다시 확인한다.
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSurvey, OTHER_PREFIX } from '@/data/surveys';
import type { SurveyAnswers } from '@/lib/surveys';

export type SurveyState = { ok: boolean; message: string };

function text(formData: FormData, key: string, max: number): string {
  return String(formData.get(key) ?? '').trim().slice(0, max);
}

export async function submitSurvey(_prev: SurveyState, formData: FormData): Promise<SurveyState> {
  const survey = getSurvey(text(formData, 'slug', 60));
  if (!survey) return { ok: false, message: '찾을 수 없는 설문이에요.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: '로그인한 뒤 응답해 주세요.' };

  // 문항마다: 보기 안의 값만 받고, '기타'를 골랐으면 적은 내용을 '기타: …'로 붙인다.
  const answers: SurveyAnswers = {};
  for (const [n, q] of survey.questions.entries()) {
    const picked = formData
      .getAll(q.id)
      .map((v) => String(v))
      .filter((v) => q.options.includes(v) || (q.other && v === '기타'));
    const other = q.other ? text(formData, `${q.id}Other`, 100) : '';
    if (picked.includes('기타') && !other) return { ok: false, message: `${n + 1}번 '기타' 내용을 적어 주세요.` };
    const values = picked.map((v) => (v === '기타' ? `${OTHER_PREFIX}${other}` : v));
    if (values.length === 0) return { ok: false, message: `${n + 1}번 문항을 골라 주세요.` };
    answers[q.id] = q.multi ? values : values[0];
  }

  const { notify } = survey;
  const wants = text(formData, notify.id, 40);
  if (wants !== notify.yes && wants !== notify.no) {
    return { ok: false, message: `${survey.questions.length + 1}번 문항을 골라 주세요.` };
  }
  answers[notify.id] = wants;

  let name: string | null = null;
  let contact: string | null = null;
  let agreedAt: string | null = null;
  if (wants === notify.yes) {
    name = text(formData, 'name', 40) || null;
    contact = text(formData, 'contact', 60) || null;
    if (!name) return { ok: false, message: '안내받을 이름을 적어 주세요.' };
    if (!contact) return { ok: false, message: '연락처 또는 카카오톡 ID를 적어 주세요.' };
    if (formData.get('agree') !== 'yes') return { ok: false, message: '안내를 받으려면 개인정보 활용에 동의해 주세요.' };
    agreedAt = new Date().toISOString();
  }

  const db = createAdminClient();
  if (!db) return { ok: false, message: '지금은 응답을 받을 수 없어요. 잠시 뒤 다시 시도해 주세요.' };

  // 한 사람이 한 번. 다시 응답하면 같은 행을 고친다.
  const { error } = await db.from('survey_responses').upsert(
    {
      survey_slug: survey.slug,
      user_id: user.id,
      email: user.email ?? null,
      answers,
      name,
      contact,
      agreed_at: agreedAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'survey_slug,user_id' },
  );
  if (error) return { ok: false, message: '응답을 저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.' };

  revalidatePath(`/survey/${survey.slug}`);
  return { ok: true, message: '응답해 주셔서 감사합니다.' };
}
