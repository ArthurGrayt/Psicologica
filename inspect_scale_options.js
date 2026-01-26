
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wofipjazcxwxzzxjsflh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debug() {
    console.log("Inspecting 'scale' questions options...");
    const { data: questions } = await supabase
        .from('questions')
        .select('id, text, type, category_key, question_options(text, score_val)')
        .eq('type', 'scale');

    if (!questions) return;

    questions.forEach(q => {
        // Check if options look like numbers "0", "1", "2"...
        const isNumericScale = q.question_options?.some(o => !isNaN(parseInt(o.text)));

        if (isNumericScale) {
            console.log(`\nID: ${q.id} | "${q.text.substring(0, 50)}..." | Cat: ${q.category_key}`);
            q.question_options.forEach(o => {
                const textAsNum = parseInt(o.text);
                const isMatch = textAsNum === o.score_val;
                if (!isMatch) {
                    console.warn(`  [MISMATCH] Option "${o.text}" has score_val: ${o.score_val} (Expected: ${textAsNum})`);
                } else {
                    // console.log(`  [OK] Option "${o.text}" -> Score ${o.score_val}`);
                }
            });
        }
    });
}

debug();
