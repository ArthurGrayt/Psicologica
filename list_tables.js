import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  try {
    // This trick sometimes works to list tables if the API allows it or via error messages
    const { data, error } = await supabase.from('non_existent_table').select('*');
    console.log('Error hint:', error?.message);
    
    // Try to query common table names
    const tables = ['patients', 'colaboradores', 'agendamentos', 'cargos', 'setor', 'unidades', 'clientes', 'assessments', 'patient_info', 'patient_data'];
    for (const t of tables) {
        const { error } = await supabase.from(t).select('count', { count: 'exact', head: true });
        console.log(`Table ${t}: ${error ? 'Not found' : 'Exists'}`);
    }
  } catch (err) {
    console.log('Exception:', err.message);
  }
}

check();
