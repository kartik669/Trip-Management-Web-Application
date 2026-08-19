import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load .env
dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
  console.log("1. Checking if 'profiles' table exists...");
  
  const { data, error } = await supabase.from('profiles').select('id').limit(1);

  if (error) {
    console.error("❌ DATABASE ERROR:", error.message);
    if (error.code === 'PGRST205' || error.message.includes('Could not find the table')) {
      console.log("👉 The SQL script HAS NOT been successfully run in Supabase yet.");
    }
  } else {
    console.log("✅ Database is connected AND the profiles table exists!");
    console.log("👉 You just need to turn off 'Confirm Email' in Supabase to bypass the rate limit.");
  }
}

testDatabase();
