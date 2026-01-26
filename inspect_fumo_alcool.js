
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wofipjazcxwxzzxjsflh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debug() {
    console.log("Inspecting 'Fumo' and 'Alcool' questions...");
    const { data: questions, error } = await supabase
        .from('questions')
        .select('id, text, type, weight, category_key, question_options(text, score_val)')
        .in('category_key', ['Fumo', 'Alcool']);

    if (error) {
        console.error("Error:", error);
        return;
    }

    if (!questions || questions.length === 0) {
        console.log("No questions found for Fumo/Alcool.");
        return;
    }

    questions.forEach(q => {
        console.log(`\nID: ${q.id} | Cat: ${q.category_key} | Type: ${q.type} | Weight: ${q.weight}`);
        if (q.question_options && q.question_options.length > 0) {
            console.log("  Options:");
            q.question_options.forEach(o => console.log(`    - ${o.text} (Score: ${o.score_val})`));
        }
    });

    console.log("\nChecking a sample answer for these questions...");
    const { data: answers } = await supabase
        .from('answers')
        .select('*')
        .in('question_id', questions.map(q => q.id))
        .limit(5);

    console.log("Sample Answers stored in DB:", answers);
}

debug();
