import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectSchema() {
    try {
        const { data, error } = await supabase.from('question_options').select('*').limit(1);
        if (data && data.length > 0) {
            console.log('Colunas encontradas em question_options:');
            console.log(Object.keys(data[0]));
        } else {
            console.log('Tabela vazia ou erro:', error?.message);
        }
    } catch (err) {
        console.error(err.message);
    }
}

inspectSchema();
