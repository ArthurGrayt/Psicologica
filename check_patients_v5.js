import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  try {
    // We can't easily use information_schema via anon key usually, 
    // but we can try to find a record that might have more fields or just use a RPC if available.
    // Or just try to select some likely column names.
    
    const { data, error } = await supabase.from('patients').select('*').limit(5);
    if (data && data.length > 0) {
        const allKeys = new Set();
        data.forEach(row => Object.keys(row).forEach(k => allKeys.add(k)));
        console.log('All found columns:', Array.from(allKeys).join(', '));
        console.log('First 5 records:', JSON.stringify(data, null, 2));
    } else {
        console.log('No data or error:', error);
    }
  } catch (err) {
    console.log('Exception:', err.message);
  }
}

check();
