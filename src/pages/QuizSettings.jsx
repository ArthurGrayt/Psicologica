import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Save, X, ChevronDown, ChevronUp, GripVertical, Check, AlertCircle, List, Type, MessageSquare } from 'lucide-react';

const QuizSettings = () => {
    const [questions, setQuestions] = useState([]);
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
        setTempQuestion(JSON.parse(JSON.stringify(q))); // Deep copy
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
                    label: o.label || o.text,
                    text: o.label || o.text, // Persist both to be safe
                    value: o.value || o.label || o.text,
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
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#050a30] text-white rounded-xl hover:bg-[#050a30]/90 shadow-lg shadow-blue-900/20 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus size={18} />
                    <span>Nova Pergunta</span>
                </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <MessageSquare size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Pesquisar pelo texto da pergunta..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-11 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    />
                </div>

                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-44">
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="w-full appearance-none bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-slate-700"
                        >
                            <option value="">Todas Categorias</option>
                            {[...new Set(questions.map(q => q.categories?.name || q.category_key || q.category))].filter(Boolean).sort().map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>

                    <div className="relative flex-1 md:w-44">
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="w-full appearance-none bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-slate-700"
                        >
                            <option value="">Todos os Tipos</option>
                            <option value="text">TEXTO LIVRE</option>
                            <option value="yes_no">SIM / NÃO</option>
                            <option value="select">SELEÇÃO ÚNICA</option>
                            <option value="scale">ESCALA / MÚLTIPLA</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>

                    <div className="relative flex-1 md:w-32">
                        <select
                            value={filterWeight}
                            onChange={(e) => setFilterWeight(e.target.value)}
                            className="w-full appearance-none bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-slate-700"
                        >
                            <option value="">Peso (Todos)</option>
                            {[...new Set(questions.map(q => q.weight))].sort((a, b) => a - b).map(w => (
                                <option key={w} value={w}>{w}</option>
                            ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
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
                <div className="space-y-4">
                    {filteredQuestions.map((q) => (
                        <div
                            key={q.id}
                            style={{ marginLeft: q.level ? `${q.level * 2}rem` : '0px' }}
                            className={`group relative transition-all duration-200 ${editingId === q.id
                                ? 'bg-white rounded-2xl border border-brand-secondary shadow-lg ring-1 ring-brand-secondary/20 my-4 z-10'
                                : 'bg-white border-b border-gray-100 hover:bg-gray-50'
                                }`}
                        >
                            {/* Visual connector for child questions - Adjusted for new layout */}
                            {q.level > 0 && (
                                <div className="absolute -left-6 top-1/2 w-6 h-[2px] bg-gray-200" />
                            )}
                            {q.level > 0 && (
                                <div className="absolute -left-6 -top-4 w-[2px] h-[calc(100%+8px)] bg-gray-200" />
                            )}

                            {editingId === q.id ? (
                                // --- EDIT MODE (Kept mostly same but cleaner container) ---
                                <div className="p-6">
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
                                                    <select
                                                        value={tempQuestion.type}
                                                        onChange={(e) => updateTemp('type', e.target.value)}
                                                        className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-8 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                                                    >
                                                        <option value="text">TEXTO LIVRE</option>
                                                        <option value="yes_no">SIM / NÃO</option>
                                                        <option value="select">SELEÇÃO ÚNICA</option>
                                                        <option value="scale">ESCALA / MÚLTIPLA</option>
                                                    </select>
                                                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Categoria (Key)</label>
                                                <input
                                                    type="text"
                                                    value={tempQuestion.category_key || tempQuestion.category || ''}
                                                    onChange={(e) => updateTemp('category_key', e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                                                    placeholder="ex: Ansiedade"
                                                />
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

                                        {/* Logic Dependency */}
                                        <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 mt-4">
                                            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                                <AlertCircle size={14} className="text-blue-500" />
                                                Lógica Condicional (Opcional)
                                            </label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <input
                                                    type="number"
                                                    value={tempQuestion.depends_on_question_id || ''}
                                                    onChange={(e) => updateTemp('depends_on_question_id', e.target.value ? Number(e.target.value) : null)}
                                                    className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm"
                                                    placeholder="ID da Pergunta Pai"
                                                />
                                                <input
                                                    type="text"
                                                    value={tempQuestion.show_if_value || ''}
                                                    onChange={(e) => updateTemp('show_if_value', e.target.value)}
                                                    className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm"
                                                    placeholder="Mostrar apenas se resposta for..."
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                                            <button onClick={handleCancel} className="px-6 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors">
                                                Cancelar
                                            </button>
                                            <button onClick={handleSave} className="px-6 py-2 bg-brand-secondary text-white rounded-xl font-medium hover:opacity-90 transition-colors flex items-center gap-2">
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
                                    <div className="text-slate-300 cursor-grab active:cursor-grabbing hover:text-slate-500 transition-colors">
                                        <GripVertical size={20} />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        {/* Row 1: Question Text */}
                                        <div className="flex items-center gap-3 mb-1.5">
                                            <span className="text-xs font-mono text-slate-400 w-8">#{String(q.id).padStart(3, '0')}</span>
                                            <h3 className="font-medium text-slate-900 text-base truncate pr-4" title={q.text}>
                                                {q.text}
                                            </h3>
                                        </div>

                                        {/* Row 2: Metadata */}
                                        <div className="flex items-center gap-2 text-sm flex-wrap">
                                            {/* Priority Badge: Type */}
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                                                ⚡ {getTypeLabel(q.type)}
                                            </span>

                                            <span className="text-slate-300 text-xs">•</span>

                                            {/* Category (Clean text) */}
                                            <span className="text-slate-500 text-xs">
                                                {q.categories?.name || q.category_key || q.category || 'Geral'}
                                            </span>

                                            <span className="text-slate-300 text-xs">•</span>

                                            {/* Weight (Clean text) */}
                                            <span className="text-slate-500 text-xs">
                                                Peso: {q.weight}
                                            </span>

                                            {/* Logic Indicator */}
                                            {q.depends_on_question_id && (
                                                <>
                                                    <span className="text-slate-300 text-xs">•</span>
                                                    <span className="text-amber-600 flex items-center gap-1 text-xs font-medium" title={`Depende da pergunta #${q.depends_on_question_id}`}>
                                                        <AlertCircle size={12} />
                                                        Condicional
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions (Right) */}
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEdit(q)}
                                            className="p-2 text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors"
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
