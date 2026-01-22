import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Stethoscope, Settings } from 'lucide-react';

const AdminLayout = () => {
    const location = useLocation();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Pacientes', path: '/admin/dashboard' },
        { icon: Stethoscope, label: 'Médicos', path: '/admin/doctors' },
        { icon: Settings, label: 'Ajustes', path: '/admin/quiz-settings' },
    ];

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Sessão 1: Sidebar Lateral */}
            <aside className="w-28 h-screen bg-[#99dbe7] border-r border-[#88c5d1] flex flex-col fixed left-0 top-0 z-10">
                {/* Logo */}
                <div className="h-16 flex items-center justify-center border-b border-[#88c5d1]/50">
                    <h1 className="text-sm font-bold text-[#050a30] text-center leading-tight">Psi<br />Admin</h1>
                </div>

                {/* Menu de Navegação */}
                <nav className="flex-1 p-4 overflow-y-auto">
                    <ul className="space-y-4"> {/* Increased space between items for vertical layout */}
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;

                            return (
                                <li key={item.path}>
                                    <Link
                                        to={item.path}
                                        className={`flex flex-col items-center justify-center gap-1 px-1 py-3 rounded-lg transition-colors duration-200 text-center ${isActive
                                            ? 'bg-white/40 font-semibold shadow-sm'
                                            : 'hover:bg-white/20'
                                            } text-[#050a30]`}
                                    >
                                        <Icon size={28} />
                                        <span className="text-[10px] uppercase tracking-wide font-medium">{item.label}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </aside>

            {/* Sessão 2: Área de Conteúdo */}
            <main className="flex-1 ml-28 min-h-screen bg-slate-50 overflow-y-auto w-full">
                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
