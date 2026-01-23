import React, { useState } from 'react';
import { Search, Plus, Filter, Calendar, X, Save, User, Building, Briefcase, MapPin, ChevronLeft, FileText, Users, CheckSquare, Square, Link as LinkIcon, Copy, ExternalLink, CheckCircle } from 'lucide-react';
import DashboardTable from '../components/DashboardTable';
import { useCompanyData } from '../hooks/useCompanyData';
import SearchableSelect from '../components/SearchableSelect';
import { supabase } from '../lib/supabase';

const Dashboard = () => {
    // Estado Mockado Removido. Apenas dados reais.
    const [patients, setPatients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);

    const [selectedPatient, setSelectedPatient] = useState(null);
    const [isMultipleModalOpen, setIsMultipleModalOpen] = useState(false);

    // Form Generation State
    const [generatedLink, setGeneratedLink] = useState(null);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

    // State for Quick Create Collaborator
    const [isCreatingCollaborator, setIsCreatingCollaborator] = useState(false);

    // Hook de Dados de Empresa
    const { companies, units, fetchUnits } = useCompanyData();

    // Transform options for SearchableSelect
    const companyOptions = companies.map(c => ({ label: c.nome_fantasia, value: c.id }));
    const unitOptions = units.map(u => ({ label: u.nome_unidade, value: u.id }));

    // States for Multiple Insertion
    const [multipleInsertion, setMultipleInsertion] = useState({ company: '', unit: '' });

    const [availableCollaborators, setAvailableCollaborators] = useState([]);
    const [selectedCollaborators, setSelectedCollaborators] = useState([]);

    // Reference Data for Dropdowns
    const [roles, setRoles] = useState([]);
    const [sectors, setSectors] = useState([]);

    // New Collaborator Form State
    const [newCollaborator, setNewCollaborator] = useState({
        name: '',
        cpf: '',
        roleId: '', // ID do cargo
        sectorId: '' // ID do setor
    });

    const roleOptions = roles.map(r => ({ label: r.nome || r.nome_cargo || 'Cargo sem nome', value: r.id }));
    const sectorOptions = sectors.map(s => ({ label: s.nome || s.nome_setor || 'Setor sem nome', value: s.id }));

    // Fetch Params (Cargos e Setores)
    React.useEffect(() => {
        const fetchParams = async () => {
            try {
                const [rolesRes, sectorsRes] = await Promise.all([
                    supabase.from('cargos').select('*'),
                    supabase.from('setor').select('*')
                ]);

                if (rolesRes.error) throw rolesRes.error;
                if (sectorsRes.error) throw sectorsRes.error;

                setRoles(rolesRes.data || []);
                setSectors(sectorsRes.data || []);
            } catch (err) {
                console.error('Erro ao carregar parâmetros (cargos/setores):', err);
            }
        };
        fetchParams();
    }, []);

    // Fetch Patients from DB
    const fetchPatients = async () => {
        setIsLoading(true);
        setFetchError(null);
        console.log('--- INICIANDO FETCH PATIENTS ---');
        try {
            // 1. Fetch Patients
            const { data: patientsData, error: patientsError } = await supabase
                .from('patients')
                .select(`
                    id, 
                    name, 
                    role_id, 
                    sector_id,
                    created_at,
                    cargos:role_id (nome),
                    setor:sector_id (nome)
                `)
                .order('created_at', { ascending: false });

            if (patientsError) {
                console.error('Erro na query Supabase (patients):', patientsError);
                throw patientsError;
            }

            console.log('Pacientes carregados (RAW):', patientsData);

            if (!patientsData || patientsData.length === 0) {
                console.warn('Query retornou array vazio.');
                setPatients([]);
                return;
            }

            // 2. Fetch Assessments separately to avoid Join error (PGRST200)
            const patientIds = patientsData.map(p => p.id);
            const { data: assessmentsData, error: assessmentsError } = await supabase
                .from('assessments')
                .select('id, patient_id, status, locked, created_at')
                .in('patient_id', patientIds);

            if (assessmentsError) {
                console.error('Erro na query Supabase (assessments):', assessmentsError);
                // We can continue without assessments if it's not a critical failure
            }

            // Mapeamento para tabela
            const mappedPatients = patientsData.map(p => {
                const cargoNome = p.cargos ? (p.cargos.nome_cargo || p.cargos.nome || 'Cargo') : 'Sem Cargo';
                const setorNome = p.setor ? (p.setor.nome_setor || p.setor.nome || 'Setor') : 'Sem Setor';

                // Formatação de data customizada: "22 Out 2026"
                const dateObj = new Date(p.created_at);
                const day = dateObj.getDate().toString().padStart(2, '0');
                const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                const month = months[dateObj.getMonth()];
                const year = dateObj.getFullYear();
                const date = `${day} ${month} ${year}`;

                // Find assessments for this patient
                const patientAssessments = (assessmentsData || []).filter(a => a.patient_id === p.id);

                // Get latest assessment
                let latestAssessment = null;
                if (patientAssessments.length > 0) {
                    latestAssessment = patientAssessments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
                }

                return {
                    id: p.id,
                    name: p.name,
                    company: 'Carregando...',
                    role: cargoNome,
                    sector: setorNome,
                    date: date,
                    status: latestAssessment ? latestAssessment.status : 'Pendente',
                    assessmentId: latestAssessment ? latestAssessment.id : null,
                    locked: latestAssessment ? latestAssessment.locked : false
                };
            });

            console.log('Pacientes Mapeados:', mappedPatients);
            setPatients(mappedPatients);
        } catch (err) {
            console.error('EXCEÇÃO em fetchPatients:', err);
            setFetchError(err.message);
        } finally {
            setIsLoading(false);
            console.log('--- FINALIZADO FETCH PATIENTS ---');
        }
    };

    // Load on Mount
    React.useEffect(() => {
        fetchPatients();
    }, []);

    // Handlers
    const handleSort = (key, direction) => {
        const sorted = [...patients].sort((a, b) => {
            if (a[key] < b[key]) return direction === 'ascending' ? -1 : 1;
            if (a[key] > b[key]) return direction === 'ascending' ? 1 : -1;
            return 0;
        });
        setPatients(sorted);
    };

    const handleUpdatePatient = (field, value) => {
        if (!selectedPatient) return;
        const updated = { ...selectedPatient, [field]: value };
        setSelectedPatient(updated);
        setPatients(patients.map(p => p.id === updated.id ? updated : p));
    };

    const handleDeletePatient = async (id) => {
        try {
            const { error } = await supabase
                .from('patients')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // Atualizar estado local
            setPatients(patients.filter(p => p.id !== id));
            // alert('Paciente excluído com sucesso.'); 
            // Opcional: Toast notification

        } catch (err) {
            console.error('Erro ao excluir paciente:', err);
            alert('Erro ao excluir: ' + err.message);
        }
    };

    // Handler: Toggle Lock
    const handleToggleLock = async (patientId, assessmentId, currentLockState) => {
        if (!assessmentId) {
            alert('Este paciente não possui uma avaliação criada para travar/liberar.');
            return;
        }

        try {
            const newLockState = !currentLockState;

            const { error } = await supabase
                .from('assessments')
                .update({ locked: newLockState })
                .eq('id', assessmentId);

            if (error) throw error;

            // Update Local State Optimistically
            setPatients(prev => prev.map(p => {
                if (p.id === patientId) {
                    return { ...p, locked: newLockState };
                }
                return p;
            }));

        } catch (err) {
            console.error('Error toggling lock:', err);
            alert('Erro ao alterar status de bloqueio: ' + err.message);
        }
    };

    // Handler: Generate Assessment Link
    const handleGenerateAssessment = async (patientId) => {
        try {
            // 1. Create Assessment
            const { data, error } = await supabase
                .from('assessments')
                .insert({
                    patient_id: patientId,
                    status: 'pending',
                    locked: false,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;

            // 2. Generate Link
            const link = `${window.location.origin}/quiz/${data.id}`;
            setGeneratedLink(link);
            setIsLinkModalOpen(true);

            // Refresh list to pick up the new assessment
            fetchPatients();

        } catch (err) {
            console.error('Error generating assessment:', err);
            alert('Erro ao gerar link: ' + err.message);
        }
    };

    // Handler Create Collaborator (Quick)
    const handleCreateCollaborator = async () => {
        // Validação básica
        if (!newCollaborator.name.trim() || !multipleInsertion.unit) {
            alert('Nome e Unidade são obrigatórios.');
            return;
        }

        try {
            const unitId = Number(multipleInsertion.unit);
            console.log(`Criando Colaborador Completo:`, newCollaborator, `Unidade: ${unitId}`);

            const payload = {
                nome: newCollaborator.name,
                unidade: unitId,
                avulso: true,
                cpf: newCollaborator.cpf || null,
                cargo: newCollaborator.roleId || null,
                setorid: newCollaborator.sectorId || null
            };

            const { data, error } = await supabase
                .from('colaboradores')
                .insert(payload)
                .select()
                .single();

            if (error) throw error;

            console.log('Colaborador criado:', data);

            // Reset
            setNewCollaborator({ name: '', cpf: '', roleId: '', sectorId: '' });
            setIsCreatingCollaborator(false);

            // Refresh list
            handleSearchCollaborators();
            alert('Colaborador adicionado com sucesso!');

        } catch (err) {
            console.error('Erro ao criar colaborador:', err.message);
            alert('Erro ao criar: ' + err.message);
        }
    };



    // Handlers para Multiple Insertion Dropdowns
    const handleMultipleCompanyChange = (value) => {
        setMultipleInsertion({ ...multipleInsertion, company: value, unit: '' });
        fetchUnits(value);
        setAvailableCollaborators([]);
    };

    const handleMultipleUnitChange = (value) => {
        setMultipleInsertion({ ...multipleInsertion, unit: value });
    };

    const handleSearchCollaborators = async () => {
        if (!multipleInsertion.unit) {
            console.log('handleSearch: Nenhuma unidade selecionada.');
            return;
        }

        const unitIdRaw = multipleInsertion.unit;
        const unitId = Number(unitIdRaw);

        console.log(`--- INICIANDO BUSCA DE COLABORADORES ---`);
        console.log(`Unidade Selecionada (Raw):`, unitIdRaw, `(Type: ${typeof unitIdRaw})`);
        console.log(`Unidade Selecionada (Number):`, unitId, `(Type: ${typeof unitId})`);

        try {
            // BUSCA 1: Tentar buscar TUDO dessa unidade sem JOINS para ver se existe algo
            const { count, error: countError } = await supabase
                .from('colaboradores')
                .select('*', { count: 'exact', head: true })
                .eq('unidade', unitId);

            if (countError) console.error('Erro ao contar colaboradores da unidade:', countError);
            console.log(`Verificação Inicial: Existem ${count} colaboradores com unidade=${unitId}`);

            if (count === 0) {
                console.warn('ALERTA: Nenhum colaborador encontrado para este ID de unidade na tabela colaboradores.');
                // Não vou retornar aqui para permitir mostrar a UI vazia onde tem o botão de adicionar
                setAvailableCollaborators([]);
                // return; 
            }

            // BUSCA 2: Busca completa com Joins
            console.log('Executando query completa com Joins...');

            const { data, error } = await supabase
                .from('colaboradores')
                .select(`
                    id, 
                    nome, 
                    cargo, 
                    setorid,
                    cargos:cargo (*),      
                    setor:setorid (*)
                `)
                .eq('unidade', unitId);

            if (error) {
                console.error('ERRO SUPABASE (Query Completa):', error);
                throw error;
            }

            console.log('DADOS RETORNADOS (Query Completa):', data);

            // Mapeamento
            const mapped = (data || []).map(c => {
                const cargoObj = c.cargos;
                const setorObj = c.setor;

                const cargoNome = cargoObj ? (cargoObj.nome_cargo || cargoObj.nome || 'Cargo') : (c.cargo ? `ID: ${c.cargo}` : 'Sem Cargo');
                const setorNome = setorObj ? (setorObj.nome_setor || setorObj.nome || 'Setor') : (c.setorid ? `ID: ${c.setorid}` : 'Sem Setor');

                return {
                    id: c.id,
                    name: c.nome,
                    role: cargoNome,
                    sector: setorNome,
                    originalData: c
                };
            });

            console.log(`Mapeamento concluído. ${mapped.length} itens prontos para exibir.`);
            setAvailableCollaborators(mapped);

        } catch (err) {
            console.error('EXCEÇÃO em handleSearchCollaborators:', err);
            console.error('Mensagem:', err.message);
        }
    };

    // Trigger busca quando Unit está selecionada
    React.useEffect(() => {
        if (isMultipleModalOpen && multipleInsertion.unit) {
            handleSearchCollaborators();
        }
    }, [multipleInsertion.company, multipleInsertion.unit, isMultipleModalOpen]);


    const toggleCollaboratorSelection = (id) => {
        if (selectedCollaborators.includes(id)) {
            setSelectedCollaborators(selectedCollaborators.filter(cId => cId !== id));
        } else {
            setSelectedCollaborators([...selectedCollaborators, id]);
        }
    };

    const handleImportCollaborators = async () => {
        try {
            const selectedCols = availableCollaborators.filter(c => selectedCollaborators.includes(c.id));

            // Preparar payload para tabela 'patients'
            const inserts = selectedCols.map(c => ({
                id: c.id,
                name: c.name,
                role_id: c.originalData.cargo,
                sector_id: c.originalData.setorid
            }));

            console.log('Inserindo pacientes:', inserts);

            const { error } = await supabase
                .from('patients')
                .insert(inserts);

            if (error) throw error;

            // Sucesso
            setIsMultipleModalOpen(false);
            setMultipleInsertion({ company: '', unit: '' });
            setAvailableCollaborators([]);
            setSelectedCollaborators([]);

            // Recarregar Dados Reais
            fetchPatients();

        } catch (err) {
            console.error('Erro ao importar pacientes:', err.message);
            alert('Erro ao importar: ' + err.message);
        }
    };

    return (
        <div className="flex flex-col h-full gap-6 relative">



            {/* Modal de Inserção Múltipla */}
            {isMultipleModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
                    <div
                        className={`bg-white rounded-[32px] p-8 shadow-2xl transform transition-all duration-500 ease-in-out flex flex-col max-h-[90vh] ${isCreatingCollaborator ? 'w-full max-w-6xl' : 'w-full max-w-2xl'
                            }`}
                    >
                        {/* DEBUG LOG */}
                        {console.log('[RENDER] Modal. isCreatingCollaborator:', isCreatingCollaborator)}

                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">Inserir Paciente</h2>
                                <p className="text-slate-500 text-sm">
                                    {isCreatingCollaborator
                                        ? "Busque ou cadastre um novo colaborador."
                                        : "Selecione empresa e unidade para listar colaboradores."}
                                </p>
                            </div>
                            <button onClick={() => setIsMultipleModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex gap-8 flex-1 overflow-hidden">
                            {/* LADO ESQUERDO: Busca e Lista */}
                            <div className="flex-1 flex flex-col space-y-6 overflow-hidden">
                                {/* Seleção de Contexto */}
                                <div className="grid grid-cols-2 gap-4 p-1">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Empresa</label>
                                        <SearchableSelect
                                            options={companyOptions}
                                            value={multipleInsertion.company}
                                            onChange={handleMultipleCompanyChange}
                                            placeholder="Buscar Empresa..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Unidade</label>
                                        <SearchableSelect
                                            options={unitOptions}
                                            value={multipleInsertion.unit}
                                            onChange={handleMultipleUnitChange}
                                            placeholder="Buscar Unidade..."
                                            disabled={!multipleInsertion.company}
                                        />
                                    </div>
                                </div>

                                {/* Lista de Colaboradores */}
                                <div className="flex-1 border border-slate-200 rounded-xl overflow-hidden flex flex-col relative transition-all">
                                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                                        <h3 className="font-semibold text-slate-700">Colaboradores Encontrados</h3>
                                        <div className="text-xs text-slate-500">
                                            {selectedCollaborators.length} selecionados
                                        </div>
                                    </div>
                                    <div className="overflow-y-auto p-2 space-y-1 bg-white flex-1 min-h-[150px]">
                                        {availableCollaborators.length > 0 ? (
                                            availableCollaborators.map((collab) => (
                                                <div
                                                    key={collab.id}
                                                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedCollaborators.includes(collab.id) ? 'bg-blue-50 border border-blue-100' : 'hover:bg-slate-50 border border-transparent'}`}
                                                    onClick={() => toggleCollaboratorSelection(collab.id)}
                                                >
                                                    <div className={`text-slate-400 ${selectedCollaborators.includes(collab.id) ? 'text-blue-600' : ''}`}>
                                                        {selectedCollaborators.includes(collab.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-medium text-slate-800">{collab.name}</div>
                                                        <div className="text-xs text-slate-500">{collab.role} • {collab.sector}</div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
                                                <Users size={32} className="mb-2 opacity-50" />
                                                {multipleInsertion.company && multipleInsertion.unit ? (
                                                    <p className="text-sm">Nenhum colaborador encontrado.</p>
                                                ) : (
                                                    <p className="text-sm">Selecione Empresa e Unidade para buscar.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Botão de Expandir (Rodapé da lista) */}
                                    {multipleInsertion.unit && !isCreatingCollaborator && (
                                        <div className="border-t border-slate-100 p-3 bg-slate-50 animate-fadeIn">
                                            <button
                                                onClick={() => {
                                                    console.log('[UI] Clicked Include Manual. Setting state true.');
                                                    setIsCreatingCollaborator(true);
                                                }}
                                                className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-slate-500 text-sm hover:bg-white hover:border-slate-400 hover:text-slate-700 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Plus size={16} />
                                                Não encontrou? Incluir manualmente
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* LADO DIREITO: Formulário de Criação (Condicional) */}
                            {console.log('[RENDER] Right Side Block. Visible?', isCreatingCollaborator)}
                            <div className={`
                                flex-1 bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col
                                transition-all duration-500 ease-in-out transform origin-left
                                ${isCreatingCollaborator ? 'opacity-100 translate-x-0 w-1/2 block' : 'opacity-0 -translate-x-10 w-0 hidden'}
                            `}>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        <User size={20} className="text-[#050a30]" />
                                        Novo Colaborador
                                    </h3>
                                    <button
                                        onClick={() => setIsCreatingCollaborator(false)}
                                        className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded-full"
                                        title="Fechar formulário"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo *</label>
                                        <input
                                            type="text"
                                            value={newCollaborator.name}
                                            onChange={(e) => setNewCollaborator({ ...newCollaborator, name: e.target.value })}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            placeholder="Nome do colaborador"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">CPF</label>
                                        <input
                                            type="text"
                                            value={newCollaborator.cpf}
                                            onChange={(e) => setNewCollaborator({ ...newCollaborator, cpf: e.target.value })}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            placeholder="000.000.000-00"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Cargo</label>
                                            <SearchableSelect
                                                options={roleOptions}
                                                value={newCollaborator.roleId}
                                                onChange={(val) => setNewCollaborator({ ...newCollaborator, roleId: val })}
                                                placeholder="Selecione..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Setor</label>
                                            <SearchableSelect
                                                options={sectorOptions}
                                                value={newCollaborator.sectorId}
                                                onChange={(val) => setNewCollaborator({ ...newCollaborator, sectorId: val })}
                                                placeholder="Selecione..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-slate-200 flex justify-end gap-3">
                                    <button
                                        onClick={() => setIsCreatingCollaborator(false)}
                                        className="px-6 py-3 text-slate-600 font-medium hover:bg-slate-200 rounded-xl transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleCreateCollaborator}
                                        className="px-6 py-3 bg-[#050a30] text-white font-medium rounded-xl hover:bg-[#050a30]/90 shadow-lg shadow-blue-900/20 transition-all active:scale-95"
                                    >
                                        Cadastrar
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3 pt-4 border-t border-slate-100">
                            <button
                                onClick={() => setIsMultipleModalOpen(false)}
                                className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                            >
                                Fechar
                            </button>
                            <button
                                onClick={handleImportCollaborators}
                                disabled={selectedCollaborators.length === 0}
                                className="flex-1 py-3 bg-[#050a30] text-white rounded-xl font-medium hover:bg-[#050a30]/90 shadow-lg shadow-blue-900/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Importar Selecionados ({selectedCollaborators.length})
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* 1. Card Superior (Filtros) */}
            <div className="bg-white p-6 rounded-[32px] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-500">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    {selectedPatient ? (
                        <button
                            onClick={() => setSelectedPatient(null)}
                            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-medium"
                        >
                            <div className="bg-slate-100 p-2 rounded-full">
                                <ChevronLeft size={20} />
                            </div>
                            <span>Voltar para Lista</span>
                        </button>
                    ) : (
                        <div className="relative w-full md:w-96 transition-all duration-500">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar paciente..."
                                className="pl-11 pr-4 py-2.5 w-full bg-gray-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all text-slate-700 placeholder:text-gray-400"
                            />
                        </div>
                    )}
                </div>

                {!selectedPatient && (
                    <div className="flex items-center gap-3 w-full md:w-auto overflow-hidden">
                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 border border-slate-200 transition-colors font-medium text-sm whitespace-nowrap">
                            <Filter size={18} />
                            <span>Filtrar</span>
                        </button>

                        <button
                            onClick={() => setIsMultipleModalOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#050a30] text-white rounded-xl hover:bg-[#050a30]/90 shadow-lg shadow-blue-900/20 transition-all font-bold text-sm whitespace-nowrap"
                        >
                            <Users size={18} />
                            <span>Inserir Paciente</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Container Principal: Tabela -> Edição (Split) */}
            <div className="flex flex-1 gap-6 overflow-visible relative">

                {/* Lado Esquerdo: Tabela OU Formulário */}
                <div className={`bg-white rounded-[32px] shadow-sm flex flex-col overflow-visible transition-all duration-500 ease-in-out ${selectedPatient ? 'w-2/5 p-8' : 'w-full'}`}>

                    {selectedPatient ? (
                        // MODO EDIÇÃO: Formulário
                        <div className="flex flex-col h-full animate-fadeIn">
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-slate-800">Editar Paciente</h2>
                                <p className="text-slate-500">Atualize os dados cadastrais.</p>
                            </div>

                            <div className="space-y-6 overflow-y-auto pr-2">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                        <User size={16} className="text-slate-400" /> Nome Completo
                                    </label>
                                    <input
                                        type="text"
                                        value={selectedPatient.name}
                                        onChange={(e) => handleUpdatePatient('name', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                        <Building size={16} className="text-slate-400" /> Empresa
                                    </label>
                                    <input
                                        type="text"
                                        value={selectedPatient.company}
                                        onChange={(e) => handleUpdatePatient('company', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                            <Briefcase size={16} className="text-slate-400" /> Cargo
                                        </label>
                                        <input
                                            type="text"
                                            value={selectedPatient.role}
                                            onChange={(e) => handleUpdatePatient('role', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                            <MapPin size={16} className="text-slate-400" /> Setor
                                        </label>
                                        <input
                                            type="text"
                                            value={selectedPatient.sector}
                                            onChange={(e) => handleUpdatePatient('sector', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto pt-6 flex gap-3">
                                <button onClick={() => setSelectedPatient(null)} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors">
                                    Cancelar
                                </button>
                                <button onClick={() => setSelectedPatient(null)} className="flex-1 py-3 bg-[#050a30] text-white rounded-xl font-medium hover:bg-[#050a30]/90 shadow-lg shadow-blue-900/20 transition-colors flex items-center justify-center gap-2">
                                    <Save size={18} />
                                    Salvar
                                </button>
                            </div>
                        </div>
                    ) : (
                        // MODO VISUALIZAÇÃO: Tabela com Loading e Empty State
                        isLoading ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <div className="w-8 h-8 border-4 border-[#050a30] border-t-transparent rounded-full animate-spin mb-4"></div>
                                <p>Carregando pacientes do banco de dados...</p>
                            </div>
                        ) : fetchError ? (
                            <div className="h-full flex flex-col items-center justify-center text-red-500">
                                <p className="font-semibold text-lg">Erro ao carregar dados</p>
                                <p className="font-mono text-sm mt-2 max-w-md text-center">{fetchError}</p>
                                <button onClick={fetchPatients} className="mt-4 px-4 py-2 bg-slate-100 rounded-lg text-slate-700 hover:bg-slate-200">
                                    Tentar Novamente
                                </button>
                            </div>
                        ) : patients.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <div className="bg-slate-50 p-6 rounded-full mb-4">
                                    <Users size={40} className="opacity-50" />
                                </div>
                                <p className="text-lg font-medium text-slate-600">Nenhum paciente cadastrado</p>
                                <p className="text-sm max-w-xs text-center mt-2 opacity-80">Use o botão "Inserção Múltipla" acima para buscar colaboradores e cadastrá-los como pacientes.</p>
                            </div>
                        ) : (
                            <DashboardTable
                                patients={patients}
                                onEdit={setSelectedPatient}
                                onSort={handleSort}
                                onDelete={handleDeletePatient}
                                onGenerateForm={handleGenerateAssessment}
                                onToggleLock={handleToggleLock}
                            />
                        )
                    )}
                </div>

                {/* 3. Painel Lateral (Placeholder para manter layout de Split conforme pedido) */}
                <div
                    className={`bg-white rounded-[32px] shadow-sm flex-1 flex flex-col transition-all duration-500 ease-in-out transform ${selectedPatient
                        ? 'translate-x-0 opacity-100'
                        : 'translate-x-full opacity-0 absolute right-0 w-1/2'
                        }`}
                >
                    {selectedPatient && (
                        <div className="flex flex-col h-full p-8 relative items-center justify-center text-center">
                            <div className="p-6 bg-slate-50 rounded-full mb-4">
                                <FileText size={48} className="text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">Prontuário / Histórico</h3>
                            <p className="text-slate-500 max-w-md mx-auto mt-2">
                                Selecione uma ação ou visualize o histórico completo deste paciente aqui. (Placeholder)
                            </p>
                        </div>
                    )}
                </div>

            </div>

            {/* Modal de Link Gerado */}
            {isLinkModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <LinkIcon size={20} className="text-[#35b6cf]" />
                                Link Gerado
                            </h3>
                            <button onClick={() => setIsLinkModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>

                        <p className="text-sm text-slate-500 mb-4">
                            Envie este link para o paciente preencher a avaliação de onde estiver.
                        </p>

                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between gap-3 mb-6">
                            <span className="text-sm text-slate-600 truncate font-mono select-all">
                                {generatedLink}
                            </span>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(generatedLink);
                                    alert('Link copiado!');
                                }}
                                className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded transition-colors"
                                title="Copiar"
                            >
                                <Copy size={16} />
                            </button>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsLinkModalOpen(false)}
                                className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                            >
                                Fechar
                            </button>
                            <a
                                href={generatedLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 py-2.5 bg-[#35b6cf] text-white rounded-xl font-medium hover:bg-[#2ca1b7] shadow-lg shadow-cyan-500/20 transition-colors flex items-center justify-center gap-2"
                            >
                                Abrir <ExternalLink size={16} />
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default Dashboard;
