import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  try {
    const { data, error } = await supabase
        .from('patients')
        .select(`
            id,
            name,
            uuid_colab,
            colaboradores:uuid_colab (
                cpf,
                sexo,
                data_nascimento,
                unidade (
                    nome_unidade,
                    clientes:empresaid (nome_fantasia)
                )
            ),
            cargos:role_id (nome),
            setor:sector_id (nome)
        `)
        .limit(1);
        
    if (error) {
        console.log('Error with deep join:', error.message);
    } else {
        console.log('Deep join success:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.log('Exception:', err.message);
  }
}

check();
