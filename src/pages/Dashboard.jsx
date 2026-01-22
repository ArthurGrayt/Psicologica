import React from 'react';
import { Search, Plus, Filter, Calendar } from 'lucide-react';
import DashboardTable from '../components/DashboardTable';

const Dashboard = () => {
    return (
        <div className="flex flex-col h-full gap-6">

            {/* 1. Card Superior (Filtros) */}
            <div className="bg-white p-6 rounded-[32px] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">

                {/* Barra de Busca */}
                <div className="relative w-full md:w-96">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar paciente..."
                        className="pl-10 pr-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
                    />
                </div>

                {/* Filtros e Ações */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 border border-slate-200 transition-colors font-medium text-sm">
                        <Calendar size={18} />
                        <span>Data</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 border border-slate-200 transition-colors font-medium text-sm">
                        <Filter size={18} />
                        <span>Empresa</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 border border-slate-200 transition-colors font-medium text-sm">
                        <Filter size={18} />
                        <span>Cargo</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 border border-slate-200 transition-colors font-medium text-sm">
                        <Filter size={18} />
                        <span>Setor</span>
                    </button>

                    <button className="ml-auto md:ml-2 flex items-center gap-2 px-5 py-2.5 bg-[#050a30] text-white rounded-xl hover:bg-[#050a30]/90 shadow-lg shadow-blue-900/20 transition-all font-medium text-sm">
                        <Plus size={18} />
                        <span>Nova Avaliação</span>
                    </button>
                </div>
            </div>

            {/* 2. Card Inferior (A Tabela) */}
            <div className="bg-white rounded-[32px] shadow-sm flex-1 overflow-hidden flex flex-col">
                {/* Conteúdo da Tabela */}
                <DashboardTable />
            </div>

        </div>
    );
};

export default Dashboard;
