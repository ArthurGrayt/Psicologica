import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkIds() {
    try {
        const ids = [20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 35, 36, 37, 38];
        const { data: opts } = await supabase.from('question_options').select('*').in('question_id', ids);
        console.log(`Encontradas ${opts.length} opções para os IDs de Depressão.`);
        opts.forEach(o => {
            console.log(`Q: ${o.question_id} | Text: ${o.text} | Score: ${o.score_val}`);
        });
    } catch (err) {
        console.error(err.message);
    }
}

checkIds();
