
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wofipjazcxwxzzxjsflh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debug() {
    console.log("Checking 'answers' table structure...");
    const { data: answers, error } = await supabase
        .from('answers')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error fetching answers:", error);
    } else {
        console.log("First Answer:", answers[0]);
        if (answers.length > 0) {
            console.log("Keys:", Object.keys(answers[0]));
        }
    }
}

debug();
