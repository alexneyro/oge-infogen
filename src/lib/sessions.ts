import { supabase } from './supabase';

export interface SessionPayload {
  mode: 'single' | 'variant' | 'set';
  variant_seed: string | null;
  score: number;
  max_score: number;
  time_spent_seconds: number;
  answers: Record<string, unknown>;
  task_type: number | null;
  assignment_id?: string;
  status?: 'completed' | 'in_progress';
}

export async function saveSession(userId: string, payload: SessionPayload): Promise<void> {
  const { error } = await (supabase as any).from('sessions').insert({
    user_id: userId,
    mode: payload.mode,
    variant_seed: payload.variant_seed,
    score: payload.score,
    max_score: payload.max_score,
    time_spent_seconds: payload.time_spent_seconds,
    answers: payload.answers,
    task_type: payload.task_type,
    status: payload.status ?? 'completed',
    ...(payload.assignment_id ? { assignment_id: payload.assignment_id } : {}),
    created_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function startSession(
  userId: string,
  assignmentId: string,
  variantSeed?: string | null
): Promise<string | null> {
  try {
    const { data: existing, error: findError } = await (supabase as any)
      .from('sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('assignment_id', assignmentId)
      .eq('status', 'in_progress')
      .maybeSingle();

    if (findError) {
      console.error('[startSession] find existing error:', findError);
    }

    if (existing?.id) {
      return existing.id;
    }

    const { data, error } = await (supabase as any)
      .from('sessions')
      .insert({
        user_id: userId,
        assignment_id: assignmentId,
        mode: 'set',
        variant_seed: variantSeed ?? null,
        status: 'in_progress',
        score: null,
        max_score: null,
        answers: {},
        time_spent_seconds: 0,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('[startSession] error:', error);
      return null;
    }
    return data?.id ?? null;
  } catch (e) {
    console.error('[startSession] exception:', e);
    return null;
  }
}

export async function completeSession(
  sessionId: string,
  payload: {
    score: number;
    max_score: number;
    time_spent_seconds: number;
    answers: Record<string, unknown>;
    variant_seed?: string | null;
  }
): Promise<void> {
  const updateData: Record<string, unknown> = {
    status: 'completed',
    score: payload.score,
    max_score: payload.max_score,
    time_spent_seconds: payload.time_spent_seconds,
    answers: payload.answers,
  };
  if (payload.variant_seed !== undefined) {
    updateData.variant_seed = payload.variant_seed;
  }

  const { error } = await (supabase as any)
    .from('sessions')
    .update(updateData)
    .eq('id', sessionId);

  if (error) throw error;
}

export async function updateSessionAnswers(
  sessionId: string,
  answers: Record<string, unknown>,
  timeSpentSeconds?: number,
): Promise<void> {
  const updateData: Record<string, unknown> = { answers };
  if (timeSpentSeconds !== undefined) {
    updateData.time_spent_seconds = timeSpentSeconds;
  }
  const { error } = await (supabase as any)
    .from('sessions')
    .update(updateData)
    .eq('id', sessionId);

  if (error) throw error;
}
