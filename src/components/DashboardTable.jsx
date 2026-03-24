import React, { useState, useEffect, useRef } from 'react';
import { FileText, Calendar, Pencil, Unlock, Lock, ArrowUpDown, Trash2, Link as LinkIcon, MoreHorizontal, ChevronDown, CheckCircle, MessageSquare } from 'lucide-react';

const DashboardTable = ({ patients, totalItems, currentPage, itemsPerPage, onPageChange, onEdit, onSort, onDelete, onGenerateForm, onViewAnswers, onGenerateReport }) => {
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
    const dropdownRef = useRef(null);
    const [selectedPatientDetails, setSelectedPatientDetails] = useState(null);

    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

    // No explicit click outside listener needed with backdrop approach

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
        onSort(key, direction);
    };

    const getSortIcon = (columnName) => {
        const isActive = sortConfig.key === columnName;
        return (
            <ArrowUpDown
                size={14}
                className={`ml-2 inline-block transition-all duration-200 ${isActive
                    ? 'opacity-100 text-blue-600'
                    : 'opacity-0 group-hover:opacity-40 text-slate-400'
                    }`}
            />
        );
    };

    const toTitleCase = (text) => {
        if (!text) return '';
        return text.toLowerCase().split(' ').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    const renderCellContent = (value, shouldTitleCase = false) => {
        const placeholders = ['Sem Cargo', 'Sem Setor', 'CARREGANDO...', 'Carregando...', 'null', 'undefined'];
        const isEmpty = !value || placeholders.includes(value.toString().trim());

        if (isEmpty) {
            return <span className="text-gray-300 font-light text-sm">—</span>;
        }

        const displayValue = shouldTitleCase ? toTitleCase(value) : value;
        return <span className="text-gray-500 text-sm font-normal">{displayValue}</span>;
    };

    return (
        <div className="w-full h-full flex flex-col">
            {/* Mobile/Tablet/iPad Pro Card View (Visible up to xl) */}
            <div className="xl:hidden space-y-4 pb-32">
                {patients.map((patient) => (
                    <div key={patient.id} className="bg-white p-5 rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100 relative">
                        {/* Card Header: Avatar + Info + Actions */}
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-full bg-cyan-50 flex-shrink-0 flex items-center justify-center text-[#139690] font-bold text-lg">
                                    {patient.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-[15px] leading-tight mb-0.5">{patient.name}</h3>
                                    <p className="text-slate-400 text-xs font-medium">CPF: {patient.cpf}</p>
                                </div>
                            </div>

                            {/* Actions Trigger */}
                            <button
                                className="p-2 -mr-2 text-slate-300 hover:text-slate-600 transition-colors"
                                onClick={(e) => {
                                    // Previne a propagação do clique para elementos pai
                                    e.stopPropagation();
                                    // Obtém as coordenadas do botão clicado
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    // Define uma altura estimada para o dropdown no mobile para cálculo de espaço
                                    const dropdownHeight = 260;
                                    // Calcula o espaço livre abaixo do botão
                                    const spaceBelow = window.innerHeight - rect.bottom;
                                    
                                    // Se o espaço abaixo for menor que a altura do dropdown, abre para cima
                                    const openUpward = spaceBelow < dropdownHeight;

                                    // Define a posição do menu flutuante (fixed)
                                    setDropdownPosition({
                                        top: openUpward ? rect.top - dropdownHeight - 5 : rect.bottom + 5,
                                        right: window.innerWidth - rect.right + 20 // Ajuste para o padding lateral do mobile
                                    });
                                    // Alterna a exibição do dropdown para este paciente específico
                                    setOpenDropdownId(openDropdownId === patient.id ? null : patient.id);
                                }}
                            >
                                <MoreHorizontal size={24} />
                            </button>
                        </div>

                        {/* Card Body: Grid Info */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Empresa</p>
                                <p className="text-sm text-slate-700 font-semibold">{patient.company || '—'}</p>
                            </div>
                            <div className="text-right flex flex-col justify-end">
                                <p className="text-sm text-slate-700 font-semibold flex items-center justify-end gap-1.5 mt-auto">
                                    <Calendar size={14} className="text-slate-400" />
                                    {patient.date}
                                </p>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-slate-50 w-full mb-4" />

                        {/* Card Footer: Status + Link */}
                        <div className="flex justify-between items-center">
                            <span className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                                patient.status === 'completed' || patient.status === 'Concluído' || patient.status === 'reported' || patient.status === 'Laudado' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                    patient.locked ? 'bg-red-50 text-red-700 border-red-100' :
                                        patient.status === 'in_progress' || patient.status === 'Em Análise' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                            patient.status === 'sent' || patient.status === 'Enviado' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                'bg-yellow-50 text-yellow-700 border-yellow-100'
                                }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${
                                    patient.status === 'completed' || patient.status === 'reported' || patient.status === 'Laudado' ? 'bg-emerald-500' :
                                        patient.locked ? 'bg-red-500' :
                                            patient.status === 'in_progress' ? 'bg-blue-500' :
                                                'bg-yellow-500' // Default
                                    }`} />
                                {patient.status === 'reported' || patient.status === 'Laudado' ? 'Laudado' :
                                    patient.status === 'completed' || patient.status === 'Concluído' ? 'Respondido' :
                                        patient.locked ? 'Bloqueado' :
                                            patient.status === 'pending' ? 'Pendente' :
                                                patient.status === 'sent' ? 'Enviado' :
                                                    patient.status === 'in_progress' ? 'Em Progresso' : patient.status}
                            </span>

                            <button
                                onClick={() => setSelectedPatientDetails(patient)}
                                className="text-[#139690] text-sm font-bold flex items-center gap-1 hover:opacity-80 transition-opacity"
                            >
                                Ver Detalhes <ChevronDown size={16} className="-rotate-90" />
                            </button>
                        </div>

                        {/* Dropdown Menu (Reused) */}
                        {patient.id && openDropdownId === patient.id && (
                            <>
                                {/* Transparent Backdrop for clicking outside */}
                                <div
                                    className="fixed inset-0 z-[9998]"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenDropdownId(null);
                                    }}
                                />

                                <div
                                    ref={dropdownRef}
                                    style={{
                                        position: 'fixed',
                                        top: `${dropdownPosition.top}px`,
                                        right: `${dropdownPosition.right}px`,
                                        zIndex: 9999
                                    }}
                                    className="w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 animate-in fade-in slide-in-from-top-2 duration-200 text-left"
                                >
                                    <button
                                        className="w-full flex items-center gap-3 px-5 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors group"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // Passa uuid_colab (UUID) em vez de id (numérico) para evitar erro de tipo no Supabase
                                            onGenerateForm(patient.uuid_colab);
                                            setOpenDropdownId(null);
                                        }}
                                    >
                                        <LinkIcon size={18} className="text-slate-400 group-hover:text-[#139690] transition-colors" />
                                        <span className="font-medium">Gerar Link</span>
                                    </button>

                                    <button
                                        className="w-full flex items-center gap-3 px-5 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors group"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onGenerateReport(patient);
                                            setOpenDropdownId(null);
                                        }}
                                    >
                                        <FileText size={18} className="text-slate-400 group-hover:text-[#139690] transition-colors" />
                                        <span className="font-medium">Gerar Laudo</span>
                                    </button>

                                    <button
                                        className="w-full flex items-center gap-3 px-5 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors group"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onGenerateReport(patient, true);
                                            setOpenDropdownId(null);
                                        }}
                                    >
                                        <CheckCircle size={18} className="text-slate-400 group-hover:text-[#139690] transition-colors" />
                                        <span className="font-medium">Assinar Laudo</span>
                                    </button>

                                    {patient.assessmentId ? (
                                        <button
                                            className="w-full flex items-center gap-3 px-5 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors group"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onViewAnswers(patient);
                                                setOpenDropdownId(null);
                                            }}
                                        >
                                            <MessageSquare size={18} className="text-slate-400 group-hover:text-[#139690] transition-colors" />
                                            <span className="font-medium">Respostas</span>
                                        </button>
                                    ) : (
                                        <div className="px-5 py-3 text-xs text-slate-400 italic flex items-center gap-3 select-none">
                                            <Unlock size={18} className="opacity-50" />
                                            <span>Não avaliado</span>
                                        </div>
                                    )}

                                    <div className="h-px bg-slate-100 my-1 mx-4"></div>

                                    <button
                                        className="w-full flex items-center gap-3 px-5 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors group"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(patient.id, patient.uuid_colab);
                                            setOpenDropdownId(null);
                                        }}
                                    >
                                        <Trash2 size={18} className="text-red-400 group-hover:text-red-600 transition-colors" />
                                        <span className="font-medium">Excluir</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}

                {/* Mobile Pagination Controls */}
                <div className="flex items-center justify-between mt-6 px-2 pb-8">
                    <div className="text-xs text-slate-400 font-medium">
                        {startIndex + 1}-{endIndex} de {totalItems}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold shadow-sm disabled:opacity-50"
                        >
                            Anterior
                        </button>
                        <button
                            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold shadow-sm disabled:opacity-50"
                        >
                            Próximo
                        </button>
                    </div>
                </div>
            </div>

            {/* Patient Details Modal (Mobile/Tablet) */}
            {selectedPatientDetails && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setSelectedPatientDetails(null)}
                    />

                    {/* Modal Content - Centered */}
                    <div className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-y-auto">
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-20 h-20 rounded-full bg-cyan-50 flex-shrink-0 flex items-center justify-center text-[#139690] font-bold text-3xl mb-3">
                                {selectedPatientDetails.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 text-center">{selectedPatientDetails.name}</h2>
                            <p className="text-slate-400 font-medium">CPF: {selectedPatientDetails.cpf}</p>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Nascimento</label>
                                    <p className="text-slate-800 font-medium">{renderCellContent(selectedPatientDetails.nascimento)}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Sexo</label>
                                    <p className="text-slate-800 font-medium">{renderCellContent(selectedPatientDetails.sexo)}</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Empresa</label>
                                <p className="text-slate-800 font-medium">{renderCellContent(selectedPatientDetails.company)}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Cargo</label>
                                    <p className="text-slate-800 font-medium">{renderCellContent(selectedPatientDetails.role, true)}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Setor</label>
                                    <p className="text-slate-800 font-medium">{renderCellContent(selectedPatientDetails.sector, true)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Data</label>
                                    <p className="text-slate-800 font-medium flex items-center gap-1">
                                        <Calendar size={14} className="text-slate-400" />
                                        {selectedPatientDetails.date}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Status</label>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border inline-block ${selectedPatientDetails.locked ? 'bg-red-50 text-red-700 border-red-100' :
                                        selectedPatientDetails.status === 'completed' || selectedPatientDetails.status === 'Concluído' || selectedPatientDetails.status === 'reported' || selectedPatientDetails.status === 'Laudado' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                            selectedPatientDetails.status === 'in_progress' || selectedPatientDetails.status === 'Em Análise' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                selectedPatientDetails.status === 'sent' || selectedPatientDetails.status === 'Enviado' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                    'bg-yellow-50 text-yellow-700 border-yellow-100'
                                        }`}>
                                        {selectedPatientDetails.locked ? 'Bloqueado' :
                                            selectedPatientDetails.status === 'pending' ? 'Pendente' :
                                                selectedPatientDetails.status === 'sent' ? 'Enviado' :
                                                    selectedPatientDetails.status === 'in_progress' ? 'Em Progresso' :
                                                        selectedPatientDetails.status === 'completed' ? 'Concluído' :
                                                            selectedPatientDetails.status === 'reported' ? 'Laudado' : selectedPatientDetails.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setSelectedPatientDetails(null)}
                                className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                            >
                                Fechar
                            </button>
                            <button
                                onClick={() => {
                                    onEdit(selectedPatientDetails);
                                    setSelectedPatientDetails(null);
                                }}
                                className="flex-1 py-3 bg-[#139690] text-white rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                            >
                                <Pencil size={18} />
                                Editar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop Table View (Hidden on Mobile/Tablet) */}
            <div className="hidden xl:flex border border-gray-200 rounded-xl bg-white shadow-sm flex-col relative z-0 overflow-visible">
                <div className="w-full flex-1 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-brand-surface border-b border-gray-200 text-slate-500 text-[11px] font-bold uppercase tracking-widest">
                                <th
                                    className="p-4 cursor-pointer hover:bg-gray-100/50 transition-colors select-none group first:rounded-tl-xl min-w-[220px]"
                                    onClick={() => requestSort('name')}
                                >
                                    <span className="flex items-center">Paciente {getSortIcon('name')}</span>
                                </th>
                                <th
                                    className="p-4 cursor-pointer hover:bg-gray-100/50 transition-colors select-none group min-w-[140px]"
                                    onClick={() => requestSort('cpf')}
                                >
                                    <span className="flex items-center">CPF {getSortIcon('cpf')}</span>
                                </th>
                                <th
                                    className="p-4 cursor-pointer hover:bg-gray-100/50 transition-colors select-none group w-[120px]"
                                    onClick={() => requestSort('nascimento')}
                                >
                                    <span className="flex items-center">Nascimento {getSortIcon('nascimento')}</span>
                                </th>
                                <th
                                    className="p-4 cursor-pointer hover:bg-gray-100/50 transition-colors select-none group w-[80px]"
                                    onClick={() => requestSort('sexo')}
                                >
                                    <span className="flex items-center">Sexo {getSortIcon('sexo')}</span>
                                </th>
                                <th
                                    className="p-4 cursor-pointer hover:bg-gray-100/50 transition-colors select-none group min-w-[200px]"
                                    onClick={() => requestSort('company')}
                                >
                                    <span className="flex items-center">Empresa {getSortIcon('company')}</span>
                                </th>
                                <th
                                    className="p-4 cursor-pointer hover:bg-gray-100/50 transition-colors select-none group min-w-[150px]"
                                    onClick={() => requestSort('role')}
                                >
                                    <span className="flex items-center">Cargo {getSortIcon('role')}</span>
                                </th>
                                <th
                                    className="p-4 cursor-pointer hover:bg-gray-100/50 transition-colors select-none group min-w-[150px]"
                                    onClick={() => requestSort('sector')}
                                >
                                    <span className="flex items-center">Setor {getSortIcon('sector')}</span>
                                </th>
                                <th
                                    className="p-4 cursor-pointer hover:bg-gray-100/50 transition-colors select-none group min-w-[140px]"
                                    onClick={() => requestSort('date')}
                                >
                                    <span className="flex items-center">Data {getSortIcon('date')}</span>
                                </th>
                                <th
                                    className="p-4 cursor-pointer hover:bg-gray-100/50 transition-colors select-none group min-w-[140px]"
                                    onClick={() => requestSort('status')}
                                >
                                    <span className="flex items-center">Status {getSortIcon('status')}</span>
                                </th>
                                <th className="p-4 text-center last:rounded-tr-xl w-[100px]">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-0">
                            {patients.map((patient, index) => (
                                <tr
                                    key={patient.id}
                                    className={`border-b border-gray-100 last:border-0 hover:bg-brand-surface/80 transition-colors duration-200 group ${patient.id && openDropdownId === patient.id ? 'relative z-50' : ''}`}
                                >
                                    <td className={`p-3 md:p-4 font-semibold text-slate-900 ${index === patients.length - 1 ? 'rounded-bl-xl' : ''}`}>{patient.name}</td>
                                    <td className="p-3 md:p-4">{renderCellContent(patient.cpf)}</td>
                                    <td className="p-3 md:p-4">{renderCellContent(patient.nascimento)}</td>
                                    <td className="p-3 md:p-4">{renderCellContent(patient.sexo)}</td>
                                    <td className="p-3 md:p-4">{renderCellContent(patient.company)}</td>
                                    <td className="p-3 md:p-4">{renderCellContent(patient.role, true)}</td>
                                    <td className="p-3 md:p-4">{renderCellContent(patient.sector, true)}</td>
                                    <td className="p-3 md:p-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                                            <Calendar size={14} className="opacity-70" />
                                            <span className="text-gray-500">{patient.date}</span>
                                        </div>
                                    </td>
                                    <td className="p-3 md:p-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap inline-block ${
                                            patient.status === 'completed' || patient.status === 'Concluído' || patient.status === 'reported' || patient.status === 'Laudado' ? 'bg-green-50 text-green-700 border-green-200' :
                                                patient.locked ? 'bg-red-50 text-red-700 border-red-200' :
                                                    patient.status === 'in_progress' || patient.status === 'Em Análise' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                        patient.status === 'sent' || patient.status === 'Enviado' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                            'bg-yellow-50 text-yellow-700 border-yellow-200' // Default / Pending
                                            }`}>
                                            {patient.status === 'reported' || patient.status === 'Laudado' ? 'Laudado' :
                                                patient.status === 'completed' || patient.status === 'Concluído' ? 'Respondido' :
                                                    patient.locked ? 'Bloqueado' :
                                                        patient.status === 'pending' ? 'Pendente' :
                                                            patient.status === 'sent' ? 'Enviado' :
                                                                patient.status === 'in_progress' ? 'Em Progresso' : patient.status}
                                        </span>
                                    </td>
                                    <td className={`p-3 md:p-4 text-center relative w-[100px] ${index === patients.length - 1 ? 'rounded-br-xl' : ''}`}>
                                        <div className="flex items-center justify-center">
                                            <button
                                                className={`p-2 rounded-md border transition-all duration-200 ${openDropdownId === patient.id
                                                    ? 'bg-gray-100 border-gray-300 text-slate-900 shadow-sm'
                                                    : 'bg-transparent border-gray-200 text-slate-600 hover:bg-gray-100 hover:border-gray-300 hover:text-slate-900'
                                                    }`}
                                                title="Configurações"
                                                onClick={(e) => {
                                                    // Evita disparar eventos em elementos de tabela pai
                                                    e.stopPropagation();
                                                    // Obtém o retângulo de posicionamento do botão de ações
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    // Altura máxima estimada para o dropdown desktop (com todos os botões)
                                                    const dropdownHeight = 280;
                                                    // Verifica o espaço restante no viewport abaixo do botão
                                                    const spaceBelow = window.innerHeight - rect.bottom;
                                                    
                                                    // Decisão de direção: Abre para cima se não couber embaixo
                                                    const openUpward = spaceBelow < dropdownHeight;

                                                    // Atualiza o estado de posição com base na decisão de direção
                                                    setDropdownPosition({
                                                        top: openUpward ? rect.top - dropdownHeight - 5 : rect.bottom + 5,
                                                        right: window.innerWidth - rect.right
                                                    });
                                                    // Abre ou fecha o menu deste registro
                                                    setOpenDropdownId(openDropdownId === patient.id ? null : patient.id);
                                                }}
                                            >
                                                <MoreHorizontal size={18} />
                                            </button>

                                            {/* Dropdown Menu */}
                                            {patient.id && openDropdownId === patient.id && (
                                                <div
                                                    ref={dropdownRef}
                                                    style={{
                                                        position: 'fixed',
                                                        top: `${dropdownPosition.top}px`,
                                                        right: `${dropdownPosition.right}px`,
                                                        zIndex: 9999
                                                    }}
                                                    className="w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200 text-left"
                                                >
                                                    <button
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors group"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            // Passa uuid_colab (UUID) em vez de id (numérico) para evitar erro de tipo no Supabase
                                                            onGenerateForm(patient.uuid_colab);
                                                            setOpenDropdownId(null);
                                                        }}
                                                    >
                                                        <LinkIcon size={16} className="text-slate-600 group-hover:text-slate-900 transition-colors" />
                                                        <span className="font-medium align-middle">Gerar Link</span>
                                                    </button>

                                                    <button
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors group"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onGenerateReport(patient);
                                                            setOpenDropdownId(null);
                                                        }}
                                                    >
                                                        <FileText size={16} className="text-slate-600 group-hover:text-slate-900 transition-colors" />
                                                        <span className="font-medium align-middle">Gerar Laudo</span>
                                                    </button>

                                                    <button
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors group"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onGenerateReport(patient, true); // true for signed
                                                            setOpenDropdownId(null);
                                                        }}
                                                    >
                                                        <CheckCircle size={16} className="text-slate-600 group-hover:text-slate-900 transition-colors" />
                                                        <span className="font-medium align-middle">Assinar Laudo</span>
                                                    </button>

                                                    <button
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors group"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onEdit(patient);
                                                            setOpenDropdownId(null);
                                                        }}
                                                    >
                                                        <Pencil size={16} className="text-slate-600 group-hover:text-slate-900 transition-colors" />
                                                        <span className="font-medium align-middle">Editar</span>
                                                    </button>

                                                    {patient.assessmentId ? (
                                                        <button
                                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors group"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onViewAnswers(patient);
                                                                setOpenDropdownId(null);
                                                            }}
                                                        >
                                                            <MessageSquare size={16} className="text-slate-600 group-hover:text-slate-900 transition-colors" />
                                                            <span className="font-medium align-middle">Respostas</span>
                                                        </button>
                                                    ) : (
                                                        <div className="px-4 py-2.5 text-xs text-slate-400 italic flex items-center gap-3 select-none">
                                                            <MessageSquare size={16} className="opacity-50" />
                                                            <span className="align-middle">Não avaliado</span>
                                                        </div>
                                                    )}

                                                    <div className="h-px bg-slate-100 my-1 mx-2"></div>

                                                    <button
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors group"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDelete(patient.id, patient.uuid_colab);
                                                            setOpenDropdownId(null);
                                                        }}
                                                    >
                                                        <Trash2 size={16} className="text-red-500 group-hover:text-red-700 transition-colors" />
                                                        <span className="font-medium align-middle">Excluir</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="bg-white px-6 py-4 border-t border-gray-100 flex items-center justify-between rounded-b-xl relative z-10">
                    <div className="text-gray-400 text-sm">
                        Mostrando <span className="font-medium text-gray-600">{totalItems === 0 ? 0 : startIndex + 1}-{endIndex}</span> de <span className="font-medium text-gray-600">{totalItems}</span> pacientes
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 text-sm font-medium text-gray-600 bg-transparent rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-gray-100"
                        >
                            Anterior
                        </button>
                        <button
                            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="px-4 py-2 text-sm font-medium text-gray-600 bg-transparent rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-gray-100"
                        >
                            Próximo
                        </button>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default DashboardTable;
