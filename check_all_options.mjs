import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkOptions() {
    try {
        const { data: allOpts } = await supabase.from('question_options').select('*');
        console.log('--- ALL OPTIONS ---');
        allOpts.forEach(o => {
            console.log(`ID: ${o.id} | Q_ID: ${o.question_id} | Text: ${o.text} | Score: ${o.score_val}`);
        });
    } catch (err) {
        console.error(err.message);
    }
}

checkOptions();
