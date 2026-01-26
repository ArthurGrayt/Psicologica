import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Save, X, ChevronDown, ChevronUp, GripVertical, Check, AlertCircle, List, Type, MessageSquare, Pencil, Search } from 'lucide-react';
import SearchableSelect from '../components/SearchableSelect';

const QuizSettings = () => {
    const [questions, setQuestions] = useState([]);
    const [categories, setCategories] = useState([]); // Dynamic categories
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null); // ID of question being edited
    const [tempQuestion, setTempQuestion] = useState(null); // Draft state for editing

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterWeight, setFilterWeight] = useState('');
    const [filterCategory, setFilterCategory] = useState('');

    // Fetch Questions
    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('questions')
                .select('*, question_options(*), categories(name)')
                .order('id', { ascending: true });

            if (error) throw error;

            console.log('Dados carregados (QuizSettings):', data);

            // Sort options for each question just in case
            const sorted = data.map(q => ({
                ...q,
                question_options: q.question_options?.sort((a, b) => a.id - b.id) || []
            }));

            setQuestions(organizeQuestions(sorted || []));
        } catch (err) {
            console.error('Error fetching questions:', err);
            alert('Erro ao carregar perguntas.');
        } finally {
            setLoading(false);
        }
    };

    // Fetch Categories
    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            setCategories(data || []);
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    };

    // Helper to organize questions hierarchically
    const organizeQuestions = (allQuestions) => {
        const childrenMap = {};
        const roots = [];

        // 1. Group by Parent
        allQuestions.forEach(q => {
            if (q.depends_on_question_id) {
                if (!childrenMap[q.depends_on_question_id]) childrenMap[q.depends_on_question_id] = [];
                childrenMap[q.depends_on_question_id].push(q);
            } else {
                roots.push(q);
            }
        });

        // 2. Flatten Tree
        const flattened = [];
        const traverse = (nodes, level = 0) => {
            nodes.forEach(node => {
                flattened.push({ ...node, level }); // Add hierarchical level
                if (childrenMap[node.id]) {
                    traverse(childrenMap[node.id], level + 1);
                }
            });
        };

        traverse(roots);

        // 3. (Optional) Append orphans (if parent deleted/not found but child exists)
        // Ideally DB constraints prevent this, but good for safety.
        const visitedIds = new Set(flattened.map(q => q.id));
        allQuestions.forEach(q => {
            if (!visitedIds.has(q.id)) {
                flattened.push({ ...q, level: 0 });
            }
        });

        return flattened;
    };

    useEffect(() => {
        fetchQuestions();
        fetchCategories();
    }, []);

    // Handlers
    const handleAddNew = () => {
        const newQ = {
            id: 'new_' + Date.now(),
            text: '',
            type: 'text',
            category_key: '',
            weight: 0,
            question_options: []
        };
        setQuestions([...questions, newQ]);
        setEditingId(newQ.id);
        setTempQuestion(newQ);
    };

    const handleEdit = (q) => {
        setEditingId(q.id);
        const cloned = JSON.parse(JSON.stringify(q));
        // Ensure has_logic is set based on existing data
        cloned.has_logic = !!(cloned.depends_on_question_id || cloned.show_if_value);
        setTempQuestion(cloned);
    };

    const handleCancel = () => {
        setEditingId(null);
        setTempQuestion(null);
        // If it was a new unsaved question, remove it from list
        if (typeof editingId === 'string' && editingId.startsWith('new_')) {
            setQuestions(questions.filter(q => q.id !== editingId));
        }
    };

    const handleSave = async () => {
        if (!tempQuestion.text.trim()) {
            alert('A pergunta precisa de um texto.');
            return;
        }

        try {
            // 1. Upsert Question
            const qPayload = {
                text: tempQuestion.text,
                type: tempQuestion.type,
                category_key: tempQuestion.category_key || tempQuestion.category,
                weight: tempQuestion.weight,
                depends_on_question_id: tempQuestion.depends_on_question_id || null,
                show_if_value: tempQuestion.show_if_value || null
            };

            // If updating existing
            if (typeof tempQuestion.id === 'number') {
                qPayload.id = tempQuestion.id;
            }

            const { data: savedQ, error: qError } = await supabase
                .from('questions')
                .upsert(qPayload)
                .select()
                .single();

            if (qError) throw qError;

            // 2. Handle Options (if applicable)
            if (['select', 'scale'].includes(tempQuestion.type)) {
                const optionsToUpsert = tempQuestion.question_options.map(o => ({
                    question_id: savedQ.id,
                    text: o.text || o.label, // Use text, fallback to label if migrating state
                    score_val: o.score_val || 0,
                    id: typeof o.id === 'number' ? o.id : undefined // Let DB generate ID for new opts
                }));

                if (optionsToUpsert.length > 0) {
                    const { error: optError } = await supabase
                        .from('question_options')
                        .upsert(optionsToUpsert);

                    if (optError) throw optError;
                }
            }

            // Success
            setEditingId(null);
            setTempQuestion(null);
            fetchQuestions(); // Refresh to get exact IDs and data

        } catch (err) {
            console.error('Error saving:', err);
            alert('Erro ao salvar: ' + err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir esta pergunta?')) return;

        try {
            const { error } = await supabase
                .from('questions')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchQuestions();
        } catch (err) {
            console.error('Error deleting:', err);
            alert('Erro ao excluir: ' + err.message);
        }
    };

    // Sub-Handlers for Editing State
    const updateTemp = (field, value) => {
        setTempQuestion({ ...tempQuestion, [field]: value });
    };

    const addOption = () => {
        setTempQuestion({
            ...tempQuestion,
            question_options: [
                ...tempQuestion.question_options,
                { id: 'temp_' + Date.now(), label: '', text: '', score_val: 0 }
            ]
        });
    };

    const updateOption = (idx, field, value) => {
        const newOpts = [...tempQuestion.question_options];
        newOpts[idx][field] = value;
        setTempQuestion({ ...tempQuestion, question_options: newOpts });
    };

    const removeOption = (idx) => {
        const newOpts = tempQuestion.question_options.filter((_, i) => i !== idx);
        setTempQuestion({ ...tempQuestion, question_options: newOpts });
    };

    // Helper for labels
    const getTypeLabel = (type) => {
        switch (type) {
            case 'yes_no': return 'SIM OU NÃO';
            case 'scale': return 'ESCALA';
            case 'select': return 'SELEÇÃO';
            case 'text': return 'TEXTO';
            default: return type.toUpperCase();
        }
    };

    const getCategoryColors = (catName) => {
        const colors = [
            { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100' },
            { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
            { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100' },
            { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
            { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100' },
            { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
            { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-100' },
            { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100' },
        ];
        if (!catName) return colors[0];
        let hash = 0;
        for (let i = 0; i < catName.length; i++) {
            hash = catName.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % colors.length;
        return colors[index];
    };

    const filteredQuestions = questions.filter(q => {
        const matchesSearch = q.text.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = !filterType || q.type === filterType;
        const matchesWeight = !filterWeight || String(q.weight) === String(filterWeight);
        const matchesCategory = !filterCategory || (q.categories?.name || q.category_key || q.category) === filterCategory;
        return matchesSearch && matchesType && matchesWeight && matchesCategory;
    });

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Formulários & Perguntas</h2>
                    <p className="text-slate-500">Gerencie as perguntas do formulário público.</p>
                </div>
                <button
                    onClick={handleAddNew}
                    disabled={!!editingId} // Disable if already editing
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#139690] text-white rounded-xl hover:bg-[#139690]/90 shadow-lg shadow-blue-900/20 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus size={18} />
                    <span>Nova Pergunta</span>
                </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-4 items-center overflow-visible">
                <div className="relative w-full md:w-96 transition-all duration-500">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Pesquisar pelo texto da pergunta..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-11 pr-4 py-2.5 w-full bg-gray-100 border-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:bg-white transition-all text-slate-700 placeholder:text-gray-400"
                    />
                </div>

                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-44">
                        <SearchableSelect
                            options={categories.map(c => ({ value: c.name, label: c.name }))}
                            value={filterCategory}
                            onChange={(val) => setFilterCategory(val)}
                            placeholder="Todas Categorias"
                        />
                    </div>

                    <div className="relative flex-1 md:w-44">
                        <SearchableSelect
                            options={[
                                { value: 'text', label: 'TEXTO LIVRE' },
                                { value: 'yes_no', label: 'SIM / NÃO' },
                                { value: 'select', label: 'SELEÇÃO ÚNICA' },
                                { value: 'scale', label: 'ESCALA / MÚLTIPLA' }
                            ]}
                            value={filterType}
                            onChange={(val) => setFilterType(val)}
                            placeholder="Todos os Tipos"
                        />
                    </div>

                    <div className="relative flex-1 md:w-32">
                        <SearchableSelect
                            options={[...new Set(questions.map(q => q.weight))].sort((a, b) => a - b).map(w => ({ value: String(w), label: String(w) }))}
                            value={String(filterWeight)}
                            onChange={(val) => setFilterWeight(val)}
                            placeholder="Peso (Todos)"
                        />
                    </div>

                    {(searchTerm || filterType || filterWeight || filterCategory) && (
                        <button
                            onClick={() => { setSearchTerm(''); setFilterType(''); setFilterWeight(''); setFilterCategory(''); }}
                            className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Limpar Filtros"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10 text-slate-400">Carregando perguntas...</div>
            ) : (
                <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                    {filteredQuestions.map((q, index) => (
                        <div
                            key={q.id}
                            style={{ paddingLeft: q.level ? `${q.level * 2}rem` : '0px' }}
                            className={`group relative transition-all duration-200 ${editingId === q.id
                                ? 'bg-white border-y border-gray-100 z-10 shadow-[0_4px_20px_rgba(0,0,0,0.03)]'
                                : `hover:bg-slate-50/50 ${index !== filteredQuestions.length - 1 ? 'border-b border-gray-100' : ''}`
                                }`}
                        >
                            {/* Visual connector for child questions */}
                            {q.level > 0 && (
                                <div className="absolute left-[calc(var(--padding-left)-1.5rem)] top-1/2 w-6 h-[2px] bg-gray-200" style={{ left: `${(q.level - 1) * 2 + 1}rem` }} />
                            )}

                            {editingId === q.id ? (
                                // --- EDIT MODE ---
                                <div className="px-6 pt-6 pb-8">
                                    <div className="flex justify-between items-start mb-6">
                                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                            {typeof q.id === 'number' ? `Editar Pergunta #${q.id}` : 'Nova Pergunta'}
                                        </h3>
                                        <button onClick={handleCancel} className="text-slate-400 hover:text-slate-600">
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Row 1: Text */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Enunciado da Pergunta</label>
                                            <input
                                                type="text"
                                                value={tempQuestion.text}
                                                onChange={(e) => updateTemp('text', e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                                                placeholder="Digite a pergunta..."
                                            />
                                        </div>

                                        {/* Row 2: Type & Category */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Resposta</label>
                                                <div className="relative">
                                                    <SearchableSelect
                                                        options={[
                                                            { value: 'text', label: 'TEXTO LIVRE' },
                                                            { value: 'yes_no', label: 'SIM / NÃO' },
                                                            { value: 'select', label: 'SELEÇÃO ÚNICA' },
                                                            { value: 'scale', label: 'ESCALA / MÚLTIPLA' }
                                                        ]}
                                                        value={tempQuestion.type}
                                                        onChange={(val) => updateTemp('type', val)}
                                                        placeholder="Selecione o tipo..."
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                                                <div className="relative">
                                                    <SearchableSelect
                                                        options={categories.map(c => ({ value: c.key, label: c.name }))}
                                                        value={tempQuestion.category_key || tempQuestion.category || ''}
                                                        onChange={(val) => updateTemp('category_key', val)}
                                                        placeholder="Selecione..."
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Peso (Score)</label>
                                                <input
                                                    type="number"
                                                    value={tempQuestion.weight}
                                                    onChange={(e) => updateTemp('weight', Number(e.target.value))}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                                                />
                                            </div>
                                        </div>

                                        {/* Options Editor (Conditional) */}
                                        {['select', 'scale'].includes(tempQuestion.type) && (
                                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mt-4">
                                                <label className="block text-sm font-medium text-slate-700 mb-3 flex justify-between items-center">
                                                    <span>Opções de Resposta</span>
                                                    <button onClick={addOption} className="text-xs font-bold text-brand-primary hover:underline">+ Adicionar Opção</button>
                                                </label>

                                                <div className="space-y-2">
                                                    {tempQuestion.question_options.map((opt, idx) => (
                                                        <div key={opt.id || idx} className="flex gap-2 items-center">
                                                            <div className="text-slate-300"><List size={16} /></div>
                                                            <input
                                                                type="text"
                                                                value={opt.label || opt.text || ''}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    updateOption(idx, 'label', val);
                                                                    updateOption(idx, 'text', val);
                                                                }}
                                                                placeholder="Texto da Opção"
                                                                className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-brand-primary outline-none"
                                                            />
                                                            <input
                                                                type="number"
                                                                value={opt.score_val}
                                                                onChange={(e) => updateOption(idx, 'score_val', Number(e.target.value))}
                                                                placeholder="Pts"
                                                                className="w-20 bg-white border border-slate-200 rounded-lg px-2 py-2 text-sm focus:border-brand-primary outline-none text-center"
                                                                title="Valor/Pontuação"
                                                            />
                                                            <button onClick={() => removeOption(idx)} className="text-red-400 hover:text-red-600 p-1">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    {tempQuestion.question_options.length === 0 && (
                                                        <p className="text-xs text-slate-400 italic text-center py-2">Nenhuma opção adicionada.</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Logic Dependency Toggle & Box */}
                                        <div className="mt-4 pt-4 border-t border-slate-100">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <AlertCircle size={18} className="text-slate-400" />
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-700">Habilitar Lógica Condicional</p>
                                                        <p className="text-[11px] text-slate-500">Mostrar esta pergunta apenas sob certas condições</p>
                                                    </div>
                                                </div>

                                                {/* Custom Switch */}
                                                <button
                                                    onClick={() => updateTemp('has_logic', !tempQuestion.has_logic)}
                                                    className={`w-12 h-6 rounded-full transition-all duration-300 relative ${tempQuestion.has_logic ? 'bg-[#139690]' : 'bg-slate-300'}`}
                                                >
                                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${tempQuestion.has_logic ? 'left-7' : 'left-1'}`} />
                                                </button>
                                            </div>

                                            {tempQuestion.has_logic && (
                                                <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100/50 animate-fadeIn space-y-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-[11px] font-bold text-blue-900/60 uppercase tracking-wider mb-1">ID da Pergunta Pai</label>
                                                            <input
                                                                type="number"
                                                                value={tempQuestion.depends_on_question_id || ''}
                                                                onChange={(e) => updateTemp('depends_on_question_id', e.target.value ? Number(e.target.value) : null)}
                                                                className="w-full bg-white border border-blue-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                                                placeholder="Ex: 42"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[11px] font-bold text-blue-900/60 uppercase tracking-wider mb-1">Mostrar apenas se resposta for...</label>
                                                            <input
                                                                type="text"
                                                                value={tempQuestion.show_if_value || ''}
                                                                onChange={(e) => updateTemp('show_if_value', e.target.value)}
                                                                className="w-full bg-white border border-blue-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                                                placeholder="Ex: Sim"
                                                            />
                                                        </div>
                                                    </div>
                                                    <p className="text-[10px] text-blue-600/70 italic bg-blue-100/30 p-2 rounded-lg">
                                                        * A pergunta pai deve estar em uma ordem anterior a esta.
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-8">
                                            <button
                                                onClick={handleCancel}
                                                className="px-6 py-2.5 text-slate-500 font-bold hover:bg-slate-100 hover:text-slate-700 rounded-xl transition-all"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={handleSave}
                                                className="px-8 py-2.5 bg-[#139690] text-white rounded-xl font-bold hover:bg-[#139690]/90 transition-all shadow-lg shadow-[#139690]/20 flex items-center gap-2"
                                            >
                                                <Save size={18} />
                                                Salvar Alterações
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // --- VIEW MODE (Refactored to List Row) ---
                                <div className="px-6 py-4 flex items-center gap-5">
                                    {/* Drag Handle */}
                                    <div className="text-slate-300 cursor-grab active:cursor-grabbing hover:text-slate-400 transition-colors shrink-0">
                                        <GripVertical size={20} />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        {/* Row 1: Question Text */}
                                        <div className="mb-1">
                                            <h3 className="font-medium text-slate-900 text-base leading-tight">
                                                {q.text}
                                            </h3>
                                        </div>

                                        {/* Row 2: Metadata */}
                                        <div className="flex items-center gap-2 text-sm">
                                            {/* Priority Badge: Type */}
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-tight">
                                                ⚡ {getTypeLabel(q.type)}
                                            </span>

                                            <span className="text-slate-300 text-xs">•</span>

                                            {/* Category & Weight (Clean text) */}
                                            <span className="text-slate-500 text-xs flex items-center gap-2">
                                                {q.categories?.name || q.category_key || q.category || 'Geral'}
                                                <span className="text-slate-300">•</span>
                                                Peso: {q.weight}
                                            </span>

                                            {/* Logic Indicator */}
                                            {q.depends_on_question_id && (
                                                <>
                                                    <span className="text-slate-300 text-xs">•</span>
                                                    <span className="text-amber-600 flex items-center gap-1 text-[10px] font-bold uppercase tracking-tight" title={`Depende da pergunta #${q.depends_on_question_id}`}>
                                                        <AlertCircle size={12} />
                                                        Condicional
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions (Right) */}
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                        <button
                                            onClick={() => handleEdit(q)}
                                            className="p-2 text-slate-400 hover:text-brand-primary hover:bg-slate-100 rounded-lg transition-colors"
                                            title="Editar Pergunta"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(q.id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Excluir Pergunta"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {filteredQuestions.length === 0 && (
                        <div className="text-center py-16 bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
                            <MessageSquare className="mx-auto text-slate-300 mb-4" size={48} />
                            <h3 className="text-lg font-medium text-slate-600">
                                {searchTerm || filterType || filterWeight ? 'Nenhum resultado para os filtros aplicados' : 'Nenhuma pergunta encontrada'}
                            </h3>
                            <p className="text-slate-400 mt-1 mb-6">
                                {searchTerm || filterType || filterWeight ? 'Tente ajustar seus filtros ou limpar a pesquisa.' : 'Comece criando a primeira pergunta do formulário.'}
                            </p>
                            {(searchTerm || filterType || filterWeight || filterCategory) ? (
                                <button
                                    onClick={() => { setSearchTerm(''); setFilterType(''); setFilterWeight(''); setFilterCategory(''); }}
                                    className="px-6 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors shadow-sm"
                                >
                                    Limpar Filtros
                                </button>
                            ) : (
                                <button
                                    onClick={handleAddNew}
                                    className="px-6 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors shadow-sm"
                                >
                                    Criar Pergunta
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default QuizSettings;
