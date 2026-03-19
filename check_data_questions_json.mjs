import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkData() {
    try {
        const { data: cats } = await supabase.from('categories').select('*');
        console.log('--- CATEGORIES ---');
        console.log(JSON.stringify(cats, null, 2));

        const { data: qs } = await supabase.from('questions').select('id, text, category_key').limit(20);
        console.log('--- QUESTIONS ---');
        console.log(JSON.stringify(qs, null, 2));
    } catch (err) {
        console.error('Erro:', err.message);
    }
}

checkData();
