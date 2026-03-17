import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Save, X, ChevronDown, ChevronUp, GripVertical, Check, AlertCircle, List, Type, MessageSquare, Pencil, Search, Activity, MoreVertical } from 'lucide-react';
import SearchableSelect from '../components/SearchableSelect';
import QuestionEditPanel from '../components/QuestionEditPanel';

const QuizSettings = () => {
    const [questions, setQuestions] = useState([]);
    const [categories, setCategories] = useState([]); // Dynamic categories
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null); // ID of question being edited
    const [tempQuestion, setTempQuestion] = useState(null); // Draft state for editing
    const [openDropdownId, setOpenDropdownId] = useState(null); // Controlled dropdown state

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
            question_options: [],
            has_logic: false
        };
        setEditingId(newQ.id); // Trigger sidepanel
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
    };

    const handleSave = async (updatedQuestion) => {
        if (!updatedQuestion.text.trim()) {
            alert('A pergunta precisa de um texto.');
            return;
        }

        try {
            // 1. Upsert Question
            const qPayload = {
                text: updatedQuestion.text,
                type: updatedQuestion.type,
                category_key: updatedQuestion.category_key || updatedQuestion.category,
                weight: updatedQuestion.weight,
                depends_on_question_id: updatedQuestion.depends_on_question_id || null,
                show_if_value: updatedQuestion.show_if_value || null
            };

            // If updating existing
            if (typeof updatedQuestion.id === 'number') {
                qPayload.id = updatedQuestion.id;
            }

            const { data: savedQ, error: qError } = await supabase
                .from('questions')
                .upsert(qPayload)
                .select()
                .single();

            if (qError) throw qError;

            // 2. Handle Options (if applicable)
            if (['select', 'scale'].includes(updatedQuestion.type)) {
                const optionsToUpsert = updatedQuestion.question_options.map(o => ({
                    question_id: savedQ.id,
                    text: o.text || o.label,
                    score_val: o.score_val || 0,
                    id: typeof o.id === 'number' ? o.id : undefined
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
            fetchQuestions();

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

    const filteredQuestions = questions.filter(q => {
        const matchesSearch = q.text.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = !filterType || q.type === filterType;
        const matchesWeight = !filterWeight || String(q.weight) === String(filterWeight);
        const matchesCategory = !filterCategory || (q.categories?.name || q.category_key || q.category) === filterCategory;
        return matchesSearch && matchesType && matchesWeight && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-[#F8FAFC] -m-6 md:-m-10 p-6 md:p-10 font-sans selection:bg-[#139690]/10">
            <div className="max-w-5xl mx-auto pb-20">
                <div className="flex items-center justify-between mb-8 mt-2">
                    <div>
                        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Perguntas</h2>
                    </div>
                    <button
                        onClick={handleAddNew}
                        disabled={!!editingId}
                        className="flex items-center gap-2 px-4 py-2 bg-[#139690] text-white rounded-xl hover:brightness-105 active:scale-95 shadow-md shadow-[#139690]/20 transition-all font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus size={18} />
                        <span>Nova Pergunta</span>
                    </button>
                </div>

                {/* Filters Bar */}
                <div className="bg-white/40 backdrop-blur-[20px] rounded-[2rem] border border-white/40 p-4 mb-8 shadow-sm flex flex-col lg:flex-row gap-4 items-center ring-1 ring-black/[0.05]">
                    <div className="relative flex-1 w-full">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar perguntas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-[#F0F2F5]/50 border-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#139690]/20 focus:bg-white transition-all text-slate-700 placeholder:text-slate-400 font-medium"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                        <div className="w-full sm:w-48">
                            <SearchableSelect
                                options={categories.map(c => ({ value: c.name, label: c.name }))}
                                value={filterCategory}
                                onChange={(val) => setFilterCategory(val)}
                                placeholder="Categoria"
                                className="ios-select"
                            />
                        </div>

                        <div className="w-full sm:w-44">
                            <SearchableSelect
                                options={[
                                    { value: 'text', label: 'Texto' },
                                    { value: 'yes_no', label: 'Sim / Não' },
                                    { value: 'select', label: 'Seleção' },
                                    { value: 'scale', label: 'Escala' }
                                ]}
                                value={filterType}
                                onChange={(val) => setFilterType(val)}
                                placeholder="Tipo"
                            />
                        </div>

                        {(searchTerm || filterType || filterCategory) && (
                            <button
                                onClick={() => { setSearchTerm(''); setFilterType(''); setFilterCategory(''); }}
                                className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all font-bold text-sm whitespace-nowrap"
                            >
                                <X size={18} />
                                <span>Limpar</span>
                            </button>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
                        <Activity className="animate-spin text-[#139690]" size={32} />
                        <span className="font-medium">Carregando interface...</span>
                    </div>
                ) : (
                    <div className="bg-white/40 backdrop-blur-[20px] rounded-[2.5rem] border border-white/60 shadow-sm overflow-hidden ring-1 ring-black/[0.05]">
                        {filteredQuestions.map((q, index) => (
                            <div
                                key={q.id}
                                style={{ paddingLeft: q.level ? `${q.level * 1.5}rem` : '0px' }}
                                className={`group relative transition-all duration-300 ${index !== filteredQuestions.length - 1 ? 'border-b border-slate-100' : ''}`}
                            >
                                <div className="px-5 py-5 md:px-8 md:py-6 flex items-start md:items-center gap-4 hover:bg-[#F8FAFC]/50 transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <div className="mb-2">
                                            <h3 className="font-bold text-slate-800 text-[15px] md:text-[17px] leading-tight flex flex-wrap items-center gap-2 md:gap-3">
                                                <span className="break-words line-clamp-2 md:line-clamp-none whitespace-normal">{q.text}</span>
                                                {q.depends_on_question_id && (
                                                    <span className="text-amber-600 flex shrink-0 items-center gap-1 text-[10px] font-extrabold bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-tighter ring-1 ring-amber-100">
                                                        Lógica
                                                    </span>
                                                )}
                                            </h3>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 md:gap-4">
                                            <span className="inline-flex shrink-0 items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#F0F2F5] text-slate-500 mix-blend-multiply transition-colors group-hover:bg-slate-100">
                                                {getTypeLabel(q.type)}
                                            </span>

                                            <div className="flex flex-wrap items-center gap-3 text-slate-500 font-medium text-[12px] md:text-[13px]">
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-[#139690]/40" />
                                                    <span className="truncate max-w-[120px] md:max-w-none">{q.categories?.name || q.category_key || q.category || 'Geral'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                                    Peso {q.weight}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Menu Dropdown de Ações */}
                                    <div className="relative shrink-0">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenDropdownId(openDropdownId === q.id ? null : q.id);
                                            }}
                                            className={`p-2 rounded-full transition-colors ${openDropdownId === q.id ? 'bg-slate-200 text-slate-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                                        >
                                            <MoreVertical size={20} />
                                        </button>

                                        {openDropdownId === q.id && (
                                            <>
                                                {/* Overlay invisível para fechar ao clicar fora */}
                                                <div 
                                                    className="fixed inset-0 z-40 cursor-default" 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenDropdownId(null);
                                                    }}
                                                />
                                                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden py-1 animate-fadeIn origin-top-right">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenDropdownId(null);
                                                            handleEdit(q);
                                                        }}
                                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                                                    >
                                                        <Pencil size={16} className="text-slate-400 shrink-0" />
                                                        <span className="font-semibold">Editar</span>
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenDropdownId(null);
                                                            handleDelete(q.id);
                                                        }}
                                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors text-left border-t border-slate-50"
                                                    >
                                                        <Trash2 size={16} className="text-red-500 shrink-0" />
                                                        <span className="font-semibold">Excluir</span>
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {filteredQuestions.length === 0 && (
                            <div className="text-center py-24 bg-white/40">
                                <Search size={40} className="mx-auto mb-4 text-slate-200" />
                                <h3 className="text-xl font-bold text-slate-800">Nenhum resultado</h3>
                                <p className="text-slate-400 mt-2 font-medium">Não encontramos perguntas para esses filtros.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <QuestionEditPanel
                isOpen={editingId !== null}
                onClose={handleCancel}
                question={tempQuestion}
                onSave={handleSave}
                categories={categories}
            />
        </div>
    );
};

export default QuizSettings;
