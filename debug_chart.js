
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const normalizeStr = (str) => {
    if (!str) return '';
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

async function debugChart() {
    console.log('--- Fetching Data for Chart Debug ---');

    // 1. Get One Completed Assessment
    const { data: assessments } = await supabase
        .from('assessments')
        .select('id, status, created_at')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1);

    if (!assessments || !assessments[0]) {
        console.log('No completed assessment found.');
        return;
    }
    const assessmentId = assessments[0].id;
    console.log(`Using Assessment ID: ${assessmentId}`);

    // 2. Fetch Answers
    const { data: answers, error: ansError } = await supabase
        .from('answers')
        .select('*')
        .eq('assessment_id', assessmentId);

    if (ansError) { console.error('Error fetching answers:', ansError); return; }
    if (!answers) { console.log('Answers is null'); return; }

    // 3. Fetch Questions (Simplified to debug columns)
    const { data: questions, error: qError } = await supabase
        .from('questions')
        .select('*')
        .limit(1);

    if (qError) { console.error('Error fetching questions:', qError); return; }
    console.log('Question Columns:', questions && questions.length > 0 ? Object.keys(questions[0]) : 'No questions found');


    console.log(`Fetched ${answers.length} answers and ${questions.length} questions.`);

    // --- REPLICATE LOGIC ---
    const categories = [
        { key: 'Insatisfação Pessoal', color: '#0000FF' },
        { key: 'Ansiedade', color: '#FF0000' },
        { key: 'Depressão', color: '#A52A2A' },
        { key: 'Álcool', color: '#FFA500' },
        { key: 'Fumo', color: '#000000' },
        { key: 'Drogas ou Remédios', color: '#800080' },
        { key: 'Sono', color: '#008000' }
    ];

    const scores = {};
    categories.forEach(cat => scores[cat.key] = 0);

    // Question Map
    const questionCategoryMap = {};
    questions.forEach(q => {
        const cat = q.category_key || q.categories?.name || q.category;
        if (cat) questionCategoryMap[q.id] = cat;
    });

    console.log('\n--- Answers Processing ---');

    answers.forEach(ans => {
        const cat = questionCategoryMap[ans.question_id];
        if (!cat) return;

        const normCat = normalizeStr(cat);
        const mapping = {
            'insatisfacaopessoal': 'Insatisfação Pessoal',
            'satisfacaopessoal': 'Insatisfação Pessoal',
            'ansiedade': 'Ansiedade',
            'depressao': 'Depressão',
            'alcool': 'Álcool',
            'fumo': 'Fumo',
            'drogas': 'Drogas ou Remédios',
            'drogasouremedios': 'Drogas ou Remédios',
            'sono': 'Sono'
        };

        let matchedKey = null;
        if (mapping[normCat]) matchedKey = mapping[normCat];
        if (!matchedKey) {
            const direct = categories.find(c => normalizeStr(c.key) === normCat);
            if (direct) matchedKey = direct.key;
        }
        if (!matchedKey) {
            const partial = categories.find(c =>
                normalizeStr(c.key).includes(normCat) || normCat.includes(normalizeStr(c.key))
            );
            if (partial) matchedKey = partial.key;
        }

        // --- CHECK SCORE FORMAT ---
        console.log(`\nQ[${ans.question_id}] Cat: "${cat}" -> Match: "${matchedKey}"`);
        console.log(`   Score Raw Value: "${ans.score}" (Type: ${typeof ans.score})`);

        let numericScore = parseFloat(ans.score);
        console.log(`   parseFloat Result: ${numericScore}`);

        // Check for comma
        if (typeof ans.score === 'string' && ans.score.includes(',')) {
            console.log('   [WARN] Comma detected! Re-parsing...');
            numericScore = parseFloat(ans.score.replace(',', '.'));
            console.log(`   Corrected Float: ${numericScore}`);
        }

        if (matchedKey) {
            const finalScoreToAdd = isNaN(numericScore) ? 0 : numericScore;
            scores[matchedKey] += finalScoreToAdd;
            console.log(`   -> Added ${finalScoreToAdd} to ${matchedKey}`);
        }
    });

    console.log('\n--- Final Scores ---');
    console.log(scores);
}

debugChart();
