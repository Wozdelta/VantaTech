import { supabase } from './src/lib/supabase.js'; async function check() { const { data, error } = await supabase.from('configuracoes').select('*'); console.log(data, error); } check();  
