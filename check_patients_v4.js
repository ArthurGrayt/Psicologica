import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  try {
    const { data, error } = await supabase.from('patients').select('*').limit(1);
    if (error) {
      console.log('--- ERROR ---');
      console.log(JSON.stringify(error, null, 2));
    } else {
      console.log('--- DATA ---');
      console.log(JSON.stringify(data[0] || {}, null, 2));
    }
  } catch (err) {
    console.log('--- EXCEPTION ---');
    console.log(err.message);
  }
}

check();
