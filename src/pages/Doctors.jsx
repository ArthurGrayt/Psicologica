import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Plus, Filter, X, Upload, Save, User, Phone, FileBadge, ChevronLeft, FileKey, ShieldCheck } from 'lucide-react';
import DoctorTable from '../components/DoctorTable';
import SearchableSelect from '../components/SearchableSelect';

const Doctors = () => {
    const [doctors, setDoctors] = useState([]);
    const [filteredDoctors, setFilteredDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [activeSignatureTab, setActiveSignatureTab] = useState('visual'); // visual | pfx
    const [activeEditTab, setActiveEditTab] = useState('data'); // data | contents (assinatura)

    // Search & Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        name: '',
        crp: '',
        hasSignature: 'all' // all, yes, no
    });

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
                phone: '',
                hasSignature: !!d.signature_url,
                signatureUrl: d.signature_url,
                pfxUrl: d.pfx_url || null
            }));

            setDoctors(mapped);
            setFilteredDoctors(mapped);
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

    // Filter Effect
    useEffect(() => {
        let result = [...doctors];

        // 1. General Search Term
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(d =>
                d.name?.toLowerCase().includes(lowerTerm) ||
                d.crp?.toLowerCase().includes(lowerTerm)
            );
        }

        // 2. Advanced Filters
        if (filters.name) {
            result = result.filter(d => d.name?.toLowerCase().includes(filters.name.toLowerCase()));
        }
        if (filters.crp) {
            result = result.filter(d => d.crp?.toLowerCase().includes(filters.crp.toLowerCase()));
        }
        if (filters.hasSignature !== 'all') {
            const needsSignature = filters.hasSignature === 'yes';
            result = result.filter(d => d.hasSignature === needsSignature);
        }

        setFilteredDoctors(result);
    }, [searchTerm, filters, doctors]);

    // Handlers
    const handleSort = (key, direction) => {
        const sorted = [...filteredDoctors].sort((a, b) => {
            if (a[key] < b[key]) return direction === 'ascending' ? -1 : 1;
            if (a[key] > b[key]) return direction === 'ascending' ? 1 : -1;
            return 0;
        });
        setFilteredDoctors(sorted);
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const clearFilters = () => {
        setFilters({
            name: '',
            crp: '',
            hasSignature: 'all'
        });
        setSearchTerm('');
    };

    const handleClosePanel = () => {
        setSelectedDoctor(null);
        setIsCreating(false);
        setActiveSignatureTab('visual');
        setActiveEditTab('data');
    };

    const handleStartCreate = () => {
        setSelectedDoctor({
            name: '',
            crp: '',
            phone: '',
            hasSignature: false,
            signatureUrl: null,
            pfxUrl: null
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
                signature_url: selectedDoctor.signatureUrl,
                pfx_url: selectedDoctor.pfxUrl
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

    // Upload PFX Handler
    const handlePfxUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validar extensão
        const fileName = file.name.toLowerCase();
        if (!fileName.endsWith('.pfx') && !fileName.endsWith('.p12')) {
            alert('Por favor, envie um arquivo .pfx ou .p12');
            return;
        }

        setLoading(true);
        try {
            const fileExt = fileName.split('.').pop();
            const storageName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
            const filePath = `certificates/${storageName}`;

            // 1. Upload to Supabase Storage (Assumindo mesmo bucket 'assinaturas' ou criando pasta)
            // Use 'assinaturas' bucket for now but organize in folders if possible
            const { error: uploadError } = await supabase.storage
                .from('assinaturas')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL (Note: Certificates usually shouldn't be public, but for this demo/MVP flow we need access)
            // Ideally should be Signed URL, but Edge Function needs access. 
            // If bucket is public, this works. If private, we need signed URL logic.
            const { data: { publicUrl } } = supabase.storage
                .from('assinaturas')
                .getPublicUrl(filePath);

            // 3. Update Local State
            if (selectedDoctor) {
                setSelectedDoctor(prev => ({
                    ...prev,
                    pfxUrl: publicUrl
                }));
            }

        } catch (err) {
            console.error('Error uploading certificate:', err);
            alert('Erro ao fazer upload do certificado: ' + err.message);
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
            <div className="bg-white p-6 rounded-[32px] shadow-sm flex flex-col gap-6 transition-all duration-500 overflow-visible">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
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
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Buscar médico..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-11 pr-4 py-2.5 w-full bg-gray-100 border-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#139690]/20 focus:bg-white transition-all text-slate-700 placeholder:text-gray-400"
                                />
                            </div>
                        )}
                    </div>

                    {/* Filtros e Ações (Ocultar quando editando) */}
                    {!selectedDoctor && (
                        <div className="flex items-center gap-3 w-full md:w-auto overflow-hidden">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-medium text-sm whitespace-nowrap border ${showFilters
                                    ? 'bg-[#139690] text-white border-[#139690] shadow-lg shadow-teal-900/20'
                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                                    }`}
                            >
                                <Filter size={18} />
                                <span>{showFilters ? 'Ocultar Filtros' : 'Filtrar'}</span>
                            </button>
                            <button
                                onClick={handleStartCreate}
                                className="ml-auto md:ml-2 flex items-center gap-2 px-6 py-2.5 bg-[#139690] text-white rounded-2xl hover:bg-[#139690]/90 shadow-lg transition-all font-bold text-sm whitespace-nowrap"
                            >
                                <Plus size={18} />
                                <span>Novo Médico</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Advanced Filter Panel */}
                {!selectedDoctor && showFilters && (
                    <div className="pt-6 border-t border-slate-100 animate-in slide-in-from-top-4 fade-in duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Nome do Médico</label>
                                <div className="relative">
                                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Ex: João Silva"
                                        value={filters.name}
                                        onChange={(e) => handleFilterChange('name', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#139690]/20 focus:border-[#139690] transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">CRP</label>
                                <div className="relative">
                                    <FileBadge size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="00/00000"
                                        value={filters.crp}
                                        onChange={(e) => handleFilterChange('crp', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#139690]/20 focus:border-[#139690] transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Possui Assinatura</label>
                                <SearchableSelect
                                    options={[
                                        { value: 'all', label: 'Todos' },
                                        { value: 'yes', label: 'Sim' },
                                        { value: 'no', label: 'Não' }
                                    ]}
                                    value={filters.hasSignature}
                                    onChange={(val) => handleFilterChange('hasSignature', val)}
                                    placeholder="Selecione..."
                                />
                            </div>
                        </div>

                        <div className="flex justify-end mt-6">
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-slate-600 transition-colors text-sm font-medium"
                            >
                                <X size={16} />
                                Limpar Filtros
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Tabs Mobile/Tablet - Fora do card superior */}
            {selectedDoctor && (
                <div className="xl:hidden flex p-1 bg-white border border-slate-100 rounded-2xl w-full shadow-sm">
                    <button
                        onClick={() => setActiveEditTab('data')}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${activeEditTab === 'data' ? 'bg-cyan-50 text-[#139690]' : 'text-slate-400 opacity-60'}`}
                    >
                        Dados do Médico
                    </button>
                    <button
                        onClick={() => setActiveEditTab('contents')}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${activeEditTab === 'contents' ? 'bg-cyan-50 text-[#139690]' : 'text-slate-400 opacity-60'}`}
                    >
                        Assinatura & Certificado
                    </button>
                </div>
            )}

            {/* Container Principal */}
            <div className="flex flex-1 gap-6 overflow-visible relative min-h-0">

                {/* Lado Esquerdo: Tabela OU Formulário */}
                <div className={`xl:bg-white rounded-[32px] xl:shadow-sm flex flex-col overflow-visible transition-all duration-500 ease-in-out ${selectedDoctor ? 'xl:w-2/5 p-8 bg-white shadow-sm w-full xl:mb-0' : 'w-full bg-transparent shadow-none'} ${selectedDoctor && activeEditTab !== 'data' ? 'hidden xl:flex' : 'flex'}`}>

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
                                <button onClick={handleSaveDoctor} className="flex-1 py-3 bg-[#139690] text-white rounded-xl font-medium hover:bg-[#139690]/90 shadow-lg shadow-blue-900/20 transition-colors flex items-center justify-center gap-2">
                                    <Save size={18} />
                                    {isCreating ? 'Cadastrar' : 'Salvar'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        loading ? (
                            <div className="flex items-center justify-center h-full text-slate-400">Carregando médicos...</div>
                        ) : (
                            <DoctorTable
                                doctors={filteredDoctors}
                                onSelectDoctor={(doc) => {
                                    setIsCreating(false);
                                    setSelectedDoctor(doc);
                                }}
                                onSort={handleSort}
                                onDelete={handleDeleteDoctor}
                            />
                        )
                    )}
                </div>

                {/* Lado Direito: Painel de Assinatura (Apenas se selecionado) */}
                <div
                    className={`bg-white rounded-[32px] shadow-sm flex-1 flex flex-col transition-all duration-500 ease-in-out transform xl:mb-0 ${selectedDoctor
                        ? 'translate-x-0 opacity-100'
                        : 'translate-x-full opacity-0 absolute right-0 xl:w-1/2'
                        } ${selectedDoctor && activeEditTab !== 'contents' ? 'hidden xl:flex' : 'flex'}`}
                >
                    {selectedDoctor && (
                        <div className="flex flex-col h-full p-8 relative">
                            {/* Cabeçalho do Painel de Assinatura */}
                            <div className="mb-6 border-b border-slate-100 pb-6 flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">Assinatura & Certificado</h2>
                                    <p className="text-slate-500 text-sm mt-1">Gerencie a assinatura usada nos laudos.</p>
                                </div>
                                <button
                                    onClick={handleClosePanel}
                                    className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
                                <button
                                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeSignatureTab === 'visual'
                                        ? 'bg-white text-slate-800 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                    onClick={() => setActiveSignatureTab('visual')}
                                >
                                    Assinatura Visual
                                </button>
                                <button
                                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeSignatureTab === 'pfx'
                                        ? 'bg-white text-slate-800 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                    onClick={() => setActiveSignatureTab('pfx')}
                                >
                                    Certificado Digital
                                </button>
                            </div>


                            {/* Área de Visualização da Assinatura (Centralizada) */}
                            {activeSignatureTab === 'visual' ? (
                                <>
                                    {/* Área de Visualização da Assinatura (Centralizada) */}
                                    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 p-10 mb-8 relative group w-full transition-all hover:bg-slate-50 hover:border-slate-300">
                                        {selectedDoctor.signatureUrl ? (
                                            <div className="relative w-full h-full flex items-center justify-center">
                                                <img
                                                    src={selectedDoctor.signatureUrl}
                                                    alt="Assinatura"
                                                    className="max-h-64 object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
                                                    onLoad={() => console.log('Assinatura carregada com sucesso:', selectedDoctor.signatureUrl)}
                                                    onError={(e) => {
                                                        // ... erro handler ...
                                                        if (!selectedDoctor.signatureUrl.startsWith('http')) {
                                                            const { data } = supabase.storage.from('assinaturas').getPublicUrl(selectedDoctor.signatureUrl);
                                                            if (data?.publicUrl) e.target.src = data.publicUrl;
                                                        }
                                                    }}
                                                />
                                                <div className="absolute top-2 right-2 bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full border border-green-200">
                                                    VÁLIDA
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center text-slate-400">
                                                <div className="bg-white p-6 rounded-full inline-block shadow-sm mb-4">
                                                    <Upload size={48} className="text-slate-300" />
                                                </div>
                                                <p className="text-lg font-medium text-slate-600">Nenhuma assinatura</p>
                                                <p className="text-sm">Envie um arquivo PNG ou JPEG</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Ações de Assinatura */}
                                    <div className="mt-auto">
                                        <label className={`flex items-center justify-center gap-3 w-full py-5 bg-white border-2 border-[#139690] text-[#139690] rounded-2xl hover:bg-blue-50 cursor-pointer transition-all active:scale-95 font-bold text-lg shadow-sm ${loading ? 'opacity-50 cursor-wait' : ''}`}>
                                            <Upload size={24} />
                                            <span>{loading ? 'Enviando...' : (selectedDoctor.signatureUrl ? 'Substituir Assinatura' : 'Fazer Upload')}</span>
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
                                </>
                            ) : (
                                <>
                                    {/* Tab Certificado Digital */}
                                    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 p-10 mb-8 relative group w-full transition-all hover:bg-slate-50 hover:border-slate-300">
                                        {selectedDoctor.pfxUrl ? (
                                            <div className="text-center">
                                                <div className="bg-green-50 p-6 rounded-full inline-block shadow-sm mb-4 border border-green-100">
                                                    <ShieldCheck size={64} className="text-green-500" />
                                                </div>
                                                <p className="text-lg font-bold text-slate-700">Certificado Configurado</p>
                                                <p className="text-sm text-slate-500 mb-2">Seu arquivo PFX está pronto para uso.</p>
                                                <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full border border-green-200">
                                                    VÁLIDO
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center text-slate-400">
                                                <div className="bg-white p-6 rounded-full inline-block shadow-sm mb-4">
                                                    <FileKey size={48} className="text-slate-300" />
                                                </div>
                                                <p className="text-lg font-medium text-slate-600">Nenhum certificado</p>
                                                <p className="text-sm">Envie um arquivo .PFX ou .P12</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-auto">
                                        <label className={`flex items-center justify-center gap-3 w-full py-5 bg-white border-2 border-blue-500 text-blue-600 rounded-2xl hover:bg-blue-50 cursor-pointer transition-all active:scale-95 font-bold text-lg shadow-sm ${loading ? 'opacity-50 cursor-wait' : ''}`}>
                                            <Upload size={24} />
                                            <span>{loading ? 'Enviando...' : (selectedDoctor.pfxUrl ? 'Substituir Certificado' : 'Upload Certificado')}</span>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept=".pfx,.p12"
                                                onChange={handlePfxUpload}
                                                disabled={loading}
                                            />
                                        </label>
                                        <p className="text-center text-xs text-slate-400 mt-4">
                                            Formatos aceitos: PFX e P12 (A1).
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default Doctors;
