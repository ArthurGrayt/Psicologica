import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Stethoscope, ClipboardList, Menu, Activity, LogOut } from 'lucide-react';

import logoGamaUrl from '../assets/logo-gama.png';

const AdminLayout = () => {
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const menuItems = [
        { icon: LayoutDashboard, label: 'Pacientes', path: '/admin/dashboard' },
        { icon: Stethoscope, label: 'Médicos', path: '/admin/doctors' },
        { icon: ClipboardList, label: 'Formulários', path: '/admin/quiz-settings' },
    ];

    return (
        <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
            {/* Sidebar */}
            <aside className={`
                fixed md:relative inset-y-0 left-0 z-40
                w-72 transform transition-transform duration-300 ease-in-out
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                bg-white border-r border-gray-200 text-slate-600 flex flex-col h-screen
            `}>
                {/* Logo Area */}
                <div className="px-8 py-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src={logoGamaUrl} alt="Logo Gama" className="h-10 w-auto" />
                        <div>
                            <span className="text-xl font-bold tracking-tight block leading-none text-[#04092E]">Gama Psic</span>
                        </div>
                    </div>

                    {/* Botão Fechar Mobile */}
                    <button
                        className="md:hidden p-2 text-slate-400 hover:text-brand-secondary transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <Menu size={24} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`
                                    group flex items-center gap-3 px-5 py-3.5 rounded-lg transition-all duration-200
                                    ${isActive
                                        ? 'bg-[#139690] text-white shadow-md rounded-lg'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-brand-secondary font-medium'
                                    }
                                `}
                            >
                                <item.icon
                                    size={20}
                                    className={`transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-primary'}`}
                                />
                                <span className="text-sm tracking-wide">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User Profile / Footer - Clean Style */}
                <div className="px-4 py-8 mt-auto border-t border-gray-100">
                    <div className="flex items-center gap-3 px-2 mb-6">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-brand-secondary font-bold text-sm">
                            AR
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">Dr. Arthur</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Administrador</p>
                        </div>
                    </div>

                    <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white border border-gray-200 hover:bg-red-50 hover:border-red-100 hover:text-red-600 text-xs font-semibold text-slate-500 transition-all">
                        <LogOut size={14} />
                        <span>Sair do Sistema</span>
                    </button>

                    <p className="text-center text-[9px] text-slate-300 mt-6 tracking-widest uppercase">
                        v1.0.0 • 2026
                    </p>
                </div>
            </aside>

            {/* Botão Menu Mobile (Fixo na tela) */}
            {!isMobileMenuOpen && (
                <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="md:hidden fixed top-6 left-6 z-50 p-3 bg-[#373b59] text-white rounded-xl shadow-2xl"
                >
                    <Menu size={24} />
                </button>
            )}

            {/* Conteúdo Principal */}
            <main className="flex-1 min-w-0 h-screen overflow-y-auto scroll-smooth">
                <div className="p-6 md:p-10 max-w-[1600px] mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
