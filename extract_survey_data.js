import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  try {
    const { data: questions, error } = await supabase
        .from('questions')
        .select(`
            id,
            text,
            category_key,
            categories (name),
            question_options (
                text,
                score_val
            )
        `)
        .order('id', { ascending: true });
        
    if (error) {
        console.log('Error fetching questions:', error.message);
        return;
    }

    const categories = {};

    questions.forEach(q => {
        const catName = q.categories?.name || q.category_key || 'Sem Categoria';
        if (!categories[catName]) {
            categories[catName] = {
                questions: [],
                maxScore: 0
            };
        }

        const options = q.question_options || [];
        const scores = options.map(o => parseFloat(o.score_val) || 0);
        const maxQScore = scores.length > 0 ? Math.max(...scores) : 0;

        categories[catName].questions.push({
            text: q.text,
            options: options.map(o => ({
                text: o.text,
                score: parseFloat(o.score_val) || 0
            }))
        });
        categories[catName].maxScore += maxQScore;
    });

    fs.writeFileSync('survey_summary.json', JSON.stringify(categories, null, 2));
    console.log('Survey summary saved to survey_summary.json');
  } catch (err) {
    console.log('Exception:', err.message);
  }
}

check();
