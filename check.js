import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let SUPABASE_URL = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
let SUPABASE_KEY = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1];
SUPABASE_URL = SUPABASE_URL.replace(/['"]/g, '').trim();
SUPABASE_KEY = SUPABASE_KEY.replace(/['"]/g, '').trim();

async function check() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/produtos?limit=1`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  const data = await res.json();
  console.log("Columns:", Object.keys(data[0]));
}
check();
