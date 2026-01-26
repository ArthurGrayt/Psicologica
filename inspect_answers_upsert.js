
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wofipjazcxwxzzxjsflh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debug() {
    console.log("Attempting to UPSERT with onConflict...");

    const { data: assessments } = await supabase.from('assessments').select('id').limit(1);
    const { data: questions } = await supabase.from('questions').select('id').limit(1);

    if (!assessments?.length || !questions?.length) return;

    const assessmentId = assessments[0].id;
    const questionId = questions[0].id;

    console.log(`Using Assessment ID: ${assessmentId}, Question ID: ${questionId}`);

    const { data, error } = await supabase
        .from('answers')
        .upsert({
            assessment_id: assessmentId,
            question_id: questionId,
            answer_text: "Teste Upsert",
            score: 0
        }, { onConflict: 'assessment_id, question_id' }) // Matching the frontend code exactly
        .select();

    if (error) {
        console.error("Upsert Error:", error);
    } else {
        console.log("Upsert Success:", data);
    }
}

debug();
