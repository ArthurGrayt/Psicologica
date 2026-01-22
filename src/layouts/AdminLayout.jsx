import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Stethoscope, ClipboardList, Menu, Activity, LogOut } from 'lucide-react';

const AdminLayout = () => {
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const menuItems = [
        { icon: LayoutDashboard, label: 'Pacientes', path: '/admin/dashboard' },
        { icon: Stethoscope, label: 'Médicos', path: '/admin/doctors' },
        { icon: ClipboardList, label: 'Formulários', path: '/admin/quiz-settings' },
    ];

    return (
        <div className="flex min-h-screen bg-[#f8fafc]"> {/* Fundo geral mais claro */}

            {/* Sidebar */}
            <aside className={`
                fixed md:static inset-y-0 left-0 z-40
                w-64 transform transition-transform duration-300 ease-in-out
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                bg-[#373b59] text-white shadow-xl flex flex-col h-screen rounded-r-[32px] md:rounded-3xl md:m-4
            `}>
                {/* Logo Area */}
                <div className="p-8 pb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-sm">
                            <Activity size={26} className="text-white" />
                        </div>
                        <div>
                            <span className="text-xl font-bold tracking-tight block leading-none">Psico</span>
                            <span className="text-xs text-blue-200 font-medium tracking-widest uppercase">Manager</span>
                        </div>
                    </div>

                    {/* Botão Fechar Mobile */}
                    <button
                        className="md:hidden p-2 text-white/70 hover:text-white transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <Menu size={24} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <div key={item.path}>
                                <Link
                                    to={item.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`
                                        group flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200
                                        ${isActive
                                            ? 'bg-white text-[#373b59] shadow-lg shadow-black/5 font-bold'
                                            : 'text-blue-100 hover:bg-white/10 hover:text-white font-medium'
                                        }
                                    `}
                                >
                                    <div className={`
                                        p-2 rounded-xl transition-colors
                                        ${isActive ? 'bg-[#373b59]/10' : 'bg-transparent group-hover:bg-white/10'}
                                    `}>
                                        <item.icon size={20} className={isActive ? 'text-[#373b59]' : 'text-current'} />
                                    </div>
                                    <span className="text-sm tracking-wide">{item.label}</span>

                                    {isActive && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#373b59]" />
                                    )}
                                </Link>
                            </div>
                        );
                    })}
                </nav>

                {/* User Profile / Footer */}
                <div className="p-4 mt-auto">
                    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-inner">
                                AR
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white truncate">Dr. Arthur</p>
                                <p className="text-xs text-blue-200 truncate">Administrador</p>
                            </div>
                        </div>
                        <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-all border border-white/5">
                            <LogOut size={14} />
                            <span>Sair do Sistema</span>
                        </button>
                    </div>
                    <p className="text-center text-[10px] text-blue-300 mt-4 opacity-60">
                        v1.0.0 • 2026
                    </p>
                </div>
            </aside>

            {/* Botão Menu Mobile (Fixo na tela) */}
            {!isMobileMenuOpen && (
                <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="md:hidden fixed top-4 left-4 z-50 p-3 bg-white text-[#373b59] rounded-xl shadow-lg border border-slate-100"
                >
                    <Menu size={24} />
                </button>
            )}

            {/* Conteúdo Principal */}
            <main className="flex-1 min-w-0 overflow-y-auto h-screen">
                <div className="p-4 md:p-8 pb-32 md:pb-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
