import React, { useState, useEffect, useRef } from 'react';
import { Upload, Pencil, Trash2, ArrowUpDown, MoreHorizontal, ShieldCheck } from 'lucide-react';

const DoctorTable = ({ doctors, onSelectDoctor, onSort, onDelete }) => {
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const dropdownRef = useRef(null);

    // O fechamento dos menus agora é gerenciado por backdrops individuais para maior confiabilidade no mobile

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
        onSort(key, direction);
    };

    const toTitleCase = (text) => {
        if (!text) return '';
        return text.toLowerCase().split(' ').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    const renderCellContent = (value, shouldTitleCase = false) => {
        const placeholders = ['null', 'undefined', 'CARREGANDO...', 'Carregando...'];
        const isEmpty = !value || placeholders.includes(value.toString().trim());

        if (isEmpty) {
            return <span className="text-gray-300 font-light text-sm">—</span>;
        }

        const displayValue = shouldTitleCase ? toTitleCase(value) : value;
        return <span className="text-gray-500 text-sm font-normal">{displayValue}</span>;
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

    return (
        <div className="w-full h-full flex flex-col">
            {/* Mobile/Tablet Card View (Visible up to xl) */}
            <div className="xl:hidden space-y-6 pb-20 px-2">
                {doctors.map((doctor) => (
                    <div key={doctor.id} className="bg-white p-6 rounded-[24px] shadow-md border border-slate-100/50 relative transition-all active:scale-[0.98]">
                        {/* Card Header: Avatar + Info + Actions */}
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex gap-4">
                                <div className="w-14 h-14 rounded-full bg-cyan-50 flex items-center justify-center text-[#139690] font-bold text-xl shadow-sm border border-cyan-100/50">
                                    {doctor.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                                </div>
                                <div className="flex flex-col justify-center">
                                    <h3 className="font-bold text-slate-800 text-[16px] leading-tight mb-1">{doctor.name}</h3>
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">CRP:</span>
                                        <span className="text-[13px] font-medium">{doctor.crp || '—'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions Trigger */}
                            <div className="relative">
                                <button
                                    className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${openDropdownId === doctor.id ? 'bg-cyan-50 text-[#139690] shadow-inner' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenDropdownId(openDropdownId === doctor.id ? null : doctor.id);
                                    }}
                                >
                                    <MoreHorizontal size={22} />
                                </button>

                                {openDropdownId === doctor.id && (
                                    <>
                                        {/* Backdrop transparente para capturar o clique fora e fechar o menu de forma confiável no mobile */}
                                        <div 
                                            className="fixed inset-0 z-[90] bg-transparent" 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenDropdownId(null);
                                            }}
                                        />
                                        <div 
                                            className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-[100] animate-in fade-in zoom-in-95 duration-200"
                                        >
                                            <button
                                                className="w-full flex items-center gap-3 px-5 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors group"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSelectDoctor(doctor);
                                                    setOpenDropdownId(null);
                                                }}
                                            >
                                                <Pencil size={18} className="text-slate-400 group-hover:text-[#139690]" />
                                                <span className="font-semibold">Editar</span>
                                            </button>
                                            <div className="h-px bg-slate-100 my-1 mx-4"></div>
                                            <button
                                                className="w-full flex items-center gap-3 px-5 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors group"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDelete(doctor.id);
                                                    setOpenDropdownId(null);
                                                }}
                                            >
                                                <Trash2 size={18} className="text-red-300 group-hover:text-red-500" />
                                                <span className="font-semibold">Excluir</span>
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Card Footer: Status Autenticação */}
                        <div className="flex items-center justify-between bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Autenticação</span>
                            <div className="flex items-center">
                                {doctor.signatureUrl && doctor.pfxUrl ? (
                                    <span className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1.5 shadow-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Completa
                                    </span>
                                ) : doctor.pfxUrl ? (
                                    <span className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1.5 shadow-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        Digital (PFX)
                                    </span>
                                ) : doctor.signatureUrl ? (
                                    <span className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-100 flex items-center gap-1.5 shadow-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                                        Assinatura Visual
                                    </span>
                                ) : (
                                    <span className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-slate-100 text-slate-400 border border-slate-200 flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                        Pendente
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop Table View (Hidden on mobile) */}
            <div className="hidden xl:block border border-gray-200 rounded-xl bg-white shadow-sm relative z-0 overflow-visible">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-brand-surface border-b border-gray-200 text-slate-500 text-[11px] font-bold uppercase tracking-widest">
                            <th
                                className="p-4 cursor-pointer hover:bg-gray-100/50 transition-colors select-none group first:rounded-tl-xl"
                                onClick={() => requestSort('name')}
                            >
                                <span className="flex items-center">Nome {getSortIcon('name')}</span>
                            </th>
                            <th
                                className="p-4 cursor-pointer hover:bg-gray-100/50 transition-colors select-none group"
                                onClick={() => requestSort('crp')}
                            >
                                <span className="flex items-center">CRP {getSortIcon('crp')}</span>
                            </th>
                            <th className="p-4 text-center">Autenticação</th>
                            <th className="p-4 text-center last:rounded-tr-xl">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y-0">
                        {doctors.map((doctor, index) => (
                            <tr
                                key={doctor.id}
                                className={`border-b border-gray-100 last:border-0 hover:bg-brand-surface/80 transition-colors duration-200 group cursor-pointer ${doctor.id && openDropdownId === doctor.id ? 'relative z-50' : ''}`}
                                onClick={() => onSelectDoctor(doctor)}
                            >
                                <td className={`p-4 font-semibold text-slate-900 ${index === doctors.length - 1 ? 'rounded-bl-xl' : ''}`}>{doctor.name}</td>
                                <td className="p-4">{renderCellContent(doctor.crp)}</td>
                                <td className="p-4">
                                    <div className="flex items-center justify-center">
                                        {doctor.signatureUrl && doctor.pfxUrl ? (
                                            <div title="Autenticação Completa (Visual + Digital)" className="text-emerald-600 bg-emerald-50 p-1.5 rounded-md border border-emerald-100 shadow-sm transition-all hover:scale-105">
                                                <ShieldCheck size={16} />
                                            </div>
                                        ) : doctor.pfxUrl ? (
                                            <div title="Certificado Digital (A1/PFX)" className="text-green-600 bg-green-50 p-1.5 rounded-md border border-green-100 shadow-sm transition-all hover:scale-105">
                                                <ShieldCheck size={16} />
                                            </div>
                                        ) : doctor.signatureUrl ? (
                                            <div title="Assinatura Visual" className="text-blue-600 bg-blue-50 p-1.5 rounded-md border border-blue-100 shadow-sm transition-all hover:scale-105">
                                                <Pencil size={16} />
                                            </div>
                                        ) : (
                                            <span className="text-slate-200 font-light text-sm">—</span>
                                        )}
                                    </div>
                                </td>

                                <td className={`p-4 text-center relative ${index === doctors.length - 1 ? 'rounded-br-xl' : ''}`}>
                                    <div className="flex items-center justify-center relative">
                                        <button
                                            className={`p-2 rounded-md border transition-all duration-200 ${openDropdownId === doctor.id
                                                ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-inner'
                                                : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600 hover:shadow-sm'
                                                }`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenDropdownId(openDropdownId === doctor.id ? null : doctor.id);
                                            }}
                                        >
                                            <MoreHorizontal size={18} />
                                        </button>

                                        {/* Dropdown Menu */}
                                        {doctor.id && openDropdownId === doctor.id && (
                                            <>
                                                {/* Backdrop transparente para desktop também */}
                                                <div 
                                                    className="fixed inset-0 z-[90] bg-transparent cursor-default" 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenDropdownId(null);
                                                    }}
                                                />
                                                <div
                                                    className="absolute right-0 top-full mt-px w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-[100] animate-in fade-in duration-200"
                                                >
                                                <button
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors group"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onSelectDoctor(doctor);
                                                        setOpenDropdownId(null);
                                                    }}
                                                >
                                                    <Pencil size={16} className="text-slate-600 group-hover:text-slate-900 transition-colors" />
                                                    <span className="font-medium align-middle">Editar</span>
                                                </button>

                                                <div className="h-px bg-slate-100 my-1 mx-2"></div>

                                                <button
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors group"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDelete(doctor.id);
                                                        setOpenDropdownId(null);
                                                    }}
                                                >
                                                    <Trash2 size={16} className="text-red-500 group-hover:text-red-700 transition-colors" />
                                                    <span className="font-medium align-middle">Excluir</span>
                                                </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination Footer */}
                <div className="bg-white px-6 py-4 border-t border-gray-100 flex items-center justify-between rounded-b-xl">
                    <div className="text-gray-400 text-sm">
                        Mostrando <span className="font-medium text-gray-600">1-{doctors.length}</span> de <span className="font-medium text-gray-600">{doctors.length}</span> médicos
                    </div>
                    <div className="flex gap-2">
                        <button
                            disabled
                            className="px-4 py-2 text-sm font-medium text-gray-400 bg-transparent rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Anterior
                        </button>
                        <button
                            className="px-4 py-2 text-sm font-medium text-gray-600 bg-transparent rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Próximo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorTable;
