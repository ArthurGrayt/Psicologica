import React, { useState, useEffect, useRef } from 'react';
import { Upload, Pencil, Trash2, ArrowUpDown, MoreHorizontal } from 'lucide-react';

const DoctorTable = ({ doctors, onSelectDoctor, onSort }) => {
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpenDropdownId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
            <div className="border border-gray-200 rounded-xl bg-white shadow-sm relative z-0 overflow-visible">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-[11px] font-bold uppercase tracking-widest">
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
                            <th className="p-4 text-center last:rounded-tr-xl">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y-0">
                        {doctors.map((doctor, index) => (
                            <tr
                                key={doctor.id}
                                className={`border-b border-gray-100 last:border-0 hover:bg-gray-50/80 transition-colors duration-200 group cursor-pointer ${doctor.id && openDropdownId === doctor.id ? 'relative z-50' : ''}`}
                                onClick={() => onSelectDoctor(doctor)}
                            >
                                <td className={`p-4 font-semibold text-slate-900 ${index === doctors.length - 1 ? 'rounded-bl-xl' : ''}`}>{doctor.name}</td>
                                <td className="p-4">{renderCellContent(doctor.crp)}</td>

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
                                            <div
                                                ref={dropdownRef}
                                                className="absolute right-0 top-full mt-px w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-[100] animate-in fade-in slide-in-from-top-2 duration-200"
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
                                                        // onDelete(doctor.id);
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
