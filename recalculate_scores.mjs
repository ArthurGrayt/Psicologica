import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function recalculateScores() {
    try {
        console.log('Iniciando recalculo de todos os scores de respostas...');

        // 1. Buscar todas as perguntas e suas opções
        const { data: questions, error: qError } = await supabase
            .from('questions')
            .select('id, type, weight, question_options(text, score_val)');

        if (qError) throw qError;

        // Criar um mapa para busca rápida: questionMap[qId][answerText] = score
        const questionMap = {};
        questions.forEach(q => {
            questionMap[q.id] = { type: q.type, weight: q.weight, options: {} };
            q.question_options?.forEach(opt => {
                questionMap[q.id].options[opt.text.trim().toLowerCase()] = opt.score_val;
            });
        });

        // 2. Buscar todas as respostas
        const { data: answers, error: aError } = await supabase
            .from('answers')
            .select('id, question_id, answer_text, score');

        if (aError) throw aError;
        console.log(`Processando ${answers.length} respostas...`);

        const updates = [];
        for (const ans of answers) {
            const qData = questionMap[ans.question_id];
            if (!qData) continue;

            let newScore = 0;
            const textNormalized = (ans.answer_text || '').trim().toLowerCase();

            // Lógica de cálculo idêntica ao FormularioPublico.jsx
            if (['scale', 'select', 'yes_no'].includes(qData.type)) {
                // Tenta buscar na tabela de opções
                if (qData.options.hasOwnProperty(textNormalized)) {
                    newScore = qData.options[textNormalized];
                } else if (qData.type === 'yes_no') {
                    // Fallback para Sim/Não caso as opções não coincidam por algum motivo
                    if (textNormalized === 'sim') newScore = qData.weight || 0;
                    else newScore = 0;
                } else if (/^\d+$/.test(textNormalized)) {
                    // Fallback para escalas numéricas
                    newScore = parseInt(textNormalized, 10);
                }
            }

            // Apenas adiciona se o score mudou
            if (newScore !== Number(ans.score)) {
                updates.push({ id: ans.id, score: newScore });
            }
        }

        if (updates.length === 0) {
            console.log('Nenhuma resposta precisa de atualização.');
            return;
        }

        console.log(`Atualizando ${updates.length} respostas...`);

        // 3. Executar atualizações em lotes de 100
        for (let i = 0; i < updates.length; i += 100) {
            const batch = updates.slice(i, i + 100);
            const { error: updError } = await supabase.from('answers').upsert(batch);
            if (updError) throw updError;
            console.log(`Progresso: ${i + batch.length}/${updates.length}`);
        }

        console.log('✓ SUCESSO: Todos os laudos foram atualizados com os novos pesos!');

    } catch (err) {
        console.error('ERRO:', err.message);
    }
}

recalculateScores();
