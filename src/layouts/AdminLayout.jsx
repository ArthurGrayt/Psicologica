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
        <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
            {/* Sidebar */}
            <aside className={`
                fixed md:relative inset-y-0 left-0 z-40
                w-72 transform transition-transform duration-300 ease-in-out
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                bg-[#373b59] text-white flex flex-col h-screen md:h-[calc(100vh-2rem)]
                md:m-4 md:rounded-3xl shadow-2xl shadow-black/10
            `}>
                {/* Logo Area */}
                <div className="px-8 py-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-sm">
                            <Activity size={24} className="text-white" />
                        </div>
                        <div>
                            <span className="text-xl font-bold tracking-tight block leading-none">Psico</span>
                            <span className="text-[10px] text-blue-200/60 font-medium tracking-[0.2em] uppercase">Manager</span>
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
                <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`
                                    group flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300
                                    ${isActive
                                        ? 'bg-white/15 text-white shadow-inner font-bold'
                                        : 'text-blue-100/70 hover:bg-white/5 hover:text-white font-medium'
                                    }
                                `}
                            >
                                <item.icon
                                    size={20}
                                    className={`transition-colors ${isActive ? 'text-white' : 'text-blue-100/50 group-hover:text-white'}`}
                                />
                                <span className="text-sm tracking-wide">{item.label}</span>

                                {isActive && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Profile / Footer - Clean Style */}
                <div className="px-4 py-8 mt-auto border-t border-white/5">
                    <div className="flex items-center gap-3 px-4 mb-6">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-lg ring-2 ring-white/10">
                            AR
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">Dr. Arthur</p>
                            <p className="text-[10px] text-blue-200/60 uppercase tracking-widest font-medium">Administrador</p>
                        </div>
                    </div>

                    <button className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 hover:bg-red-500/20 hover:text-red-200 text-xs font-semibold text-white/70 transition-all border border-white/5">
                        <LogOut size={14} />
                        <span>Sair do Sistema</span>
                    </button>

                    <p className="text-center text-[9px] text-blue-300/40 mt-6 tracking-widest uppercase">
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
                <div className="p-6 md:p-10 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
