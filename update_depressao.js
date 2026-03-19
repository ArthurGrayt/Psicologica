const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateDepressaoScores() {
    try {
        console.log('Buscando perguntas da categoria Depressão...');
        
        // 1. Buscar IDs das perguntas de Depressão
        const { data: questions, error: qError } = await supabase
            .from('questions')
            .select('id, text, type')
            .or('category_key.eq.depressao,category.eq.Depressão');

        if (qError) throw qError;
        
        const qIds = questions.map(q => q.id);
        console.log(`Encontradas ${questions.length} perguntas:`, qIds);

        if (qIds.length === 0) {
            console.log('Nenhuma pergunta encontrada.');
            return;
        }

        // 2. Buscar as opções dessas perguntas
        const { data: options, error: optError } = await supabase
            .from('question_options')
            .select('id, question_id, text')
            .in('question_id', qIds);

        if (optError) throw optError;

        console.log(`Analizando ${options.length} opções...`);

        // 3. Identificar o que atualizar
        const updates = [];
        options.forEach(opt => {
            const txt = opt.text.trim().toLowerCase();
            if (txt === 'sim') {
                updates.push({ id: opt.id, score_val: 2 });
            } else if (txt === 'nao' || txt === 'não') {
                updates.push({ id: opt.id, score_val: 0 });
            }
        });

        if (updates.length === 0) {
            console.log('Nenhuma opção "Sim" ou "Não" encontrada para atualizar.');
            return;
        }

        console.log(`Atualizando ${updates.length} registros...`);

        // 4. Executar atualizações (Supabase upsert com IDs existentes funciona como update)
        const { error: updError } = await supabase
            .from('question_options')
            .upsert(updates);

        if (updError) throw updError;

        console.log('SUCESSO: Todas as perguntas de Depressão foram atualizadas (Sim=2, Não=0).');

    } catch (err) {
        console.error('ERRO:', err.message);
    }
}

updateDepressaoScores();
