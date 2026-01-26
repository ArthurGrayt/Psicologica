
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wofipjazcxwxzzxjsflh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debug() {
    console.log("Fetching distinct category keys...");
    const { data: questions } = await supabase
        .from('questions')
        .select('id, text, category_key, categories(name)');

    if (!questions) {
        console.error("No questions found.");
        return;
    }

    const distinctKeys = [...new Set(questions.map(q => q.category_key))];
    const distinctNames = [...new Set(questions.map(q => q.categories?.name))];

    console.log("Distinct category_key values:", distinctKeys);
    console.log("Distinct categories.name values:", distinctNames);

    console.log("\n--- Sample Question Categories ---");
    questions.slice(0, 20).forEach(q => {
        console.log(`Q${q.id}: Key="${q.category_key}", Name="${q.categories?.name}"`);
    });
}

debug();
