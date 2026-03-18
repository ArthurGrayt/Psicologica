import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  try {
    const { data: cols, error: err } = await supabase.from('patients').select('*').limit(1);
    if (cols && cols.length > 0) {
        console.log('Available columns in first record:', Object.keys(cols[0]));
    }
    
    // Test for common missing columns
    const testCols = ['cpf', 'sexo', 'data_nascimento', 'unidade_id', 'unit_id', 'company_id', 'empresa_id', 'nome'];
    for (const col of testCols) {
        const { data, error } = await supabase.from('patients').select(col).limit(1);
        if (!error) {
            console.log(`Column ${col} EXISTS`);
        } else {
            console.log(`Column ${col} DOES NOT EXIST (or error: ${error.message})`);
        }
    }
  } catch (err) {
    console.log('Exception:', err.message);
  }
}

check();
