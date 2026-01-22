import React, { useState } from 'react';
import { Upload, Pencil, Trash2, ArrowUpDown } from 'lucide-react';

const DoctorTable = () => {
    const [doctors, setDoctors] = useState([
        { id: 1, name: 'Dr. João Silva', crp: '12345/SP', hasSignature: false },
        { id: 2, name: 'Dra. Maria Oliveira', crp: '67890/RJ', hasSignature: true },
        { id: 3, name: 'Dr. Pedro Santos', crp: '54321/MG', hasSignature: false },
        { id: 4, name: 'Dra. Ana Costa', crp: '09876/RS', hasSignature: true },
        { id: 5, name: 'Dr. Lucas Pereira', crp: '11223/BA', hasSignature: false },
    ]);

    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });

        const sortedDoctors = [...doctors].sort((a, b) => {
            if (a[key] < b[key]) {
                return direction === 'ascending' ? -1 : 1;
            }
            if (a[key] > b[key]) {
                return direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
        setDoctors(sortedDoctors);
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
                                Nome do Médico {getSortIcon('name')}
                            </th>
                            <th
                                className="p-4 font-semibold cursor-pointer hover:bg-slate-50 transition-colors select-none"
                                onClick={() => requestSort('crp')}
                            >
                                CRP {getSortIcon('crp')}
                            </th>
                            <th className="p-4 font-semibold text-center">Assinatura</th>
                            <th className="p-4 font-semibold text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-700">
                        {doctors.map((doctor) => (
                            <tr key={doctor.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="p-4 font-medium text-slate-900">{doctor.name}</td>
                                <td className="p-4 text-slate-600">{doctor.crp}</td>
                                <td className="p-4 text-center">
                                    <button
                                        className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border transition-all mx-auto ${doctor.hasSignature
                                                ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'
                                            }`}
                                        title={doctor.hasSignature ? "Assinatura enviada" : "Fazer upload da assinatura"}
                                    >
                                        <Upload size={16} />
                                        <span className="text-xs font-medium">{doctor.hasSignature ? 'Atualizar' : 'Upload'}</span>
                                    </button>
                                </td>
                                <td className="p-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors" title="Editar">
                                            <Pencil size={18} />
                                        </button>
                                        <button className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors" title="Remover">
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
