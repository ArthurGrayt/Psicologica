import { supabase } from './src/lib/supabase.js';

async function inspectTables() {
    console.log('--- Colaboradores ---');
    const { data: col, error: errCol } = await supabase.from('colaboradores').select('*').limit(1);
    if (errCol) console.error(errCol);
    else console.log(col.length ? Object.keys(col[0]) : 'Empty table');

    console.log('\n--- Cargos ---');
    const { data: car, error: errCar } = await supabase.from('cargos').select('*').limit(1);
    if (errCar) console.error(errCar);
    else console.log(car.length ? Object.keys(car[0]) : 'Empty table');

    console.log('\n--- Setor (unidades? setores?) ---');
    // User said "tabela 'setor'" or "tabelas 'cargos' e 'setor'"
    const { data: set, error: errSet } = await supabase.from('setor').select('*').limit(1);
    // Also try plural just in case
    if (errSet) {
        console.log('Trying "setores"...');
        const { data: sets, error: errSets } = await supabase.from('setores').select('*').limit(1);
        if (errSets) console.error(errSets);
        else console.log(sets.length ? Object.keys(sets[0]) : 'Empty table (setores)');
    } else {
        console.log(set.length ? Object.keys(set[0]) : 'Empty table (setor)');
    }

    console.log('\n--- Patients ---');
    const { data: pat, error: errPat } = await supabase.from('patients').select('*').limit(1);
    if (errPat) console.error(errPat);
    else console.log(pat.length ? Object.keys(pat[0]) : 'Empty table');
}

inspectTables();
