import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function generateReport() {
    try {
        const { data: questions, error } = await supabase
            .from('questions')
            .select('*, question_options(*), categories(name)')
            .order('category_key', { ascending: true })
            .order('id', { ascending: true });

        if (error) throw error;

        const grouped = {};
        questions.forEach(q => {
            const catName = q.categories?.name || q.category_key || 'Sem Categoria';
            if (!grouped[catName]) grouped[catName] = [];
            grouped[catName].push({
                id: q.id,
                text: q.text,
                type: q.type,
                options: q.question_options.map(o => ({ text: o.text, score: o.score_val }))
            });
        });

        fs.writeFileSync('summary_data.json', JSON.stringify(grouped, null, 2));
        console.log('Arquivo summary_data.json gerado.');

    } catch (err) {
        console.error('Erro:', err.message);
    }
}

generateReport();
