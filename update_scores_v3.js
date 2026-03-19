import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runUpdate() {
  try {
    // 1. Fetch all question options with question and category info
    const { data: options, error } = await supabase
        .from('question_options')
        .select(`
            id,
            text,
            question_id,
            questions!inner (
                text,
                category_key,
                categories (name)
            )
        `);

    if (error) {
        console.error('Error fetching options:', error);
        return;
    }

    console.log(`Found ${options.length} options. Applying rules...`);

    const updates = [];

    options.forEach(opt => {
        const qText = opt.questions.text;
        const catName = opt.questions.categories?.name || opt.questions.category_key;
        const oText = opt.text;
        let newScore = 0;

        // --- 1. Insatisfação Pessoal (12 perguntas, Base 2.5) ---
        if (catName === 'Insatisfação Pessoal') {
            const inverted = [
                'Satisfeito com sua estrutura familiar?',
                'Satisfeito com sua vida amorosa?',
                'Satisfeito com o lugar que mora?',
                'Você costuma ter uma visão otimista perante a cenários não tão favoráveis?',
                'Você costuma terminar o que começa?',
                'Planeja suas atividades com cuidado?',
                'Se cuida para não ficar doente?'
            ];
            const isInv = inverted.some(t => qText.includes(t));
            if (isInv) {
                if (oText === 'Não') newScore = 2.5;
            } else {
                if (oText === 'Sim') newScore = 2.5;
            }
        }

        // --- 2. Ansiedade (16 perguntas, Base 1.875) ---
        else if (catName === 'Ansiedade') {
            const inverted = ['Se concentra com facilidade?'];
            const isInv = inverted.some(t => qText.includes(t));
            if (isInv) {
                if (oText === 'Não') newScore = 1.875;
            } else {
                if (oText === 'Sim') newScore = 1.875;
            }
        }

        // --- 3. Depressão (18 perguntas, Base 1.667) ---
        else if (catName === 'Depressão') {
            if (oText === 'Sim') newScore = 1.667;
        }

        // --- 4. Álcool (Base unit 1.579) ---
        else if (catName === 'Álcool') {
            const unit = 1.579;
            if (qText.includes('Já alguma vez ficou ferido')) {
                if (oText.includes('Sim,mas não')) newScore = 0.79;
                else if (oText.includes('Sim,nos últimos')) newScore = 1.579;
            } else if (qText.includes('Já alguma vez um familiar ou médico')) {
                if (oText.includes('Sim, mas não')) newScore = 1.579;
                else if (oText.includes('Sim, nos últimos')) newScore = 3.158;
            } else {
                // Scale 0-4
                const scaleMap = {
                    'Nunca': 0, 'Não': 0, '1 ou 2': 0,
                    'Uma vez por mês ou menos': 0.395, '3 ou 4': 0.395,
                    'De 2 a 4 vezes por mês': 0.79, 'De 5 ou 6': 0.79, '5 ou 6': 0.79,
                    'De 2 a 3 vezes por semana': 1.185, '7 a 9': 1.185,
                    '4 vezes ou mais por semana': 1.579, '4 ou mais vezes por semana': 1.579, '10 ou mais': 1.579, '4 vezes na semana ou mais': 1.579, '4 vezes ou mais na semana': 1.579
                };
                // Try direct match or cleanup
                let cleanO = oText.trim();
                newScore = scaleMap[cleanO] || 0;
            }
        }

        // --- 5. Drogas ou Remédios (Base unit 3.0) ---
        else if (catName === 'Drogas ou Remédios') {
            if (qText.includes('Ainda faz uso?')) {
                const map = { 'Nunca': 0, 'Raramente': 0.75, 'Às vezes': 1.50, 'Muitas vezes': 2.25, 'Sempre': 3.00 };
                newScore = map[oText] || 0;
            } else if (qText.includes('Com que frequência?')) {
                const map = { 'Nunca': 0, 'Uma vez na semana': 1.50, 'Todos os dias': 3.00 };
                newScore = map[oText] || 0;
            } else {
                if (oText === 'Sim') newScore = 3.00;
            }
        }

        // --- 6. Sono (Base 6.0) ---
        else if (catName === 'Sono') {
            if (oText === 'Sim') newScore = 6.00;
        }

        // --- 7. Fumo (Base unit 4.286) ---
        else if (catName === 'Fumo') {
            if (qText.includes('Em quanto tempo depois de acordar')) {
                const map = { 'Mais de 60 minutos': 0, 'De 31 a 60 minutos': 2.143, 'De 6 a 30 minutos': 4.286, 'Dentro de 5 minutos': 6.429 };
                newScore = map[oText] || 0;
            } else if (qText.includes('Qual o cigarro do dia que traz mais satisfação?')) {
                if (oText === 'O primeiro da manhã') newScore = 4.286;
            } else if (qText.includes('Quantos cigarros você fuma por dia?')) {
                const map = { 'Menos de 10': 0, 'De 11 a 20': 2.143, 'De 21 a 30': 4.286, 'Mais de 31': 6.429 };
                newScore = map[oText] || 0;
            } else {
                if (oText === 'Sim') newScore = 4.286;
            }
        }

        updates.push({ id: opt.id, score_val: newScore });
    });

    console.log(`Prepared ${updates.length} updates. Sending to database...`);

    // Batch updates (Supabase doesn't have a direct multi-update by ID for different values easily, 
    // but upsert with ID works as an update if columns are present)
    const { error: updateError } = await supabase
        .from('question_options')
        .upsert(updates);

    if (updateError) {
        console.error('Error updating scores:', updateError);
    } else {
        console.log('Successfully updated all scores!');
    }

  } catch (err) {
    console.error('Exception:', err.message);
  }
}

runUpdate();
