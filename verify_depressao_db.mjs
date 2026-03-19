import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verify() {
    try {
        const { data: qs } = await supabase.from('questions').select('id, text, category_key').eq('category_key', 'Depressao');
        const qIds = qs.map(q => q.id);
        
        const { data: opts } = await supabase.from('question_options').select('*').in('question_id', qIds);
        
        console.log('--- VERIFICAÇÃO DE OPÇÕES (DEPRESSÃO) ---');
        opts.forEach(o => {
            console.log(`Q${o.question_id} | ${o.text} | Score: ${o.score_val}`);
        });
    } catch (err) {
        console.error(err.message);
    }
}

verify();
