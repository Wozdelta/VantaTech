const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
env.split(/\r?\n/).forEach(l => {
  if(l.startsWith('VITE_SUPABASE_URL=')) url = l.split('=')[1].replace(/"/g, '');
  if(l.startsWith('VITE_SUPABASE_ANON_KEY=')) key = l.split('=')[1].replace(/"/g, '');
});

const supabase = createClient(url, key);
supabase.from('tabela_precos_variacoes').select('*').limit(1).then(res => {
  console.log(Object.keys(res.data[0] || {}));
});
