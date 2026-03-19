import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
    try {
        console.log('Testando inserção em question_options para Q_ID 20...');
        const { data, error } = await supabase.from('question_options').insert([
            { question_id: 20, text: 'Sim', label: 'Sim', score_val: 2 }
        ]).select();
        
        if (error) {
            console.log('ERRO DETALHADO:');
            console.log(JSON.stringify(error, null, 2));
        } else {
            console.log('Sucesso:', data);
        }
    } catch (err) {
        console.error('Exception:', err.message);
    }
}

testInsert();
