import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useCompanyData = () => {
    const [companies, setCompanies] = useState([]);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);

    // Carregar Clientes (Empresas) ao iniciar
    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            const { data, error } = await supabase
                .from('clientes')
                .select('id, nome_fantasia')
                .order('nome_fantasia');

            if (error) throw error;
            setCompanies(data || []);
        } catch (error) {
            console.error('Erro ao buscar empresas:', error.message);
        } finally {
            setLoading(false);
        }
    };

    // Buscar Unidades baseadas no ID do Cliente
    const fetchUnits = async (companyId) => {
        if (!companyId) {
            setUnits([]);
            return;
        }

        try {
            // Assumindo que a chave estrangeira na tabela 'unidades' seja 'cliente_id'
            // O usuário não especificou, mas é o padrão. Se falhar, ajustaremos.
            const { data, error } = await supabase
                .from('unidades')
                .select('id, nome_unidade')
                .eq('empresaid', companyId)
                .order('nome_unidade');

            if (error) throw error;
            setUnits(data || []);
        } catch (error) {
            console.error('Erro ao buscar unidades:', error.message);
            setUnits([]);
        }
    };

    return {
        companies,
        units,
        fetchUnits,
        loading
    };
};
