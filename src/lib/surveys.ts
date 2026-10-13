// 설문 응답 — 서버 전용. 응답과 연락처는 service_role 키로만 읽고 쓴다.
import { createAdminClient } from '@/lib/supabase/admin';
import { SURVEYS, type Survey } from '@/data/surveys';

export type SurveyAnswers = Record<string, string | string[]>;

export type SurveyResponse = {
  id: string;
  surveySlug: string;
  userId: string;
  email: string | null;
  answers: SurveyAnswers;
  name: string | null;
  contact: string | null;
  createdAt: string;
  updatedAt: string;
};

type Row = Record<string, unknown>;

function toResponse(r: Row): SurveyResponse {
  return {
    id: String(r.id),
    surveySlug: String(r.survey_slug),
    userId: String(r.user_id),
    email: (r.email as string | null) ?? null,
    answers: r.answers && typeof r.answers === 'object' ? (r.answers as SurveyAnswers) : {},
    name: (r.name as string | null) ?? null,
    contact: (r.contact as string | null) ?? null,
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at ?? r.created_at),
  };
}

// 이 설문에 내가 남긴 응답(없으면 null)
export async function getMySurveyResponse(slug: string, userId: string): Promise<SurveyResponse | null> {
  const db = createAdminClient();
  if (!db) return null;
  const { data, error } = await db
    .from('survey_responses')
    .select('*')
    .eq('survey_slug', slug)
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return toResponse(data);
}

// 관리자: 설문별 응답 목록. 표가 없으면 tableReady=false.
export async function listSurveyResponses(): Promise<{
  tableReady: boolean;
  surveys: { survey: Survey; responses: SurveyResponse[] }[];
} | null> {
  const db = createAdminClient();
  if (!db) return null;
  const { data, error } = await db.from('survey_responses').select('*').order('created_at', { ascending: true });
  if (error) return { tableReady: false, surveys: SURVEYS.map((survey) => ({ survey, responses: [] })) };
  const rows = (data ?? []).map(toResponse);
  return {
    tableReady: true,
    surveys: SURVEYS.map((survey) => ({ survey, responses: rows.filter((r) => r.surveySlug === survey.slug) })),
  };
}
