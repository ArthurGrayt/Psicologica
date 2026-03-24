import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Stethoscope, ClipboardList, Menu, Activity, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';

import logoGamaUrl from '../assets/logo-gama.png';
import DevFloatingButton from '../components/DevFloatingButton';

const AdminLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);

    // Efeito para checar se o usuário de fato tem uma sessão no Supabase para ver o painel
    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            // Se não houver sessão de login, o app expulsa o usuário para a rota padrão
            if (!session) {
                navigate('/login');
            } else {
                // Se estiver logado, libera o carregamento visual da interface interna
                setIsLoadingAuth(false);
            }
        };
        checkAuth();
        
        // Listener contínuo caso o token vença
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT' || !session) {
                navigate('/login');
            }
        });

        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, [navigate]);

    // Função para tratar o logout do sistema
    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            navigate('/');
            // Opcionalmente recarrega a página para limpar estados em memória
            window.location.reload();
        } catch (error) {
            console.error('Erro ao sair do sistema:', error);
        }
    };

    const menuItems = [
        { icon: LayoutDashboard, label: 'Pacientes', path: '/admin/dashboard' },
        { icon: Stethoscope, label: 'Médicos', path: '/admin/doctors' },
        { icon: ClipboardList, label: 'Formulários', path: '/admin/quiz-settings' },
    ];

    // Tela de carregamento enquanto valida se o usuário pode acessar
    if (isLoadingAuth) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#f8fafc]">
                 <div className="w-12 h-12 border-4 border-[#139690] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
            {/* Sidebar (Hidden on Mobile/Tablet/iPad Pro) */}
            <aside className="hidden xl:flex flex-col w-72 bg-white border-r border-gray-200 text-slate-600 h-screen z-40 relative">
                {/* Logo Area */}
                <div className="px-8 py-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src={logoGamaUrl} alt="Logo Gama" className="h-10 w-auto" />
                        <div>
                            <span className="text-xl font-bold tracking-tight block leading-none text-[#04092E]">Gama Psic</span>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
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

                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white border border-gray-200 hover:bg-red-50 hover:border-red-100 hover:text-red-600 text-xs font-semibold text-slate-500 transition-all"
                    >
                        <LogOut size={14} />
                        <span>Sair do Sistema</span>
                    </button>

                    <p className="text-center text-[9px] text-slate-300 mt-6 tracking-widest uppercase">
                        v1.0.0 • 2026
                    </p>
                </div>
            </aside>

            {/* Mobile Header (Visible on Mobile/Tablet/iPad Pro) */}
            <header className="xl:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 flex items-center px-6 z-30">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#ccedf3] rounded-lg flex items-center justify-center">
                        <img src={logoGamaUrl} alt="Logo Gama" className="h-5 w-auto" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-[#04092E]">Gama Psic</span>
                </div>
            </header>

            {/* Conteúdo Principal */}
            <main className="flex-1 min-w-0 h-screen overflow-y-auto scroll-smooth pb-24 xl:pb-0 pt-16 xl:pt-0">
                <div className="p-6 md:p-10 max-w-[1600px] mx-auto">
                    <Outlet />
                </div>
            </main>

            {/* Mobile/Tablet Bottom Tab Bar */}
            <div className="xl:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center px-2 py-3 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] safe-area-bottom">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 w-full ${isActive ? 'text-[#139690]' : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <div className="p-1.5 rounded-full bg-transparent transition-all">
                                <item.icon size={22} className={isActive ? 'stroke-[2.5px]' : 'stroke-2'} />
                            </div>
                            <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
            
            <DevFloatingButton />
        </div>
    );
};

export default AdminLayout;
