import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Plus, Filter, X, Upload, Save, User, Phone, FileBadge, ChevronLeft } from 'lucide-react';
import DoctorTable from '../components/DoctorTable';

const Doctors = () => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [isCreating, setIsCreating] = useState(false); // State for creation mode

    // Fetch Doctors from DB
    const fetchDoctors = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('responsaveis')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Map DB fields to Frontend fields
            const mapped = (data || []).map(d => ({
                id: d.id,
                name: d.name,
                crp: d.crp || '',
                // If phone column doesn't exist in schema provided, we might need to skip or handle it.
                // User provided schema: id, name, crp, signature_url. No phone.
                // I'll keep phone in local state for UI consistency but it won't persist if not in DB.
                // Or I can add it to schema? User didn't ask to create column. 
                // I will safely ignore phone persistence or treat as transient for now, 
                // unless I see it can be added. I'll omit phone from DB operations to be safe with schema.
                phone: '',
                hasSignature: !!d.signature_url,
                signatureUrl: d.signature_url
            }));

            setDoctors(mapped);
        } catch (err) {
            console.error('Error fetching doctors:', err);
            alert('Erro ao carregar médicos.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDoctors();
    }, []);

    // Handlers
    const handleSort = (key, direction) => {
        const sorted = [...doctors].sort((a, b) => {
            if (a[key] < b[key]) return direction === 'ascending' ? -1 : 1;
            if (a[key] > b[key]) return direction === 'ascending' ? 1 : -1;
            return 0;
        });
        setDoctors(sorted);
    };

    const handleClosePanel = () => {
        setSelectedDoctor(null);
        setIsCreating(false);
    };

    const handleStartCreate = () => {
        setSelectedDoctor({
            name: '',
            crp: '',
            phone: '',
            hasSignature: false,
            signatureUrl: null
        });
        setIsCreating(true);
    };

    const handleSaveDoctor = async () => {
        if (!selectedDoctor.name || !selectedDoctor.crp) {
            alert('Nome e CRP são obrigatórios.');
            return;
        }

        try {
            const payload = {
                name: selectedDoctor.name,
                crp: selectedDoctor.crp,
                signature_url: selectedDoctor.signatureUrl
            };

            let error;

            if (isCreating) {
                // CREATE
                const { error: insertError } = await supabase
                    .from('responsaveis')
                    .insert(payload);
                error = insertError;
            } else {
                // UPDATE
                const { error: updateError } = await supabase
                    .from('responsaveis')
                    .update(payload)
                    .eq('id', selectedDoctor.id);
                error = updateError;
            }

            if (error) throw error;

            alert(isCreating ? 'Médico criado com sucesso!' : 'Médico atualizado com sucesso!');
            handleClosePanel();
            fetchDoctors();

        } catch (err) {
            console.error('Error saving doctor:', err);
            alert('Erro ao salvar: ' + err.message);
        }
    };

    const handleDeleteDoctor = async (id) => {
        if (!window.confirm('Tem certeza que deseja remover este médico?')) return;

        try {
            const { error } = await supabase
                .from('responsaveis')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchDoctors();
        } catch (err) {
            console.error('Error deleting doctor:', err);
            alert('Erro ao excluir: ' + err.message);
        }
    };

    // Upload Signature Handler
    const handleSignatureUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
            const filePath = `signatures/${fileName}`;

            // 1. Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('assinaturas')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('assinaturas')
                .getPublicUrl(filePath);

            // 3. Update Local State (Visual Preview)
            // Note: DB is updated when user clicks "Save"
            if (selectedDoctor) {
                setSelectedDoctor(prev => ({
                    ...prev,
                    hasSignature: true,
                    signatureUrl: publicUrl
                }));
            }

        } catch (err) {
            console.error('Error uploading signature:', err);
            alert('Erro ao fazer upload da assinatura: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Update local state during edit
    const handleUpdateLocal = (field, value) => {
        if (!selectedDoctor) return;
        setSelectedDoctor({ ...selectedDoctor, [field]: value });
    };

    return (
        <div className="flex flex-col h-full gap-6">

            {/* 1. Card Superior (Filtros) */}
            <div className="bg-white p-6 rounded-[32px] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-500">
                {/* Visual dinâmico: Se houver seleção, mostra botão Voltar, senão Busca */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                    {selectedDoctor ? (
                        <button
                            onClick={handleClosePanel}
                            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-medium"
                        >
                            <div className="bg-slate-100 p-2 rounded-full">
                                <ChevronLeft size={20} />
                            </div>
                            <span>Voltar para Lista</span>
                        </button>
                    ) : (
                        <div className="relative w-full md:w-96 transition-all duration-500">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar médico..."
                                className="pl-10 pr-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
                            />
                        </div>
                    )}
                </div>

                {/* Filtros e Ações (Ocultar quando editando) */}
                {!selectedDoctor && (
                    <div className="flex items-center gap-3 w-full md:w-auto overflow-hidden">
                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 border border-slate-200 transition-colors font-medium text-sm whitespace-nowrap">
                            <Filter size={18} />
                            <span>Filtrar</span>
                        </button>
                        <button
                            onClick={handleStartCreate}
                            className="ml-auto md:ml-2 flex items-center gap-2 px-5 py-2.5 bg-[#050a30] text-white rounded-xl hover:bg-[#050a30]/90 shadow-lg shadow-blue-900/20 transition-all font-medium text-sm whitespace-nowrap"
                        >
                            <Plus size={18} />
                            <span>Novo Médico</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Container Principal */}
            <div className="flex flex-1 gap-6 overflow-hidden relative">

                {/* Lado Esquerdo: Tabela OU Formulário */}
                <div className={`bg-white rounded-[32px] shadow-sm flex-col overflow-hidden transition-all duration-500 ease-in-out ${selectedDoctor ? 'w-2/5 p-8' : 'w-full'}`}>

                    {selectedDoctor ? (
                        // MODO EDIÇÃO/CRIAÇÃO: Formulário
                        <div className="flex flex-col h-full animate-fadeIn">
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-slate-800">
                                    {isCreating ? 'Novo Médico' : 'Editar Dados'}
                                </h2>
                                <p className="text-slate-500">
                                    {isCreating ? 'Cadastre um novo profissional.' : 'Atualize as informações do profissional.'}
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                        <User size={16} className="text-slate-400" /> Nome Completo
                                    </label>
                                    <input
                                        type="text"
                                        value={selectedDoctor.name}
                                        onChange={(e) => handleUpdateLocal('name', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                </div>

                                {/* Phone field kept for UI but note it's not in provided schema for DB persistence */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                        <Phone size={16} className="text-slate-400" /> Telefone (Visualização)
                                    </label>
                                    <input
                                        type="text"
                                        value={selectedDoctor.phone}
                                        onChange={(e) => handleUpdateLocal('phone', e.target.value)}
                                        placeholder="Não salvo no banco"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                        <FileBadge size={16} className="text-slate-400" /> CRP
                                    </label>
                                    <input
                                        type="text"
                                        value={selectedDoctor.crp}
                                        onChange={(e) => handleUpdateLocal('crp', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="mt-auto pt-6 flex gap-3">
                                <button onClick={handleClosePanel} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors">
                                    Cancelar
                                </button>
                                <button onClick={handleSaveDoctor} className="flex-1 py-3 bg-[#050a30] text-white rounded-xl font-medium hover:bg-[#050a30]/90 shadow-lg shadow-blue-900/20 transition-colors flex items-center justify-center gap-2">
                                    <Save size={18} />
                                    {isCreating ? 'Cadastrar' : 'Salvar Alterações'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        // MODO VISUALIZAÇÃO: Tabela
                        loading ? (
                            <div className="flex items-center justify-center h-full text-slate-400">Carregando médicos...</div>
                        ) : (
                            <DoctorTable
                                doctors={doctors}
                                onSelectDoctor={(doc) => {
                                    setIsCreating(false);
                                    setSelectedDoctor(doc);
                                }}
                                onSort={handleSort}
                            />
                        )
                    )}
                </div>

                {/* Lado Direito: Painel de Assinatura (Apenas se selecionado) */}
                <div
                    className={`bg-white rounded-[32px] shadow-sm flex-1 flex flex-col transition-all duration-500 ease-in-out transform ${selectedDoctor
                        ? 'translate-x-0 opacity-100'
                        : 'translate-x-full opacity-0 absolute right-0 w-1/2'
                        }`}
                >
                    {selectedDoctor && (
                        <div className="flex flex-col h-full p-8 relative">
                            {/* Cabeçalho do Painel de Assinatura */}
                            <div className="mb-6 border-b border-slate-100 pb-6 flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">Assinatura Digital</h2>
                                    <p className="text-slate-500 text-sm mt-1">Gerencie a assinatura usada nos laudos.</p>
                                </div>
                                <button
                                    onClick={handleClosePanel}
                                    className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Área de Visualização da Assinatura (Centralizada) */}
                            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 p-10 mb-8 relative group w-full transition-all hover:bg-slate-50 hover:border-slate-300">
                                {selectedDoctor.hasSignature ? (
                                    <div className="relative w-full h-full flex items-center justify-center">
                                        <img
                                            src={selectedDoctor.signatureUrl || "https://placehold.co/400x200?text=Assinatura"}
                                            alt="Assinatura"
                                            className="max-h-64 object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
                                        />
                                        <div className="absolute top-2 right-2 bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                                            VÁLIDA
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center text-slate-400">
                                        <div className="bg-white p-6 rounded-full inline-block shadow-sm mb-4">
                                            <Upload size={48} className="text-slate-300" />
                                        </div>
                                        <p className="text-lg font-medium text-slate-600">Nenhuma assinatura</p>
                                        <p className="text-sm">Envie um arquivo PNG ou JPEG (Implementação Futura)</p>
                                    </div>
                                )}
                            </div>

                            {/* Ações de Assinatura */}
                            <div className="mt-auto">
                                <label className={`flex items-center justify-center gap-3 w-full py-5 bg-white border-2 border-[#050a30] text-[#050a30] rounded-2xl hover:bg-blue-50 cursor-pointer transition-all active:scale-95 font-bold text-lg shadow-sm ${loading ? 'opacity-50 cursor-wait' : ''}`}>
                                    <Upload size={24} />
                                    <span>{loading ? 'Enviando...' : (selectedDoctor.hasSignature ? 'Substituir Assinatura' : 'Fazer Upload')}</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/png,image/jpeg"
                                        onChange={handleSignatureUpload}
                                        disabled={loading}
                                    />
                                </label>
                                <p className="text-center text-xs text-slate-400 mt-4">
                                    Formatos aceitos: PNG (fundo transparente recomendado) e JPEG.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default Doctors;
