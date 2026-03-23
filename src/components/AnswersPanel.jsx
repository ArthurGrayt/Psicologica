import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MessageSquare, AlertCircle, X, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';

const AnswersPanel = ({ patient, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [answersMap, setAnswersMap] = useState({});
    const [scoresMap, setScoresMap] = useState({});
    const [expandedCategories, setExpandedCategories] = useState({});
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!patient?.assessmentId) {
            setLoading(false);
            return;
        }
        fetchData();
    }, [patient]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch Answers
            const { data: ansData, error: ansError } = await supabase
                .from('answers')
                .select('*')
                .eq('assessment_id', patient.assessmentId);

            if (ansError) throw ansError;

            const map = {};
            const sMap = {};
            (ansData || []).forEach(a => {
                map[a.question_id] = a.answer_text;
                sMap[a.question_id] = a.score || 0;
            });
            setAnswersMap(map);
            setScoresMap(sMap);

            // Fetch Questions
            const { data: qsData, error: qsError } = await supabase
                .from('questions')
                .select('id, text, type, categories(name)')
                .order('id', { ascending: true });

            if (qsError) throw qsError;
            setQuestions(qsData || []);

        } catch (err) {
            console.error("Erro ao buscar respostas:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-400 p-8">
                <div className="w-6 h-8 border-4 border-[#35b6cf] border-t-transparent rounded-full animate-spin mb-4"></div>
                <p>Carregando respostas...</p>
            </div>
        );
    }

    if (!patient?.assessmentId) {
        return (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-400 p-8">
                <div className="bg-slate-50 p-6 rounded-full mb-4">
                    <MessageSquare size={40} className="opacity-50" />
                </div>
                <p className="text-lg font-medium text-slate-600">Sem respostas</p>
                <p className="text-sm max-w-xs text-center mt-2 opacity-80">
                    O paciente não possui uma avaliação associada para visualização.
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 m-8">
                <p className="font-bold flex items-center gap-2 mb-2">
                    <AlertCircle size={16} /> Erro ao carregar respostas
                </p>
                {error}
            </div>
        );
    }

    // Filtrar apenas as questões que o paciente de fato respondeu
    const answeredQuestions = questions.filter(q => answersMap[q.id] !== undefined);
    
    // Obter lista única de categorias respondidas para o Select
    const availableCategories = [...new Set(answeredQuestions.map(q => q.categories?.name || 'Geral'))].sort();

    const filteredQuestions = answeredQuestions.filter(q => {
        const matchesText = q.text?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            answersMap[q.id]?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesCategory = selectedCategory ? (q.categories?.name || 'Geral') === selectedCategory : true;
        
        return matchesText && matchesCategory;
    });

    const groupedQuestions = filteredQuestions.reduce((acc, q) => {
        const catName = q.categories?.name || 'Geral';
        if (!acc[catName]) acc[catName] = [];
        acc[catName].push(q);
        return acc;
    }, {});

    // Fatores de Normalização (Escala 0-10) - Mesma lógica do gráfico e laudo
    const normalizationFactors = {
        'Insatisfação Pessoal': 10 / 24,
        'Ansiedade': 10 / 32,
        'Depressão': 10 / 36,
        'Álcool': 10 / 38,
        'Drogas ou Remédios': 10 / 20,
        'Sono': 10 / 10,
        'Fumo': 10 / 14
    };

    // Pontuação total por categoria (Original e Normalizada)
    const categoryScores = answeredQuestions.reduce((acc, q) => {
        const catName = q.categories?.name || 'Geral';
        if (!acc[catName]) {
            acc[catName] = { raw: 0, normalized: 0 };
        }
        
        acc[catName].raw += scoresMap[q.id] || 0;
        return acc;
    }, {});

    // Aplica os fatores de normalização para chegar na escala 0-10
    Object.keys(categoryScores).forEach(cat => {
        const factor = normalizationFactors[cat] || 1;
        categoryScores[cat].normalized = categoryScores[cat].raw * factor;
    });

    const toggleCategory = (category) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden  shadow-sm">
            {/* Header Fixo */}
            <div className="px-6 py-5 sticky top-0 bg-white/95 backdrop-blur z-10 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-400 flex items-center gap-2">
                    <MessageSquare size={20} className="text-[#35b6cf]" />
                    Respostas do Paciente
                </h3>
                <button
                    onClick={onClose}
                    className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-full transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="px-6 py-4 flex flex-col md:flex-row gap-3 relative z-10">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Buscar por pergunta ou resposta..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#35b6cf]/20 focus:border-[#35b6cf] transition-all placeholder:text-slate-400"
                    />
                </div>
                <div className="relative w-full md:w-48">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#35b6cf]/20 focus:border-[#35b6cf] transition-all appearance-none"
                    >
                        <option value="">Todas Categorias</option>
                        {availableCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Conteúdo com Scroll */}
            <div className="px-6 pb-12 pt-0.5 overflow-y-auto custom-scrollbar flex-1">
                {filteredQuestions.length === 0 ? (
                    <p className="text-sm text-slate-400 italic text-center mt-8">Nenhuma resposta encontrada.</p>
                ) : (
                    <div className="space-y-3 max-w-5xl mx-auto w-full">
                        {Object.entries(groupedQuestions).sort(([a], [b]) => a.localeCompare(b)).map(([category, qs]) => {
                            const isExpanded = expandedCategories[category];
                            return (
                                <div key={category} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div 
                                        className={`flex flex-col md:flex-row md:items-center justify-between p-4 gap-2 cursor-pointer group transition-colors ${isExpanded ? 'bg-slate-50/50 border-b border-slate-100' : 'hover:bg-slate-50/50'}`}
                                        onClick={() => toggleCategory(category)}
                                    >
                                        <div className="flex items-center gap-3">
                                            {isExpanded ? (
                                                <ChevronUp size={18} className="text-[#139690] opacity-70" />
                                            ) : (
                                                <ChevronDown size={18} className="text-slate-400 group-hover:text-[#139690] transition-colors" />
                                            )}
                                            <h4 className="text-sm font-bold text-[#139690] uppercase tracking-wider group-hover:text-[#2da9c0] transition-colors">
                                                {category}
                                            </h4>
                                        </div>
                                        <div className="flex flex-col md:flex-row gap-2">
                                            <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-bold flex items-center justify-center gap-1.5 shadow-sm min-w-[100px] ml-7 md:ml-0 border border-slate-100">
                                                <span className="opacity-80 font-medium tracking-wide whitespace-nowrap">Score Original:</span>
                                                <span className="text-sm">{categoryScores[category]?.raw || 0}</span>
                                            </div>
                                            <div className="bg-[#139690] text-white px-3 py-1 rounded-full text-[10px] font-bold flex items-center justify-center gap-1.5 shadow-sm min-w-[100px] ml-7 md:ml-0">
                                                <span className="opacity-90 font-medium tracking-wide whitespace-nowrap">Escala 0-10:</span>
                                                <span className="text-sm">{(categoryScores[category]?.normalized || 0).toFixed(1)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {isExpanded && (
                                        <div className="p-4 grid grid-cols-1 gap-3 bg-slate-50/30">
                                            {qs.map(q => (
                                                <div key={q.id} className="bg-white border border-slate-100 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="flex-1">
                                                        <p className="text-sm text-slate-700 font-medium border-l-[3px] border-slate-300 pl-3 leading-relaxed">
                                                            {q.text}
                                                        </p>
                                                    </div>
                                                    <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 min-w-[140px] text-center group-hover:bg-[#35b6cf]/5 transition-colors">
                                                        <p className="text-[9px] text-slate-400 font-bold mb-1 uppercase tracking-widest leading-none">Resposta</p>
                                                        <p className="text-sm text-slate-800 font-bold">
                                                            {answersMap[q.id]}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Seção de Assinatura */}
                {patient.assinatura && (
                    <div className="mt-12 mb-6 border-t border-slate-200 pt-8 flex flex-col items-center">
                        <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm mb-3">
                            <img
                                src={patient.assinatura}
                                alt="Assinatura Eletrônica"
                                className="h-20 object-contain mx-auto"
                            />
                        </div>
                        <div className="border-b border-slate-400 w-full max-w-[250px] mb-2"></div>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-widest text-center">
                            Assinatura Eletrônica do Colaborador
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnswersPanel;
