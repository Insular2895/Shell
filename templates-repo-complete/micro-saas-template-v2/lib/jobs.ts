/**
 * lib/jobs.ts
 *
 * CRUD sur la table `jobs`. Le runner crée un job, le marque comme `running`,
 * puis stocke le résultat. Le frontend poll via /api/jobs/[id].
 */

import { createServerClient } from './supabase/server';
import type { RunResult } from '@/config/result.schema';

export type JobStatus = 'pending' | 'running' | 'success' | 'error' | 'cancelled' | 'timed_out';

export type Job = {
  id: string;
  user_id: string;
  product_id: string;
  status: JobStatus;
  input: Record<string, unknown>;
  result: RunResult | null;
  error: string | null;
  created_at: string;
  updated_at: string;
};

export async function createJob(params: {
  userId: string;
  productId: string;
  input: Record<string, unknown>;
}): Promise<Job> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('jobs')
    .insert({
      user_id: params.userId,
      product_id: params.productId,
      status: 'pending',
      input: params.input,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Job;
}

export async function updateJobStatus(jobId: string, status: JobStatus, extra: Partial<Pick<Job, 'result' | 'error'>> = {}) {
  const supabase = await createServerClient();
  const { error } = await supabase
    .from('jobs')
    .update({ status, ...extra, updated_at: new Date().toISOString() })
    .eq('id', jobId);
  if (error) throw error;
}

export async function getJob(jobId: string, userId: string): Promise<Job | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as Job | null;
}

export async function listJobs(userId: string, limit = 50): Promise<Job[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as Job[];
}
