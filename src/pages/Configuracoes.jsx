import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Save, RefreshCw, AlertCircle, CheckCircle2, FileText, Activity, Brain, Wine, Cigarette, Moon, LayoutDashboard, ChevronUp } from 'lucide-react';

const Configuracoes = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Estado inicial com os valores padrão (fallbacks) do narrativeLogic.js
    const [configs, setConfigs] = useState({
        insatisfacao: [
            { threshold: 7.5, text: 'relatou insatisfação significativa com sua vida atual', label: 'Insatisfação Significativa' },
            { threshold: 5, text: 'relatou insatisfação moderada com sua vida atual', label: 'Insatisfação Moderada' },
            { threshold: 2.5, text: 'relatou leve insatisfação com sua vida atual', label: 'Leve Insatisfação' },
            { threshold: 0, text: 'relatou estar satisfeito com sua vida atual', label: 'Satisfeito' }
        ],
        ansiedade: [
            { threshold: 7.5, text: 'O paciente possui alta possibilidade de apresentar transtornos de ansiedade', label: 'Alta Possibilidade' },
            { threshold: 5, text: 'O paciente possui moderada possibilidade de apresentar transtornos de ansiedade', label: 'Moderada Possibilidade' },
            { threshold: 2.5, text: 'O paciente possui leve possibilidade de apresentar transtornos de ansiedade', label: 'Leve Possibilidade' },
            { threshold: 0, text: 'O paciente não manifestou possibilidade de apresentar transtornos de ansiedade', label: 'Sem Possibilidade' }
        ],
        depressao: [
            { threshold: 7.5, text: 'O paciente possui alta possibilidade de desenvolver depressão', label: 'Alta Possibilidade' },
            { threshold: 5, text: 'O paciente possui moderada possibilidade de desenvolver depressão', label: 'Moderada Possibilidade' },
            { threshold: 2.5, text: 'O paciente possui leve possibilidade de desenvolver depressão', label: 'Leve Possibilidade' },
            { threshold: 0, text: 'O paciente não manifestou possibilidade de desenvolver depressão', label: 'Sem Possibilidade' }
        ],
        alcool: [
            { threshold: 7.5, text: 'relatou consumo frequente e substancial de bebidas alcoólicas', label: 'Consumo Frequente/Substancial' },
            { threshold: 5, text: 'relatou consumo cotidiano e moderado de bebidas alcoólicas', label: 'Consumo Cotidiano/Moderado' },
            { threshold: 2.5, text: 'relatou consumo social ou ocasional de bebidas alcoólicas', label: 'Consumo Social/Ocasional' },
            { threshold: 0, text: 'relatou não fazer uso ou fazer uso mínimo/eventual de bebidas alcoólicas', label: 'Uso Mínimo/Nenhum' }
        ],
        drogas: [
            { threshold: 7.5, text: 'faz uso recorrente de drogas ilícitas ou medicamentos não prescritos', label: 'Uso Recorrente' },
            { threshold: 5, text: 'faz uso de algum medicamento não prescrito ou substância ilícita de forma recreativa', label: 'Uso Recreativo' },
            { threshold: 0, text: 'declarou não fazer uso de nenhum tipo de droga', label: 'Não faz uso' }
        ],
        fumo: [
            { threshold: 7.5, text: 'apresenta dependência intensa ao tabaco', label: 'Dependência Intensa' },
            { threshold: 5, text: 'apresenta dependência moderada/leve ao fumo', label: 'Outras Dependências' },
            { threshold: 0, text: 'declarou não ser fumante', label: 'Não fumante' }
        ],
        sono: [
            { threshold: 7.5, text: 'apresenta distúrbios graves do sono, com impacto na qualidade de vida', label: 'Distúrbios Graves' },
            { threshold: 5, text: 'apresenta alterações relevantes no padrão de sono', label: 'Alterações Relevantes' },
            { threshold: 2.5, text: 'apresenta algumas alterações leves no sono', label: 'Alterações Leves' },
            { threshold: 0, text: 'apresenta sono regular e sem intercorrências', label: 'Sono Regular' }
        ],
        geral: [
            { threshold: 0, text: 'O paciente foi submetido à avaliação psicossocial para verificação de seu estado de saúde mental, como condição necessária à realização do trabalho.', label: 'Introdução' },
            { threshold: 0, text: 'Lembre-se que este teste por si só não pode diagnosticar uma patologia, mas pode indicar a presença de sintomas.', label: 'Disclaimer (Aviso)' },
            { threshold: 0, text: 'O paciente apresenta, nesta avaliação, condições psicológicas compatíveis com suas atividades. Este parecer não é conclusivo quanto à aptidão, sendo essa responsabilidade do médico do trabalho.', label: 'Conclusão (Apto)' },
            { threshold: 0, text: 'Com base nos dados coletados, foram identificados indicadores de risco relevantes e inconclusivos quanto à aptidão do paciente para o trabalho. Recomenda-se uma avaliação complementar com o médico do trabalho responsável pelo PCMSO', label: 'Conclusão (Risco)' }
        ]
    });

    const [initialConfigs, setInitialConfigs] = useState(null); // Para comparar mudanças
    const [savingCategory, setSavingCategory] = useState(null); // ID da categoria salvando no momento

    useEffect(() => {
        fetchConfigs();
    }, []);

    const toggleCategory = (id) => {
        setExpandedCategories(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const fetchConfigs = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('narrative_configs').select('*');
            // Clone profundo dos padrões iniciais para o caso de não haver dados no banco
            const mergedConfigs = JSON.parse(JSON.stringify(configs)); 

            if (data && data.length > 0) {
                data.forEach(item => {
                    if (mergedConfigs[item.category]) {
                        const index = mergedConfigs[item.category].findIndex(c => c.label === item.level);
                        if (index !== -1) {
                            mergedConfigs[item.category][index].text = item.text;
                            mergedConfigs[item.category][index].threshold = item.threshold;
                        }
                    }
                });
            }
            
            setConfigs(mergedConfigs);
            setInitialConfigs(JSON.parse(JSON.stringify(mergedConfigs)));
        } catch (err) {
            console.error('Erro ao buscar configurações:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleTextChange = (category, index, newText) => {
        const updated = { ...configs };
        updated[category][index].text = newText;
        setConfigs({ ...updated });
    };

    const handleThresholdChange = (category, index, newThreshold) => {
        const updated = { ...configs };
        updated[category][index].threshold = parseFloat(newThreshold) || 0;
        setConfigs({ ...updated });
    };

    const hasChanges = (categoryId) => {
        if (!initialConfigs || !configs) return false;
        // Comparação simples de string JSON para detectar se houve mudança no array da categoria
        return JSON.stringify(configs[categoryId]) !== JSON.stringify(initialConfigs[categoryId]);
    };

    const handleSaveCategory = async (categoryId) => {
        setSavingCategory(categoryId);
        setMessage({ type: '', text: '' });

        try {
            const payload = configs[categoryId].map(rule => ({
                category: categoryId,
                threshold: rule.threshold,
                text: rule.text,
                level: rule.label 
            }));

            const { error } = await supabase.from('narrative_configs').upsert(payload, { onConflict: 'category,level' });

            if (error) throw error;
            console.log(`✅ [Sucesso] Configurações da categoria '${categoryId}' salvas com sucesso no banco de dados.`);

            // Atualiza o estado inicial para refletir que as mudanças foram salvas
            const newInitial = { ...initialConfigs };
            newInitial[categoryId] = JSON.parse(JSON.stringify(configs[categoryId]));
            setInitialConfigs(newInitial);

            setMessage({ type: 'success', categoryId, text: 'Salvo!' });
            setTimeout(() => setMessage({ type: '', text: '' }), 2000);
        } catch (err) {
            console.error(`❌ [Erro CRUD] Falha ao salvar configurações da categoria '${categoryId}'. Detalhes do erro:`, err);
            setMessage({ type: 'error', categoryId, text: 'Erro ao salvar' });
        } finally {
            setSavingCategory(null);
        }
    };

    const [expandedCategories, setExpandedCategories] = useState({
        insatisfacao: true // Começa com a primeira aberta
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
                <RefreshCw className="animate-spin text-[#139690]" size={32} />
                <span className="font-medium">Carregando configurações...</span>
            </div>
        );
    }

    const categoriesList = [
        { id: 'insatisfacao', name: 'Insatisfação Pessoal', icon: Brain, color: 'text-purple-600 bg-purple-50' },
        { id: 'ansiedade', name: 'Ansiedade', icon: Activity, color: 'text-orange-600 bg-orange-50' },
        { id: 'depressao', name: 'Depressão', icon: LayoutDashboard, color: 'text-indigo-600 bg-indigo-50' },
        { id: 'alcool', name: 'Consumo de Álcool', icon: Wine, color: 'text-red-600 bg-red-50' },
        { id: 'drogas', name: 'Uso de Drogas', icon: Activity, color: 'text-emerald-600 bg-emerald-50' },
        { id: 'fumo', name: 'Tabagismo', icon: Cigarette, color: 'text-slate-600 bg-slate-50' },
        { id: 'sono', name: 'Qualidade do Sono', icon: Moon, color: 'text-blue-600 bg-blue-50' },
        { id: 'geral', name: 'Informações Gerais', icon: FileText, color: 'text-[#139690] bg-[#139690]/5' },
    ];

    return (
        <div className="max-w-6xl mx-auto pb-24 px-4 sm:px-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                        <div className="bg-[#139690] p-2.5 rounded-2xl shadow-lg shadow-[#139690]/20">
                            <FileText className="text-white" size={28} />
                        </div>
                        Configurações do Laudo
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">Personalize gatilhos de score e textos narrativos.</p>
                </div>
            </div>

            {/* Grid de Configurações */}
            <div className="flex flex-col gap-6">
                {categoriesList.map((category) => {
                    const isExpanded = expandedCategories[category.id];
                    const isSaving = savingCategory === category.id;
                    const isDone = message.type === 'success' && message.categoryId === category.id;
                    const changed = hasChanges(category.id);

                    return (
                        <div key={category.id} className={`bg-white rounded-[2.5rem] border ${isExpanded ? 'border-[#139690]/20 shadow-xl shadow-slate-200/50' : 'border-slate-100 shadow-sm'} overflow-hidden transition-all duration-300`}>
                            {/* Header da Categoria */}
                            <div 
                                className={`px-8 py-7 flex items-center justify-between transition-colors ${isExpanded ? 'bg-slate-50/30 border-b border-slate-50' : ''}`}
                            >
                                <div className="flex items-center gap-5 cursor-pointer flex-1" onClick={() => toggleCategory(category.id)}>
                                    <div className={`p-4 rounded-2xl ${category.color} transition-transform duration-300 ${isExpanded ? 'scale-110' : ''}`}>
                                        <category.icon size={26} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-800 tracking-tight">{category.name}</h2>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                            {configs[category.id].length} Regras Definidas
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-4">
                                    {/* Ícone de Salvar Minimalista Condicional */}
                                    <button
                                        onClick={() => handleSaveCategory(category.id)}
                                        disabled={isSaving}
                                        className={`flex items-center justify-center w-12 h-12 bg-transparent rounded-full transition-all duration-500 active:scale-90 ${
                                            (changed || isSaving || isDone) ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none absolute'
                                        } ${
                                            isDone ? 'text-[#139690]' :
                                            isSaving ? '' :
                                            'text-[#139690] hover:bg-slate-50'
                                        }`}
                                        title="Salvar alterações"
                                    >
                                        {isSaving ? <RefreshCw className="animate-spin" size={20} /> : 
                                         isDone ? <CheckCircle2 size={20} /> : <Save size={20} />}
                                    </button>

                                    <div 
                                        onClick={() => toggleCategory(category.id)}
                                        className={"p-3 cursor-pointer text-slate-400"}
                                        >    
                                        <div className={`transition-transform duration-300 
                                            ${isExpanded ? 'rotate-180' : ''}`}>
                                            <ChevronUp size={24} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Conteúdo Expansível */}
                            <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                                    {configs[category.id].map((rule, idx) => (
                                        <div key={idx} className="space-y-4 group">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-3">
                                                    <span className="w-2 h-2 rounded-full bg-[#139690]" />
                                                    {rule.label}
                                                </label>
                                                <div className={`flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100 group-focus-within:border-[#139690]/30 transition-all ${category.id === 'geral' ? 'invisible pointer-events-none' : ''}`}>
                                                    <span className="text-[10px] font-black text-slate-400 px-1">SCORE &gt;</span>
                                                    <input 
                                                        type="number" 
                                                        step="0.1"
                                                        value={rule.threshold}
                                                        onChange={(e) => handleThresholdChange(category.id, idx, e.target.value)}
                                                        className="w-12 bg-white border border-slate-200 rounded-lg py-1 px-1.5 text-center text-xs font-black text-[#139690] focus:outline-none focus:ring-2 focus:ring-[#139690]/20"
                                                    />
                                                </div>
                                            </div>
                                            <textarea
                                                value={rule.text}
                                                onChange={(e) => handleTextChange(category.id, idx, e.target.value)}
                                                rows={3}
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] px-6 py-5 text-slate-700 font-medium focus:outline-none focus:border-[#139690]/30 focus:bg-white transition-all resize-none shadow-sm placeholder:text-slate-300 leading-relaxed"
                                                placeholder={`Texto descritivo para ${rule.label}...`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Disclaimer / Rodapé */}
            <div className="mt-12 p-8 bg-blue-50/50 rounded-[2.5rem] border border-blue-100/50 flex items-start gap-4">
                <AlertCircle className="text-blue-500 shrink-0 mt-1" size={24} />
                <div className="space-y-2">
                    <h4 className="text-lg font-black text-blue-900 leading-tight">Dicas de Configuração</h4>
                    <p className="text-sm text-blue-800/70 font-medium leading-relaxed">
                        Os textos são inseridos no laudo narrativo conforme o score normalizado (0 a 10) de cada categoria. 
                        Tente manter as frases em terceira pessoa para manter o padrão profissional do documento.
                        <br /><br />
                        <span className="font-bold">Atenção:</span> Você pode ajustar os thresholds (pontos de corte). O sistema usará a regra com o maior threshold que for menor ou igual ao score do paciente.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Configuracoes;
