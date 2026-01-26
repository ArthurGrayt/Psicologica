
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wofipjazcxwxzzxjsflh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debug() {
    console.log("Checking 'questions' table structure and first row...");
    const { data: questions, error: qError } = await supabase
        .from('questions')
        .select('*')
        .limit(1);

    if (qError) {
        console.error("Error fetching questions:", qError);
    } else {
        console.log("First Question:", questions[0]);
    }

    console.log("\nChecking 'categories' table...");
    const { data: categories, error: cError } = await supabase
        .from('categories')
        .select('*');

    if (cError) {
        console.error("Error fetching categories:", cError);
    } else {
        console.log("All Categories:", categories);
    }
}

debug();
