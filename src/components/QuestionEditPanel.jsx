import React, { useState, useEffect } from 'react';
import { X, Save, Pencil, GripVertical, AlertCircle, Trash2 } from 'lucide-react';
import SearchableSelect from './SearchableSelect';

const QuestionEditPanel = ({ isOpen, onClose, question, onSave, categories }) => {
    const [tempQuestion, setTempQuestion] = useState(null);

    useEffect(() => {
        if (question) {
            let initialOptions = question.question_options || [];
            
            // Se for Sim/Não e estiver vazio, inicializa com as opções padrão
            if (question.type === 'yes_no' && initialOptions.length === 0) {
                initialOptions = [
                    { text: 'Sim', label: 'Sim', score_val: 0 },
                    { text: 'Não', label: 'Não', score_val: 0 }
                ];
            }

            setTempQuestion({
                ...question,
                question_options: initialOptions,
                has_logic: !!question.depends_on_question_id
            });
        } else {
            setTempQuestion(null);
        }
    }, [question]);

    if (!tempQuestion) return null;

    const updateTemp = (field, value) => {
        const updated = { ...tempQuestion, [field]: value };
        
        // Se trocar o tipo para sim/não no seletor, garante que as opções existam
        if (field === 'type' && value === 'yes_no' && updated.question_options.length === 0) {
            updated.question_options = [
                { text: 'Sim', label: 'Sim', score_val: 0 },
                { text: 'Não', label: 'Não', score_val: 0 }
            ];
        }

        setTempQuestion(updated);
    };

    const updateOption = (idx, field, value) => {
        const newOpts = [...tempQuestion.question_options];
        newOpts[idx] = { ...newOpts[idx], [field]: value };
        setTempQuestion(prev => ({ ...prev, question_options: newOpts }));
    };

    const addOption = () => {
        const newOpts = [...tempQuestion.question_options, { text: '', label: '', score_val: 0 }];
        setTempQuestion(prev => ({ ...prev, question_options: newOpts }));
    };

    const removeOption = (idx) => {
        const newOpts = tempQuestion.question_options.filter((_, i) => i !== idx);
        setTempQuestion(prev => ({ ...prev, question_options: newOpts }));
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[50] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Panel */}
            <div className={`fixed top-0 right-0 h-full w-full md:w-[35%] bg-white z-[60] shadow-[-10px_0_30px_rgba(0,0,0,0.05)] transition-transform duration-500 ease-in-out transform flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#139690]/10 flex items-center justify-center text-[#139690]">
                            <Pencil size={20} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                            {typeof tempQuestion.id === 'number' ? 'Editar Pergunta' : 'Nova Pergunta'}
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full transition-colors">
                        <X size={20} strokeWidth={1.5} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-[24px] custom-scrollbar">
                    {/* Enunciado */}
                    <div>
                        <label className="block text-[12px] font-bold text-slate-400 uppercase tracking-[0.5px] mb-2 ml-1">Enunciado</label>
                        <textarea
                            value={tempQuestion.text}
                            onChange={(e) => updateTemp('text', e.target.value)}
                            rows={3}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-[#139690]/20 focus:bg-white transition-all text-slate-800 font-medium placeholder:text-slate-300 shadow-sm resize-none"
                            placeholder="Como você se sente hoje?"
                        />
                    </div>

                    {/* Responsive Grid for Type and Category */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Response Type */}
                        <div>
                            <label className="block text-[12px] font-bold text-slate-400 uppercase tracking-[0.5px] mb-2 ml-1">Tipo de Resposta</label>
                            <SearchableSelect
                                options={[
                                    { value: 'text', label: 'Texto Livre' },
                                    { value: 'yes_no', label: 'Sim / Não' },
                                    { value: 'select', label: 'Seleção Única' },
                                    { value: 'scale', label: 'Escala / Múltipla' }
                                ]}
                                value={tempQuestion.type}
                                onChange={(val) => updateTemp('type', val)}
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-[12px] font-bold text-slate-400 uppercase tracking-[0.5px] mb-2 ml-1">Categoria</label>
                            <SearchableSelect
                                options={categories.map(c => ({ value: c.key, label: c.name }))}
                                value={tempQuestion.category_key || tempQuestion.category || ''}
                                onChange={(val) => updateTemp('category_key', val)}
                            />
                        </div>
                    </div>

                    {/* Weight */}
                    <div>
                        <label className="block text-[12px] font-bold text-slate-400 uppercase tracking-[0.5px] mb-2 ml-1">Peso</label>
                        <input
                            type="number"
                            value={tempQuestion.weight}
                            onChange={(e) => updateTemp('weight', Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-[#139690]/20 focus:bg-white transition-all font-medium shadow-sm"
                        />
                    </div>

                    {/* Options (Conditional) */}
                    {['select', 'scale', 'yes_no'].includes(tempQuestion.type) && (
                        <div className="bg-[#F8FAFC] rounded-3xl p-6 border border-slate-100 mt-2 shadow-inner">
                            <div className="flex justify-between items-center mb-5">
                                <div className="flex flex-col">
                                    <h4 className="text-sm font-bold text-slate-700 tracking-tight">Opções de Resposta</h4>
                                    <p className="text-[10px] text-slate-400 font-medium">Defina os valores para o cálculo do score</p>
                                </div>
                                {tempQuestion.type !== 'yes_no' && (
                                    <button onClick={addOption} className="text-xs font-bold text-[#139690] bg-[#139690]/10 px-3 py-1.5 rounded-full hover:bg-[#139690]/20 transition-all">+ Adicionar</button>
                                )}
                            </div>

                            <div className="space-y-3">
                                {tempQuestion.question_options.map((opt, idx) => (
                                    <div key={opt.id || idx} className="flex gap-3 items-center group/opt">
                                        <div className="text-slate-200"><GripVertical size={16} strokeWidth={1.5} /></div>
                                        <input
                                            type="text"
                                            value={opt.label || opt.text || ''}
                                            readOnly={tempQuestion.type === 'yes_no'}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                updateOption(idx, 'label', val);
                                                updateOption(idx, 'text', val);
                                            }}
                                            className={`flex-1 bg-white border border-slate-100 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#139690]/10 outline-none shadow-sm font-medium ${tempQuestion.type === 'yes_no' ? 'bg-slate-50/50 text-slate-500 cursor-not-allowed border-none' : ''}`}
                                        />
                                        <div className="flex flex-col items-center">
                                            <span className="text-[9px] font-bold text-slate-300 uppercase mb-1">Score</span>
                                            <input
                                                type="number"
                                                value={opt.score_val}
                                                onChange={(e) => updateOption(idx, 'score_val', Number(e.target.value))}
                                                className="w-16 bg-white border-2 border-[#139690]/20 rounded-xl px-2 py-2.5 text-sm font-bold text-center text-[#139690] shadow-sm focus:border-[#139690] outline-none transition-all"
                                            />
                                        </div>
                                        {tempQuestion.type !== 'yes_no' && (
                                            <button onClick={() => removeOption(idx)} className="text-slate-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-all">
                                                <Trash2 size={16} strokeWidth={1.5} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Logic Section (Conditional) */}
                    <div className="bg-slate-50/50 rounded-[12px] border border-slate-100 p-5 mt-2 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl transition-colors ${tempQuestion.has_logic ? 'bg-amber-50 text-amber-600' : 'bg-white text-slate-300 shadow-sm'}`}>
                                    <AlertCircle size={20} strokeWidth={1.5} />
                                </div>
                                <p className="text-[15px] font-bold text-slate-700">Lógica Condicional</p>
                            </div>

                            <button
                                onClick={() => updateTemp('has_logic', !tempQuestion.has_logic)}
                                className={`w-12 h-7 rounded-full transition-all duration-400 relative p-1 ${tempQuestion.has_logic ? 'bg-amber-500' : 'bg-slate-200'}`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-all duration-400 ${tempQuestion.has_logic ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {tempQuestion.has_logic && (
                            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300 mt-4 pt-4 border-t border-slate-100">
                                <div>
                                    <label className="block text-[12px] font-bold text-slate-400 uppercase tracking-[0.5px] mb-2 ml-1">Pergunta Pai (ID)</label>
                                    <input
                                        type="number"
                                        value={tempQuestion.depends_on_question_id || ''}
                                        onChange={(e) => updateTemp('depends_on_question_id', e.target.value ? Number(e.target.value) : null)}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-[#139690]/10 outline-none font-bold shadow-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[12px] font-bold text-slate-400 uppercase tracking-[0.5px] mb-2 ml-1">Valor Gatilho</label>
                                    <input
                                        type="text"
                                        value={tempQuestion.show_if_value || ''}
                                        onChange={(e) => updateTemp('show_if_value', e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-[#139690]/10 outline-none font-bold placeholder:text-slate-200 shadow-sm"
                                        placeholder="Ex: Sim"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-slate-50 p-6 flex gap-3 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-3.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-2xl font-bold hover:bg-slate-100 transition-all font-sans"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => onSave(tempQuestion)}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-br from-[#139690] to-[#0d7a75] text-white rounded-2xl font-bold hover:brightness-105 active:scale-95 transition-all shadow-xl shadow-[#139690]/20 font-sans"
                    >
                        <Save size={20} strokeWidth={1.5} />
                        <span>Salvar</span>
                    </button>
                </div>
            </div>
        </>
    );
};

export default QuestionEditPanel;
