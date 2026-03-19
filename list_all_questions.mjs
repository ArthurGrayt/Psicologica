import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listAll() {
    try {
        const { data: qs } = await supabase.from('questions').select('id, text, category_key');
        console.log('--- ALL QUESTIONS ---');
        qs.forEach(q => {
            console.log(`ID: ${q.id} | Cat: [${q.category_key}] | Text: ${q.text.substring(0, 30)}...`);
        });
    } catch (err) {
        console.error(err.message);
    }
}

listAll();
