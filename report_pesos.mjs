import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function generateReport() {
    try {
        console.log('Gerando relatório completo...');
        
        // 1. Buscar perguntas com suas opções e nome da categoria
        const { data: questions, error } = await supabase
            .from('questions')
            .select('*, question_options(*), categories(name)')
            .order('category_key', { ascending: true })
            .order('id', { ascending: true });

        if (error) throw error;

        // 2. Agrupar por categoria
        const grouped = {};
        questions.forEach(q => {
            const catName = q.categories?.name || q.category_key || 'Sem Categoria';
            if (!grouped[catName]) grouped[catName] = [];
            grouped[catName].push(q);
        });

        // 3. Imprimir em formato JSON para eu processar
        console.log('--- DATA START ---');
        console.log(JSON.stringify(grouped, null, 2));
        console.log('--- DATA END ---');

    } catch (err) {
        console.error('Erro:', err.message);
    }
}

generateReport();
