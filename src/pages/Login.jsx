import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import logoGamaUrl from '../assets/logo-gama.png';

const Login = () => {
    // Hooks de estado do login
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Redireciona para o dashboard se já estiver logado
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                navigate('/admin/dashboard');
            }
        };
        checkSession();
    }, [navigate]);

    // Função que lida com o submit do formulário
    const handleLogin = async (e) => {
        // Previne o reload da página nativo do form
        e.preventDefault();
        
        // Ativa o estado de carregamento
        setLoading(true);
        setError(null);

        try {
            // Chama a função de autenticação do Supabase
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            // Se der erro, joga para o catch
            if (error) throw error;

            // Se o login for bem-sucedido, redireciona
            if (data.user) {
                navigate('/admin/dashboard');
            }
        } catch (err) {
            // Trata erros informando o usuário
            console.error('Erro de Autenticação:', err.message);
            setError('E-mail ou senha incorretos. Verifique suas credenciais.');
        } finally {
            // Desativa o spinner de loading
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                {/* Logo Centralizada */}
                <div className="flex justify-center mb-6">
                    <img src={logoGamaUrl} alt="Gama Psic" className="h-16 w-auto" />
                </div>
                <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-slate-900">
                    Acesse sua conta
                </h2>
                <p className="mt-2 text-center text-sm text-slate-500">
                    Área restrita para administradores e médicos
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-slate-100">
                    {/* Formulário de Login */}
                    <form className="space-y-6" onSubmit={handleLogin}>
                        {/* Exibe painel de erro caso exista */}
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 flex items-center gap-2">
                                <Lock size={16} />
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Endereço de e-mail
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 px-3 py-3 border border-slate-200 rounded-xl focus:ring-[#139690] focus:border-[#139690] sm:text-sm bg-slate-50 focus:bg-white transition-all outline-none"
                                    placeholder="seu@email.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Senha
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 px-3 py-3 border border-slate-200 rounded-xl focus:ring-[#139690] focus:border-[#139690] sm:text-sm bg-slate-50 focus:bg-white transition-all outline-none"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {/* Botão de Envio */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#139690] hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#139690] disabled:opacity-50 transition-all active:scale-95"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin h-5 w-5" />
                            ) : (
                                <>
                                    Entrar no Sistema
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
            
            <p className="text-center text-xs text-slate-400 mt-8 uppercase tracking-widest">
                Sistema Gama Psicologia • 2026
            </p>
        </div>
    );
};

// Exportamos o componente para ser usado no Router
export default Login;
