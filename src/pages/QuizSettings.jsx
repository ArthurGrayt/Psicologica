import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Save, X, ChevronDown, ChevronUp, GripVertical, Check, AlertCircle, List, Type, MessageSquare } from 'lucide-react';

const QuizSettings = () => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null); // ID of question being edited
    const [tempQuestion, setTempQuestion] = useState(null); // Draft state for editing

    // Fetch Questions
    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('questions')
                .select('*, question_options(*)')
                .order('id', { ascending: true });

            if (error) throw error;

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
            category: 'general',
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
                category: tempQuestion.category,
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
                    label: o.label,
                    value: o.value || o.label,
                    score_val: o.score_val || 0,
                    id: typeof o.id === 'number' ? o.id : undefined // Let DB generate ID for new opts
                }));

                if (optionsToUpsert.length > 0) {
                    const { error: optError } = await supabase
                        .from('question_options')
                        .upsert(optionsToUpsert);

                    if (optError) throw optError;
                }

                // Note: We are not handling deletion of removed options here for simplicity in this MVP
                // To do that, we'd need to compare original vs new options list and delete missing IDs.
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
                { id: 'temp_' + Date.now(), label: '', score_val: 0 }
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

            {loading ? (
                <div className="text-center py-10 text-slate-400">Carregando perguntas...</div>
            ) : (
                <div className="space-y-4">
                    {questions.map((q) => (
                        <div
                            key={q.id}
                            style={{ marginLeft: q.level ? `${q.level * 2}rem` : '0px' }}
                            className={`bg-white rounded-2xl border transition-all duration-300 relative ${editingId === q.id ? 'border-[#050a30] shadow-md ring-1 ring-[#050a30]/20' : 'border-slate-200 shadow-sm hover:border-slate-300'}`}
                        >
                            {/* Visual connector for child questions */}
                            {q.level > 0 && (
                                <div className="absolute -left-6 top-6 w-6 h-[2px] bg-slate-200" />
                            )}
                            {q.level > 0 && (
                                <div className="absolute -left-6 -top-4 w-[2px] h-[calc(100%+16px)] bg-slate-200" />
                            )}
                            {editingId === q.id ? (
                                // --- EDIT MODE ---
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
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                                                        className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Categoria (Tag)</label>
                                                <input
                                                    type="text"
                                                    value={tempQuestion.category}
                                                    onChange={(e) => updateTemp('category', e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Peso (Score)</label>
                                                <input
                                                    type="number"
                                                    value={tempQuestion.weight}
                                                    onChange={(e) => updateTemp('weight', Number(e.target.value))}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                />
                                            </div>
                                        </div>

                                        {/* Options Editor (Conditional) */}
                                        {['select', 'scale'].includes(tempQuestion.type) && (
                                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mt-4">
                                                <label className="block text-sm font-medium text-slate-700 mb-3 flex justify-between items-center">
                                                    <span>Opções de Resposta</span>
                                                    <button onClick={addOption} className="text-xs font-bold text-blue-600 hover:underline">+ Adicionar Opção</button>
                                                </label>

                                                <div className="space-y-2">
                                                    {tempQuestion.question_options.map((opt, idx) => (
                                                        <div key={opt.id || idx} className="flex gap-2 items-center">
                                                            <div className="text-slate-300"><List size={16} /></div>
                                                            <input
                                                                type="text"
                                                                value={opt.label}
                                                                onChange={(e) => updateOption(idx, 'label', e.target.value)}
                                                                placeholder="Texto da Opção"
                                                                className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                                                            />
                                                            <input
                                                                type="number"
                                                                value={opt.score_val}
                                                                onChange={(e) => updateOption(idx, 'score_val', Number(e.target.value))}
                                                                placeholder="Pts"
                                                                className="w-20 bg-white border border-slate-200 rounded-lg px-2 py-2 text-sm focus:border-blue-500 outline-none text-center"
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
                                            <p className="text-xs text-slate-500 mt-1">
                                                Deixe em branco para exibir a pergunta sempre.
                                            </p>
                                        </div>

                                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                                            <button onClick={handleCancel} className="px-6 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors">
                                                Cancelar
                                            </button>
                                            <button onClick={handleSave} className="px-6 py-2 bg-[#050a30] text-white rounded-xl font-medium hover:bg-[#050a30]/90 transition-colors flex items-center gap-2">
                                                <Save size={18} />
                                                Salvar Alterações
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // --- VIEW MODE ---
                                <div className="p-5 flex items-start gap-4">
                                    <div className="bg-slate-100 text-slate-500 font-mono text-sm px-3 py-1 rounded-lg">
                                        #{String(q.id).padStart(3, '0')}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold text-slate-800 text-lg">{q.text}</h3>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md font-bold uppercase border border-blue-100">
                                                        {getTypeLabel(q.type)}
                                                    </span>
                                                    <span className="text-xs text-slate-400">
                                                        {q.category} • Peso: {q.weight}
                                                    </span>
                                                    {q.depends_on_question_id && (
                                                        <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-md font-bold flex items-center gap-1 border border-amber-200 border-l-4">
                                                            <AlertCircle size={12} />
                                                            CONDICIONAL (PAI: #{q.depends_on_question_id})
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(q)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <List size={20} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(q.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Preview Options */}
                                        {['select', 'scale'].includes(q.type) && q.question_options?.length > 0 && (
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {q.question_options.map(o => (
                                                    <span key={o.id} className="text-xs border border-slate-200 bg-slate-50 text-slate-600 px-2 py-1 rounded-md">
                                                        {o.label} ({o.score_val})
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {questions.length === 0 && (
                        <div className="text-center py-16 bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
                            <MessageSquare className="mx-auto text-slate-300 mb-4" size={48} />
                            <h3 className="text-lg font-medium text-slate-600">Nenhuma pergunta encontrada</h3>
                            <p className="text-slate-400 mt-1 mb-6">Comece criando a primeira pergunta do formulário.</p>
                            <button
                                onClick={handleAddNew}
                                className="px-6 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors shadow-sm"
                            >
                                Criar Pergunta
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default QuizSettings;
