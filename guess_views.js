import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  try {
    // If we can't query information_schema, we might have to ask the user.
    // But let's try a simple select from a known view if it exists.
    // Sometimes users name them 'view_assessments' or similar.
    
    // I'll try to guess a few names.
    const guesses = ['v_assessments', 'view_assessments', 'results_view', 'answers_view'];
    for (const g of guesses) {
        const { data, error } = await supabase.from(g).select('*').limit(1);
        if (!error) console.log(`Found view: ${g}`);
    }
  } catch (err) {
    console.log('Exception:', err.message);
  }
}

check();
