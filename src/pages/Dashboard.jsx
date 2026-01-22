import React, { useState } from 'react';
import { Search, Plus, Filter, Calendar, X, Save, User, Building, Briefcase, MapPin, ChevronLeft, FileText, Users, CheckSquare, Square } from 'lucide-react';
import DashboardTable from '../components/DashboardTable';
import { useCompanyData } from '../hooks/useCompanyData';

const Dashboard = () => {
    // Estado Mockado Elevado
    const [patients, setPatients] = useState([
        { id: 1, name: 'Ana Silva', company: 'Tech Corp', role: 'Dev Senior', sector: 'TI', date: '22/01/2026', status: 'Concluído' },
        { id: 2, name: 'Carlos Souza', company: 'Inova Rh', role: 'Recrutador', sector: 'RH', date: '21/01/2026', status: 'Em Análise' },
        { id: 3, name: 'Beatriz Costa', company: 'Tech Corp', role: 'Designer', sector: 'Marketing', date: '20/01/2026', status: 'Pendente' },
        { id: 4, name: 'Daniel Oliveira', company: 'Construtora Exemplo', role: 'Engenheiro', sector: 'Obras', date: '19/01/2026', status: 'Concluído' },
        { id: 5, name: 'Eduarda Lima', company: 'Inova Rh', role: 'Analista', sector: 'Financeiro', date: '18/01/2026', status: 'Agendado' },
        { id: 6, name: 'Fernanda Alves', company: 'Tech Corp', role: 'PO', sector: 'Produto', date: '17/01/2026', status: 'Concluído' },
        { id: 7, name: 'Gabriel Santos', company: 'Construtora Exemplo', role: 'Mestre de Obras', sector: 'Obras', date: '16/01/2026', status: 'Pendente' },
    ]);

    const [selectedPatient, setSelectedPatient] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMultipleModalOpen, setIsMultipleModalOpen] = useState(false);

    // Hook de Dados de Empresa
    const { companies, units, fetchUnits } = useCompanyData();

    // States for Single Insertion
    const [newPatient, setNewPatient] = useState({ name: '', company: '', role: '', sector: '', unit: '' });

    // States for Multiple Insertion
    const [multipleInsertion, setMultipleInsertion] = useState({ company: '', unit: '' });
    const [availableCollaborators, setAvailableCollaborators] = useState([]);
    const [selectedCollaborators, setSelectedCollaborators] = useState([]);

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

    const handleAddPatient = () => {
        const id = patients.length + 1;
        const date = new Date().toLocaleDateString('pt-BR');

        // Encontrar nomes para exibição
        const companyName = companies.find(c => c.id === newPatient.company)?.nome_fantasia || newPatient.company;

        const patientToAdd = {
            id,
            ...newPatient,
            company: companyName, // Salvando nome para exibir na tabela
            date,
            status: 'Pendente'
        };
        setPatients([patientToAdd, ...patients]);
        setIsModalOpen(false);
        setNewPatient({ name: '', company: '', role: '', sector: '', unit: '' });
    };

    // Handlers para Single Insertion Dropdowns
    const handleSingleCompanyChange = (e) => {
        const companyId = e.target.value;
        setNewPatient({ ...newPatient, company: companyId, unit: '' });
        fetchUnits(companyId);
    };

    // Handlers para Multiple Insertion Dropdowns
    const handleMultipleCompanyChange = (e) => {
        const companyId = e.target.value;
        setMultipleInsertion({ ...multipleInsertion, company: companyId, unit: '' });
        fetchUnits(companyId);
        setAvailableCollaborators([]); // Limpar lista anterior
    };

    const handleMultipleUnitChange = (e) => {
        setMultipleInsertion({ ...multipleInsertion, unit: e.target.value });
    };

    const handleSearchCollaborators = () => {
        // Mocking a fetch
        if (multipleInsertion.company && multipleInsertion.unit) {
            setAvailableCollaborators([
                { id: 101, name: 'Roberto Santos', role: 'Dev Frontend', sector: 'TI' },
                { id: 102, name: 'Julia Lima', role: 'UX Designer', sector: 'Design' },
                { id: 103, name: 'Marcos Paulo', role: 'Product Owner', sector: 'Produto' },
                { id: 104, name: 'Larissa Manoela', role: 'QA', sector: 'TI' },
                { id: 105, name: 'Pedro Pascal', role: 'Dev Backend', sector: 'TI' },
            ]);
        }
    };

    const toggleCollaboratorSelection = (id) => {
        if (selectedCollaborators.includes(id)) {
            setSelectedCollaborators(selectedCollaborators.filter(cId => cId !== id));
        } else {
            setSelectedCollaborators([...selectedCollaborators, id]);
        }
    };

    const handleImportCollaborators = () => {
        const date = new Date().toLocaleDateString('pt-BR');

        const companyName = companies.find(c => c.id === multipleInsertion.company)?.nome_fantasia || multipleInsertion.company;

        const newPatients = availableCollaborators
            .filter(c => selectedCollaborators.includes(c.id))
            .map((c, index) => ({
                id: patients.length + index + 1,
                name: c.name,
                company: companyName,
                role: c.role,
                sector: c.sector,
                date,
                status: 'Pendente'
            }));

        setPatients([...newPatients, ...patients]);
        setIsMultipleModalOpen(false);
        setMultipleInsertion({ company: '', unit: '' });
        setAvailableCollaborators([]);
        setSelectedCollaborators([]);
    };

    return (
        <div className="flex flex-col h-full gap-6 relative">

            {/* Modal de Nova Avaliação (Single) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white rounded-[32px] p-8 w-full max-w-lg shadow-2xl transform transition-all scale-100">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-slate-800">Nova Avaliação</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Empresa</label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                                        value={newPatient.company}
                                        onChange={handleSingleCompanyChange}
                                    >
                                        <option value="">Selecione</option>
                                        {companies.map(company => (
                                            <option key={company.id} value={company.id}>
                                                {company.nome_fantasia}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Unidade</label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                                        value={newPatient.unit}
                                        onChange={(e) => setNewPatient({ ...newPatient, unit: e.target.value })}
                                        disabled={!newPatient.company}
                                    >
                                        <option value="">Selecione</option>
                                        {units.map(unit => (
                                            <option key={unit.id} value={unit.id}>
                                                {unit.nome_unidade}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Paciente</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    placeholder="Ex: João Silva"
                                    value={newPatient.name}
                                    onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Cargo</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        placeholder="Ex: Desenvolvedor"
                                        value={newPatient.role}
                                        onChange={(e) => setNewPatient({ ...newPatient, role: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Setor</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        placeholder="Ex: TI"
                                        value={newPatient.sector}
                                        onChange={(e) => setNewPatient({ ...newPatient, sector: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleAddPatient}
                            className="w-full mt-8 py-3 bg-[#050a30] text-white rounded-xl font-medium hover:bg-[#050a30]/90 shadow-lg shadow-blue-900/20 transition-all active:scale-95"
                        >
                            Adicionar Paciente
                        </button>
                    </div>
                </div>
            )}

            {/* Modal de Inserção Múltipla */}
            {isMultipleModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white rounded-[32px] p-8 w-full max-w-2xl shadow-2xl transform transition-all scale-100 flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">Inserção Múltipla</h2>
                                <p className="text-slate-500 text-sm">Selecione empresa e unidade para listar colaboradores.</p>
                            </div>
                            <button onClick={() => setIsMultipleModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-6 flex-1 overflow-hidden flex flex-col">
                            {/* Seleção de Contexto */}
                            <div className="grid grid-cols-2 gap-4 p-1">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Empresa</label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                                        value={multipleInsertion.company}
                                        onChange={handleMultipleCompanyChange}
                                    >
                                        <option value="">Selecione</option>
                                        {companies.map(company => (
                                            <option key={company.id} value={company.id}>
                                                {company.nome_fantasia}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Unidade</label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                                        value={multipleInsertion.unit}
                                        onChange={handleMultipleUnitChange}
                                        onBlur={handleSearchCollaborators} // Manter busca ao sair/selecionar
                                        disabled={!multipleInsertion.company}
                                    >
                                        <option value="">Selecione</option>
                                        {units.map(unit => (
                                            <option key={unit.id} value={unit.id}>
                                                {unit.nome_unidade}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Lista de Colaboradores */}
                            <div className="flex-1 border border-slate-200 rounded-xl overflow-hidden flex flex-col">
                                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                                    <h3 className="font-semibold text-slate-700">Colaboradores Encontrados</h3>
                                    <div className="text-xs text-slate-500">
                                        {selectedCollaborators.length} selecionados de {availableCollaborators.length}
                                    </div>
                                </div>
                                <div className="overflow-y-auto p-2 space-y-1 bg-white flex-1">
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
                                            <p className="text-sm">Selecione Empresa e Unidade para buscar.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button
                                onClick={() => setIsMultipleModalOpen(false)}
                                className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleImportCollaborators}
                                disabled={selectedCollaborators.length === 0}
                                className="flex-1 py-3 bg-[#050a30] text-white rounded-xl font-medium hover:bg-[#050a30]/90 shadow-lg shadow-blue-900/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Importar Selecionados
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
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar paciente..."
                                className="pl-10 pr-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
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

                        <div className="ml-auto md:ml-2 flex items-center gap-2">
                            <button
                                onClick={() => setIsMultipleModalOpen(true)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#050a30] border-2 border-[#050a30] rounded-xl hover:bg-blue-50 transition-all font-bold text-sm whitespace-nowrap"
                            >
                                <Users size={18} />
                                <span>Inserção Múltipla</span>
                            </button>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-[#050a30] text-white rounded-xl hover:bg-[#050a30]/90 shadow-lg shadow-blue-900/20 transition-all font-medium text-sm whitespace-nowrap"
                            >
                                <Plus size={18} />
                                <span>Nova Avaliação</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Container Principal: Tabela -> Edição (Split) */}
            <div className="flex flex-1 gap-6 overflow-hidden relative">

                {/* Lado Esquerdo: Tabela OU Formulário */}
                <div className={`bg-white rounded-[32px] shadow-sm flex-col overflow-hidden transition-all duration-500 ease-in-out ${selectedPatient ? 'w-2/5 p-8' : 'w-full'}`}>

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
                        // MODO VISUALIZAÇÃO: Tabela
                        <DashboardTable
                            patients={patients}
                            onEdit={setSelectedPatient}
                            onSort={handleSort}
                        />
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
        </div>
    );
};

export default Dashboard;
