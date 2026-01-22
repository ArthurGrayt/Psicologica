import React, { useState } from 'react';
import { Search, Plus, Filter, Calendar, X, Save, User, Building, Briefcase, MapPin, ChevronLeft, FileText } from 'lucide-react';
import DashboardTable from '../components/DashboardTable';

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
    const [newPatient, setNewPatient] = useState({ name: '', company: '', role: '', sector: '' });

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
        const patientToAdd = {
            id,
            ...newPatient,
            date,
            status: 'Pendente' // Status inicial padrão
        };
        setPatients([patientToAdd, ...patients]);
        setIsModalOpen(false);
        setNewPatient({ name: '', company: '', role: '', sector: '' });
    };

    return (
        <div className="flex flex-col h-full gap-6 relative">

            {/* Modal de Nova Avaliação */}
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
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        placeholder="Ex: Tech Corp"
                                        value={newPatient.company}
                                        onChange={(e) => setNewPatient({ ...newPatient, company: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Unidade</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        placeholder="Ex: Matriz"
                                        value={newPatient.unit || ''}
                                        onChange={(e) => setNewPatient({ ...newPatient, unit: e.target.value })}
                                    />
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
                            <Calendar size={18} />
                            <span>Data</span>
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 border border-slate-200 transition-colors font-medium text-sm whitespace-nowrap">
                            <Filter size={18} />
                            <span>Empresa</span>
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 border border-slate-200 transition-colors font-medium text-sm whitespace-nowrap">
                            <Filter size={18} />
                            <span>Cargo</span>
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 border border-slate-200 transition-colors font-medium text-sm whitespace-nowrap">
                            <Filter size={18} />
                            <span>Setor</span>
                        </button>

                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="ml-auto md:ml-2 flex items-center gap-2 px-5 py-2.5 bg-[#050a30] text-white rounded-xl hover:bg-[#050a30]/90 shadow-lg shadow-blue-900/20 transition-all font-medium text-sm whitespace-nowrap"
                        >
                            <Plus size={18} />
                            <span>Nova Avaliação</span>
                        </button>
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
