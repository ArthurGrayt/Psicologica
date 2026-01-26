
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wofipjazcxwxzzxjsflh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testRpc() {
    console.log("Testing get_narrative_report RPC...");

    // Need a valid assessment ID. I'll pick one from the DB or use a known one.
    // First, list assessments
    const { data: assessments } = await supabase.from('assessments').select('id').limit(1);

    if (!assessments || assessments.length === 0) {
        console.error("No assessments found to test with.");
        return;
    }

    const testId = assessments[0].id;
    console.log("Using Assessment ID:", testId);

    const { data, error } = await supabase.rpc('get_narrative_report', { target_assessment_id: testId });

    if (error) {
        console.error("RPC Error:", error);
    } else {
        console.log("RPC Success!");
        console.log("Data:", data);
    }
}

testRpc();
