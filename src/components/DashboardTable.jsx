import React, { useState } from 'react';
import { FileText, Calendar, Pencil, Unlock, Lock, ArrowUpDown, Trash2, Link as LinkIcon } from 'lucide-react';

const DashboardTable = ({ patients, onEdit, onSort, onDelete, onGenerateForm, onToggleLock }) => {
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
        onSort(key, direction);
    };

    const getSortIcon = (columnName) => {
        return <ArrowUpDown size={14} className={`ml-2 inline-block transition-opacity ${sortConfig.key === columnName ? 'opacity-100 text-blue-600' : 'opacity-30'}`} />;
    };

    return (
        <div className="w-full h-full flex flex-col">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100 text-slate-500 text-sm uppercase tracking-wider">
                            <th
                                className="p-4 font-semibold cursor-pointer hover:bg-slate-50 transition-colors select-none"
                                onClick={() => requestSort('name')}
                            >
                                Paciente {getSortIcon('name')}
                            </th>
                            <th
                                className="p-4 font-semibold cursor-pointer hover:bg-slate-50 transition-colors select-none"
                                onClick={() => requestSort('company')}
                            >
                                Empresa {getSortIcon('company')}
                            </th>
                            <th
                                className="p-4 font-semibold cursor-pointer hover:bg-slate-50 transition-colors select-none"
                                onClick={() => requestSort('role')}
                            >
                                Cargo {getSortIcon('role')}
                            </th>
                            <th
                                className="p-4 font-semibold cursor-pointer hover:bg-slate-50 transition-colors select-none"
                                onClick={() => requestSort('sector')}
                            >
                                Setor {getSortIcon('sector')}
                            </th>
                            <th
                                className="p-4 font-semibold cursor-pointer hover:bg-slate-50 transition-colors select-none"
                                onClick={() => requestSort('date')}
                            >
                                Data {getSortIcon('date')}
                            </th>
                            <th
                                className="p-4 font-semibold cursor-pointer hover:bg-slate-50 transition-colors select-none"
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
                                <td className="p-4 font-medium text-slate-900">{patient.name}</td>
                                <td className="p-4 text-slate-600">{patient.company}</td>
                                <td className="p-4 text-slate-600">{patient.role}</td>
                                <td className="p-4 text-slate-600">{patient.sector}</td>
                                <td className="p-4 flex items-center gap-2 text-slate-500">
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
                                <td className="p-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors"
                                            title="Editar"
                                            onClick={(e) => { e.stopPropagation(); onEdit(patient); }}
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button
                                            className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                                            title="Excluir"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (window.confirm('Tem certeza que deseja excluir este paciente?')) {
                                                    onDelete(patient.id);
                                                }
                                            }}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                        <button className="text-slate-400 hover:text-purple-600 hover:bg-purple-50 p-2 rounded-full transition-colors" title="Gerar Laudo">
                                            <FileText size={18} />
                                        </button>

                                        {/* LOCK / UNLOCK BUTTON */}
                                        {patient.assessmentId ? (
                                            <button
                                                className={`p-2 rounded-full transition-colors ${patient.locked
                                                    ? 'text-red-500 hover:bg-red-50 hover:text-red-600'
                                                    : 'text-green-500 hover:bg-green-50 hover:text-green-600'
                                                    }`}
                                                title={patient.locked ? "Destravar Formulário" : "Travar Formulário"}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onToggleLock(patient.id, patient.assessmentId, patient.locked);
                                                }}
                                            >
                                                {patient.locked ? <Lock size={18} /> : <Unlock size={18} />}
                                            </button>
                                        ) : (
                                            <button
                                                className="text-slate-300 cursor-not-allowed p-2 rounded-full"
                                                title="Nenhuma avaliação criada"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Unlock size={18} />
                                            </button>
                                        )}

                                        <button
                                            className="text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 p-2 rounded-full transition-colors"
                                            title="Gerar Link Formulário"
                                            onClick={(e) => { e.stopPropagation(); onGenerateForm(patient.id); }}
                                        >
                                            <LinkIcon size={18} />
                                        </button>
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
