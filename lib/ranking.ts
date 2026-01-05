import { supabase } from './supabase';
import { RankingEntry } from '@/types/typing';

export async function submitScore(data: {
  username: string;
  score: number;
  completedCount: number;
  mistypes: number;
}): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('rankings').insert({
    username: data.username,
    score: data.score,
    completed_count: data.completedCount,
    mistypes: data.mistypes,
  });

  if (error) {
    console.error('Failed to submit score:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function fetchRankings(limit: number = 10): Promise<RankingEntry[]> {
  const { data, error } = await supabase
    .from('rankings')
    .select('*')
    .order('score', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch rankings:', error);
    return [];
  }

  return data ?? [];
}
