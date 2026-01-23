import React, { useState, useEffect, useRef } from 'react';
import { FileText, Calendar, Pencil, Unlock, Lock, ArrowUpDown, Trash2, Link as LinkIcon, MoreHorizontal, ChevronDown, CheckCircle } from 'lucide-react';

const DashboardTable = ({ patients, onEdit, onSort, onDelete, onGenerateForm, onToggleLock }) => {
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const dropdownRef = useRef(null);

    // Fechar dropdown ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpenDropdownId(null);
            }
        };

        if (openDropdownId) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openDropdownId]);

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
            return <span className="text-gray-400 font-light">—</span>;
        }

        const displayValue = shouldTitleCase ? toTitleCase(value) : value;
        return <span className="text-slate-600">{displayValue}</span>;
    };

    return (
        <div className="w-full h-full flex flex-col">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100 text-slate-500 text-sm uppercase tracking-wider">
                            <th
                                className="p-4 font-semibold cursor-pointer hover:bg-slate-50 transition-colors select-none group"
                                onClick={() => requestSort('name')}
                            >
                                Paciente {getSortIcon('name')}
                            </th>
                            <th
                                className="p-4 font-semibold cursor-pointer hover:bg-slate-50 transition-colors select-none group"
                                onClick={() => requestSort('company')}
                            >
                                Empresa {getSortIcon('company')}
                            </th>
                            <th
                                className="p-4 font-semibold cursor-pointer hover:bg-slate-50 transition-colors select-none group"
                                onClick={() => requestSort('role')}
                            >
                                Cargo {getSortIcon('role')}
                            </th>
                            <th
                                className="p-4 font-semibold cursor-pointer hover:bg-slate-50 transition-colors select-none group"
                                onClick={() => requestSort('sector')}
                            >
                                Setor {getSortIcon('sector')}
                            </th>
                            <th
                                className="p-4 font-semibold cursor-pointer hover:bg-slate-50 transition-colors select-none group"
                                onClick={() => requestSort('date')}
                            >
                                Data {getSortIcon('date')}
                            </th>
                            <th
                                className="p-4 font-semibold cursor-pointer hover:bg-slate-50 transition-colors select-none group"
                                onClick={() => requestSort('status')}
                            >
                                Status {getSortIcon('status')}
                            </th>
                            <th className="p-4 font-semibold text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-700">
                        {patients.map((patient) => (
                            <tr key={patient.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="p-4 font-bold text-slate-900">{patient.name}</td>
                                <td className="p-4">{renderCellContent(patient.company)}</td>
                                <td className="p-4">{renderCellContent(patient.role, true)}</td>
                                <td className="p-4">{renderCellContent(patient.sector, true)}</td>
                                <td className="p-4 flex items-center gap-2 text-slate-500 whitespace-nowrap">
                                    <Calendar size={16} />
                                    {patient.date}
                                </td>
                                <td className="p-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${patient.status === 'completed' || patient.status === 'Concluído' ? 'bg-green-100 text-green-700' :
                                        patient.status === 'in_progress' || patient.status === 'Em Análise' ? 'bg-blue-100 text-blue-700' :
                                            'bg-yellow-100 text-yellow-700' // Default / Pending
                                        }`}>
                                        {patient.status === 'pending' ? 'Pendente' :
                                            patient.status === 'in_progress' ? 'Em Progresso' :
                                                patient.status === 'completed' ? 'Concluído' : patient.status}
                                    </span>
                                </td>
                                <td className="p-4 text-center relative">
                                    <div className="flex items-center justify-center">
                                        <button
                                            className={`p-2 rounded-md border transition-all duration-200 ${openDropdownId === patient.id
                                                ? 'bg-gray-100 border-gray-300 text-slate-900 shadow-sm'
                                                : 'bg-transparent border-gray-200 text-slate-600 hover:bg-gray-100 hover:border-gray-300 hover:text-slate-900'
                                                }`}
                                            title="Configurações"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenDropdownId(openDropdownId === patient.id ? null : patient.id);
                                            }}
                                        >
                                            <MoreHorizontal size={18} />
                                        </button>

                                        {/* Dropdown Menu */}
                                        {openDropdownId === patient.id && (
                                            <div
                                                ref={dropdownRef}
                                                className="absolute right-4 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                                            >
                                                <button
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors group"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onGenerateForm(patient.id);
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
                                                            onToggleLock(patient.id, patient.assessmentId, patient.locked);
                                                            setOpenDropdownId(null);
                                                        }}
                                                    >
                                                        {patient.locked ?
                                                            <Unlock size={16} className="text-slate-600 group-hover:text-slate-900 transition-colors" /> :
                                                            <Lock size={16} className="text-slate-600 group-hover:text-slate-900 transition-colors" />
                                                        }
                                                        <span className="font-medium align-middle">{patient.locked ? 'Destravar' : 'Travar'}</span>
                                                    </button>
                                                ) : (
                                                    <div className="px-4 py-2.5 text-xs text-slate-400 italic flex items-center gap-3 select-none">
                                                        <Unlock size={16} className="opacity-50" />
                                                        <span className="align-middle">Não avaliado</span>
                                                    </div>
                                                )}

                                                <div className="h-px bg-slate-100 my-1 mx-2"></div>

                                                <button
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors group"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (window.confirm('Tem certeza que deseja excluir este paciente?')) {
                                                            onDelete(patient.id);
                                                        }
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
        </div>
    );
};

export default DashboardTable;
