import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Testing column ordem on tabela_precos_variacoes...');
  const { data, error } = await supabase.from('tabela_precos_variacoes').select('ordem').limit(1);
  if (error && error.message.includes('ordem')) {
    console.log('Column ordem does not exist.');
    // Let's create an RPC or execute SQL if possible?
    // We cannot easily run DDL via client API.
    console.log(error);
  } else {
    console.log('Column ordem exists!', data);
  }
}
main();
