import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrateYesNoOptions() {
    try {
        console.log('Iniciando migração de opções Sim/Não...');

        // 1. Buscar todas as perguntas do tipo yes_no
        const { data: questions, error: qError } = await supabase
            .from('questions')
            .select('id, text, weight, category_key')
            .eq('type', 'yes_no');

        if (qError) throw qError;
        console.log(`Encontradas ${questions.length} perguntas Sim/Não.`);

        for (const q of questions) {
            // Verificar se já tem opções
            const { data: existing } = await supabase
                .from('question_options')
                .select('id')
                .eq('question_id', q.id);

            if (existing && existing.length > 0) {
                console.log(`Pula pergunta ${q.id} (já possui opções).`);
                continue;
            }

            console.log(`Criando opções para pergunta ${q.id}: ${q.text}`);

            // Definir scores baseado na categoria ou peso
            let simScore = q.weight || 0;
            if (q.category_key === 'Depressao' || q.category_key === 'depressao') {
                simScore = 2;
            }

            const optionsToInsert = [
                { question_id: q.id, text: 'Sim', label: 'Sim', score_val: simScore },
                { question_id: q.id, text: 'Não', label: 'Não', score_val: 0 }
            ];

            const { error: insError } = await supabase
                .from('question_options')
                .insert(optionsToInsert);

            if (insError) {
                console.error(`Erro ao inserir opções para Q${q.id}:`, insError.message);
            } else {
                console.log(`✓ Opções inseridas para Q${q.id} (Sim=${simScore})`);
            }
        }

        console.log('Migração concluída com sucesso!');

    } catch (err) {
        console.error('Erro na migração:', err.message);
    }
}

migrateYesNoOptions();
