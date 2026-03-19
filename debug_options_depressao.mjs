import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugOptions() {
    try {
        console.log('Buscando perguntas de Depressao...');
        const { data: qs } = await supabase.from('questions').select('id, text').eq('category_key', 'Depressao');
        console.log('IDs:', qs.map(q => q.id));

        if (qs.length > 0) {
            const firstId = qs[0].id;
            console.log(`Buscando opções para a pergunta ID ${firstId}...`);
            const { data: opts, error } = await supabase.from('question_options').select('*').eq('question_id', firstId);
            if (error) console.error('Erro na query:', error.message);
            console.log('Opções encontradas:', JSON.stringify(opts, null, 2));
        }
    } catch (err) {
        console.error('Erro:', err.message);
    }
}

debugOptions();
