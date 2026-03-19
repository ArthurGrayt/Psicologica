import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function forceUpdateDepressao() {
    try {
        console.log('--- FORCED UPDATE DEPRESSAO (V2) ---');

        // 1. Buscar perguntas de Depressão
        const { data: questions, error: qError } = await supabase
            .from('questions')
            .select('id')
            .in('category_key', ['Depressao', 'depressao', 'Depressão', 'depressão']);

        if (qError) throw qError;
        const qIds = questions.map(q => q.id);
        console.log(`Perguntas encontradas: ${qIds.length}`);

        if (qIds.length === 0) return;

        // 2. Deletar opções antigas
        console.log('Limpando opções antigas...');
        await supabase.from('question_options').delete().in('question_id', qIds);

        // 3. Inserir Sim=2, Não=0 (Apenas colunas válidas: question_id, text, score_val)
        const toInsert = [];
        qIds.forEach(id => {
            toInsert.push({ question_id: id, text: 'Sim', score_val: 2 });
            toInsert.push({ question_id: id, text: 'Não', score_val: 0 });
        });

        console.log(`Inserindo ${toInsert.length} novas opções...`);
        const { error: insError } = await supabase.from('question_options').insert(toInsert);
        
        if (insError) {
            console.error('ERRO NA INSERÇÃO:', insError.message);
            throw insError;
        }

        console.log('✓ SUCESSO ABSOLUTO! Pesos de Depressão atualizados.');

    } catch (err) {
        console.error('Falha geral:', err.message);
    }
}

forceUpdateDepressao();
