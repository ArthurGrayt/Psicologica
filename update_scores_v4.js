import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runUpdate() {
  try {
    const { data: options, error } = await supabase
        .from('question_options')
        .select(`
            id, text,
            questions!inner ( text, category_key, categories (name) )
        `);

    if (error) { throw error; }

    const updates = [];
    options.forEach(opt => {
        const qText = opt.questions.text;
        const catName = opt.questions.categories?.name || opt.questions.category_key;
        const oText = opt.text;
        let newScore = 0;

        // 1. Insatisfação Pessoal (12 itens -> 2.50)
        if (catName === 'Insatisfação Pessoal') {
            const inverted = ['familiar?', 'amorosa?', 'mora?', 'otimista', 'terminar', 'Planeja', 'Se cuida'];
            const isInv = inverted.some(t => qText.includes(t));
            if (isInv) { if (oText === 'Não') newScore = 2.5; }
            else { if (oText === 'Sim') newScore = 2.5; }
        }

        // 2. Ansiedade (16 itens -> 1.875)
        else if (catName === 'Ansiedade') {
            if (qText.includes('concentra')) { if (oText === 'Não') newScore = 1.875; }
            else { if (oText === 'Sim') newScore = 1.875; }
        }

        // 3. Depressão (18 itens -> 1.667)
        else if (catName === 'Depressão') {
            if (oText === 'Sim') newScore = 1.667;
        }

        // 4. Álcool (10 itens -> 3.0)
        else if (catName === 'Álcool') {
            if (qText.includes('ferido')) {
                if (oText.includes('Sim,mas não')) newScore = 1.5;
                else if (oText.includes('Sim,nos últimos')) newScore = 3.0;
            } else if (qText.includes('preocupação')) {
                if (oText.includes('Sim, mas não')) newScore = 1.5;
                else if (oText.includes('Sim, nos últimos')) newScore = 3.0;
            } else if (!qText.includes('bebidas alcoólicas?')) { // Pula a de triagem S/N
                const scale = { 'Nunca':0, 'Não':0, '1 ou 2':0, 'mensal':0.75, '3 ou 4':0.75, '2 a 4 vezes':1.5, '5 ou 6':1.5, '2 a 3 vezes':2.25, '7 a 9':2.25, '4 vezes ou mais':3.0, '10 ou mais':3.0 };
                const match = Object.keys(scale).find(k => oText.toLowerCase().includes(k.toLowerCase()));
                newScore = match ? scale[match] : 0;
            }
        }

        // 5. Drogas ou Remédios (8 itens -> 3.75)
        else if (catName === 'Drogas ou Remédios') {
            if (qText.includes('Ainda faz uso?')) {
                const map = { 'Nunca': 0, 'Raramente': 0.938, 'Às vezes': 1.875, 'Muitas vezes': 2.813, 'Sempre': 3.75 };
                newScore = map[oText] || 0;
            } else if (qText.includes('frequência?')) {
                const map = { 'Nunca': 0, 'Uma vez na semana': 1.875, 'Todos os dias': 3.75 };
                newScore = map[oText] || 0;
            } else if (!qText.includes('Descreva')) {
                if (oText === 'Sim') newScore = 3.75;
            }
        }

        // 6. Sono (5 itens -> 6.0)
        else if (catName === 'Sono') {
            if (oText === 'Sim') newScore = 6.0;
        }

        // 7. Fumo (6 itens -> 5.0)
        else if (catName === 'Fumo') {
            if (qText.includes('tempo depois de acordar')) {
                const map = { '> 60': 0, '31 a 60': 1.667, '6 a 30': 3.333, '< 5': 5.0, 'Dentro de 5': 5.0, 'Mais de 60': 0 };
                const match = Object.keys(map).find(k => oText.includes(k));
                newScore = match ? map[match] : 0;
            } else if (qText.includes('satisfação?')) {
                if (oText === 'O primeiro da manhã') newScore = 5.0;
            } else if (qText.includes('cigarros você fuma')) {
                const map = { '< 10': 0, '11 a 20': 1.667, '21 a 30': 3.333, '> 31': 5.0, 'Menos de 10': 0, 'Mais de 31': 5.0 };
                const match = Object.keys(map).find(k => oText.includes(k));
                newScore = match ? map[match] : 0;
            } else if (qText.includes('Fuma?')) {
                newScore = 0;
            } else {
                if (oText === 'Sim') newScore = 5.0;
            }
        }

        updates.push({ id: opt.id, score_val: newScore });
    });

    const { error: updError } = await supabase.from('question_options').upsert(updates);
    if (updError) throw updError;
    console.log('Sucesso! Pesos atualizados (Teto 30).');

  } catch (err) { console.error('Erro:', err); }
}
runUpdate();
