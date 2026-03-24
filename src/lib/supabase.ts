import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lwrkfhoxsbxtpkrgiula.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  console.warn('Supabase Anon Key missing. Please add VITE_SUPABASE_ANON_KEY to your Railway variables.');
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey || ''
);
