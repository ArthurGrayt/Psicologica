
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wofipjazcxwxzzxjsflh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debug() {
    console.log("Fetching questions to check categories...");
    const { data: questions } = await supabase
        .from('questions')
        .select('id, text, category_key, categories(name)');

    if (!questions) {
        console.error("No questions found.");
        return;
    }

    // Chart Definitions (from pdfReportGenerator.js)
    const chartCategories = [
        { key: 'Insatisfação Pessoal' },
        { key: 'Ansiedade' },
        { key: 'Depressão' },
        { key: 'Álcool' },
        { key: 'Fumo' },
        { key: 'Drogas ou Remédios' },
        { key: 'Sono' }
    ];

    const normalizeStr = (str) => {
        if (!str) return '';
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    };

    console.log("\n--- Checking Mappings ---");
    const uniqueCats = [...new Set(questions.map(q => q.category_key || q.categories?.name))].filter(Boolean);

    uniqueCats.forEach(dbCat => {
        const normCat = normalizeStr(dbCat);
        let matchedKey = chartCategories.find(c => normalizeStr(c.key) === normCat)?.key;

        // Simulate fallback logic
        if (!matchedKey) {
            if (normCat.includes('satisfacaopessoal')) {
                matchedKey = 'Insatisfação Pessoal (Fallback)';
            }
        }

        console.log(`DB Category: "${dbCat}" \t-> Normalized: "${normCat}" \t-> Match: "${matchedKey || 'MISSING'}"`);
    });
}

debug();
