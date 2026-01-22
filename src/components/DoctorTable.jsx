import React, { useState } from 'react';
import { Upload, Pencil, Trash2, ArrowUpDown } from 'lucide-react';

const DoctorTable = ({ doctors, onSelectDoctor, onSort }) => {
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
                                className="p-4 font-semibold cursor-pointer hover:bg-slate-50 transition-colors select-none whitespace-nowrap"
                                onClick={() => requestSort('name')}
                            >
                                Nome {getSortIcon('name')}
                            </th>
                            <th
                                className="p-4 font-semibold cursor-pointer hover:bg-slate-50 transition-colors select-none whitespace-nowrap"
                                onClick={() => requestSort('crp')}
                            >
                                CRP {getSortIcon('crp')}
                            </th>

                            <th className="p-4 font-semibold text-center transition-all duration-500 overflow-hidden whitespace-nowrap">
                                Ações
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-700">
                        {doctors.map((doctor) => (
                            <tr
                                key={doctor.id}
                                className="hover:bg-slate-50 transition-colors group cursor-pointer"
                                onClick={() => onSelectDoctor(doctor)}
                            >
                                <td className="p-4 font-medium text-slate-900 whitespace-nowrap">{doctor.name}</td>
                                <td className="p-4 text-slate-600 whitespace-nowrap">{doctor.crp}</td>


                                <td className="p-4 text-center transition-all duration-500 overflow-hidden whitespace-nowrap">
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors"
                                            title="Editar"
                                            onClick={(e) => { e.stopPropagation(); onSelectDoctor(doctor); }}
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button
                                            className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors"
                                            title="Remover"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Trash2 size={18} />
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

export default DoctorTable;
