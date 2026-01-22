import { supabase } from './src/lib/supabase.js';

async function inspectPatients() {
    console.log('--- Patients Table ---');
    const { data, error } = await supabase.from('patients').select('*').limit(1);

    if (error) {
        console.error('Error fetching patients:', error);
    } else {
        if (data.length > 0) {
            console.log('Columns:', Object.keys(data[0]));
            console.log('Sample Data:', data[0]);
        } else {
            console.log('Table is empty. Cannot determine columns from data.');
            // Try to insert a dummy to see error if needed, or just rely on what we put in previously
        }
    }
}

inspectPatients();
