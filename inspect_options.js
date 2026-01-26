
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wofipjazcxwxzzxjsflh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debug() {
    console.log("Checking 'question_options' table structure and first row...");
    const { data: options, error } = await supabase
        .from('question_options')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error fetching question_options:", error);
    } else {
        console.log("First Option:", options[0]);
        if (options.length > 0) {
            console.log("Keys:", Object.keys(options[0]));
        }
    }
}

debug();
