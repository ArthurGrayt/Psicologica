import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  try {
    const { data, error } = await supabase
        .from('patients')
        .select(`
            id,
            name,
            role:role_id (nome_cargo),
            sector:sector_id (nome_setor)
        `)
        .limit(1);
        
    if (error) {
        console.log('Error with join:', error.message);
        // Try alternate column names
        const { data: data2, error: error2 } = await supabase
            .from('patients')
            .select(`
                id,
                name,
                cargos:role_id (nome),
                setor:sector_id (nome)
            `)
            .limit(1);
        if (error2) {
            console.log('Error with join alternate:', error2.message);
        } else {
            console.log('Join alternate success:', JSON.stringify(data2, null, 2));
        }
    } else {
        console.log('Join success:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.log('Exception:', err.message);
  }
}

check();
