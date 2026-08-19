import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lhclvpdvkwsoroujphxx.supabase.co';
const supabaseAnonKey = 'sb_publishable_pjzQZleX7GoCWxna_c6D3Q_PVuVBM2z';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

