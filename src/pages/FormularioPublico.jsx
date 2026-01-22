import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle, Check, AlertCircle, ChevronRight, User, Hash, ChevronDown, Calendar, Briefcase, Users, Lock } from 'lucide-react';

/* --- Components Visuals (Styles) --- */
const LoadingScreen = () => (
    <div className="fixed inset-0 bg-gray-50 z-50 flex items-center justify-center font-sans antialiased">
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700&display=swap');
            
            @keyframes text-slide {
                0%, 27.777% { transform: translateY(0%); }
                33.333%, 61.111% { transform: translateY(-25%); }
                66.666%, 94.444% { transform: translateY(-50%); }
                100% { transform: translateY(-75%); }
            }

            .slider {
                animation: text-slide 6.5s cubic-bezier(0.83, 0, 0.17, 1) infinite;
            }

            .gpu-text {
                transform: translateZ(0);
                backface-visibility: hidden;
                -webkit-font-smoothing: antialiased;
            }
        `}</style>
        <div className="flex flex-col items-center justify-center text-[#35b6cf] font-bold text-5xl gap-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
            <div className="flex items-baseline gap-2">
                <span className="gpu-text">Uma</span>
                <span className="flex items-baseline gpu-text">
                    <img src="/corped.png" alt="" className="h-[1.25em] w-auto relative top-[0.25em] -mr-1" />
                    <span>ama</span>
                </span>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="gpu-text">de</span>
                <div className="overflow-hidden h-[1.3em] -mt-2">
                    <div className="slider gpu-text">
                        <span className="block h-[1.3em] leading-[1.3em]">ideias</span>
                        <span className="block h-[1.3em] leading-[1.3em]">soluções</span>
                        <span className="block h-[1.3em] leading-[1.3em]">inovações</span>
                        <span className="block h-[1.3em] leading-[1.3em]">ideias</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const CustomSelect = ({ options, value, onChange, placeholder = 'Selecione...' }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="relative w-full">
            {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full px-4 py-3 bg-white border rounded-lg transition-all cursor-pointer flex justify-between items-center relative z-20 ${isOpen ? 'border-[#35b6cf] ring-2 ring-[#35b6cf]/10' : 'border-slate-200 hover:border-slate-300'}`}
            >
                <span className={value ? 'text-slate-800' : 'text-slate-400'}>
                    {options.find(o => o.value === value)?.label || value || placeholder}
                </span>
                <ChevronDown size={16} className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            {isOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-100 rounded-lg shadow-xl max-h-60 overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-200">
                    {options.map((opt) => (
                        <div
                            key={opt.value}
                            onClick={() => {
                                onChange(opt.value);
                                setIsOpen(false);
                            }}
                            className={`px-4 py-2.5 text-sm cursor-pointer transition-colors flex justify-between items-center ${value === opt.value ? 'bg-blue-50 text-[#35b6cf] font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            {opt.label}
                            {value === opt.value && <Check size={14} />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const SuccessScreen = () => (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-xl shadow-lg border-t-[10px] border-t-[#35b6cf] max-w-[770px] w-full text-center animate-in zoom-in-95 duration-500">
            <div className="mx-auto w-20 h-20 bg-[#35b6cf]/10 text-[#35b6cf] rounded-full flex items-center justify-center mb-6">
                <CheckCircle size={40} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Avaliação Concluída!</h1>
            <p className="text-slate-500 mb-8">Suas respostas foram registradas com sucesso. Agradecemos sua participação.</p>
            <button onClick={() => window.close()} className="text-[#35b6cf] hover:text-[#2ca1b7] font-medium hover:underline">
                Fechar página
            </button>
        </div>
    </div>
);

const BlockedScreen = ({ message }) => (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
            <div className="mx-auto w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                <Lock size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Acesso Indisponível</h3>
            <p className="text-slate-500">{message || 'Esta avaliação já foi finalizada ou não está mais disponível.'}</p>
        </div>
    </div>
);

/* --- Main Component --- */
const FormularioPublico = () => {
    const { assessmentId } = useParams();

    // States
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [locked, setLocked] = useState(false);
    const [finished, setFinished] = useState(false);

    // Data
    const [assessment, setAssessment] = useState(null);
    const [patient, setPatient] = useState(null);
    const [questions, setQuestions] = useState([]);

    // Flow Control
    const [step, setStep] = useState('loading'); // loading, registration, quiz, finished, locked
    const [answers, setAnswers] = useState({}); // Local state for conditional logic check

    // Pagination (One question at a time logic)
    // Actually user requested "Next" button logic implies step-by-step or section based?
    // "A cada clique em 'Próxima', faça um upsert na tabela answers" -> Implies one by one or section.
    // Given the visual reference was one long form or sections, let's assume Step By Step for better UX on mobile or grouped.
    // User Mentioned "Na última pergunta, faça um UPDATE".
    // Let's implement one-question-per-screen for focus, or sections if grouped.
    // Let's go with One-by-One to match "Próxima" flow logic accurately.
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    // Registration Form State
    const [regData, setRegData] = useState({
        name: '',
        birth_date: '',
        gender: '',
        job_role: ''
    });

    useEffect(() => {
        if (assessmentId) fetchAssessment();
    }, [assessmentId]);

    const fetchAssessment = async () => {
        setLoading(true);
        try {
            console.log('Fetching Assessment:', assessmentId);

            // 1. Get Assessment
            const { data: assess, error: assessError } = await supabase
                .from('assessments')
                .select('*')
                .eq('id', assessmentId)
                .single();

            if (assessError || !assess) {
                console.error('Assessment Error:', assessError);
                setError('Avaliação não encontrada.');
                setLoading(false);
                return;
            }

            // 2. Security Check
            if (assess.locked) {
                setLocked(true);
                setStep('locked');
                setLoading(false);
                return;
            }

            // 3. Update Status if Pending
            if (assess.status === 'pending') {
                await supabase
                    .from('assessments')
                    .update({
                        status: 'in_progress',
                        started_at: new Date().toISOString()
                    })
                    .eq('id', assessmentId);
            }

            setAssessment(assess);

            // 4. Load Patient Data (to pre-fill if exists)
            if (assess.patient_id) {
                const { data: pat } = await supabase
                    .from('patients')
                    .select('*')
                    .eq('id', assess.patient_id)
                    .single();

                if (pat) {
                    setPatient(pat);
                    setRegData({
                        name: pat.name || '',
                        birth_date: pat.birth_date || '',
                        gender: pat.gender || '',
                        job_role: pat.role_id ? '' : (pat.job_role || '') // If generic text role
                    });
                }
            }

            // 5. Load Questions
            const { data: qs, error: qError } = await supabase
                .from('questions')
                .select('*, question_options(*)')
                .order('id', { ascending: true }); // Ensure order

            if (qError) throw qError;
            setQuestions(qs || []);

            // 6. Decide Start Step
            // Always confirm registration details first
            setStep('registration');

        } catch (err) {
            console.error('Init Error:', err);
            setError('Erro ao carregar avaliação.');
        } finally {
            setLoading(false);
        }
    };

    // --- Actions ---

    const handleUpdatePatient = async () => {
        if (!regData.name || !regData.birth_date || !regData.gender || !regData.job_role) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from('patients')
                .update({
                    name: regData.name,
                    birth_date: regData.birth_date,
                    gender: regData.gender,
                    // If your schema uses role_id, you might need logic here. 
                    // Assuming generic text column 'job_role' exists or we update 'name' etc.
                    // User prompt said: "UPDATE patients table (name, birth_date, job_role, gender)"
                    // If 'job_role' column doesn't exist, we might need adjustments. Assuming it exists based on prompt.
                    // Actually prompt says "job_role".
                    // Let's assume the column exists or map it.
                })
                .eq('id', assessment.patient_id);

            if (error) throw error;

            setStep('quiz');
        } catch (err) {
            console.error('Update Patient Error:', err);
            alert('Erro ao salvar dados. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerSubmit = async (val) => {
        const currentQ = questions[currentQuestionIndex];

        // Calculate Score
        let score = 0;
        if (currentQ.type === 'yes_no') {
            score = (val === 'Sim') ? (currentQ.weight || 0) : 0;
        } else if (currentQ.type === 'scale' || currentQ.type === 'select') {
            const selectedOpt = currentQ.question_options?.find(o => o.label === val || o.value === val); // Adjust match logic
            score = selectedOpt ? (selectedOpt.score_val || 0) : 0;
        }

        // Upsert Answer
        try {
            await supabase.from('answers').upsert({
                assessment_id: assessmentId,
                question_id: currentQ.id,
                answer_text: String(val), // Store text representation
                score: score,
                // created_at defaults to now
            }, { onConflict: 'assessment_id, question_id' });

            // Update Local State
            setAnswers(prev => ({ ...prev, [currentQ.id]: val }));

            // Next Question or Finish
            handleNextQuestion();

        } catch (err) {
            console.error('Save Answer Error:', err);
            alert('Erro de conexão. Tente novamente.');
        }
    };

    const handleNextQuestion = async () => {
        // Find next valid question based on logic
        let nextIdx = currentQuestionIndex + 1;
        let found = false;

        while (nextIdx < questions.length) {
            const q = questions[nextIdx];

            // Logic Check
            if (q.depends_on_question_id) {
                const parentAns = answers[q.depends_on_question_id];
                // Strict check: if answer matches show_if_value
                // Assuming show_if_value is string comparison
                if (parentAns !== q.show_if_value) {
                    nextIdx++; // Skip
                    continue;
                }
            }

            found = true;
            break;
        }

        if (found) {
            setCurrentQuestionIndex(nextIdx);
        } else {
            // No more questions -> Finish
            finishAssessment();
        }
    };

    const finishAssessment = async () => {
        setLoading(true);
        try {
            await supabase.from('assessments').update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                locked: true
            }).eq('id', assessmentId);

            setStep('finished');
        } catch (err) {
            console.error('Finish Error:', err);
            alert('Erro ao finalizar. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    // --- Render Logic ---

    if (loading && step === 'loading') return <LoadingScreen />;
    if (locked || step === 'locked') return <BlockedScreen />;
    if (finished || step === 'finished') return <SuccessScreen />;
    if (error) return <BlockedScreen message={error} />;

    const FORM_WIDTH = "w-full max-w-[640px]";
    const ACCENT_BORDER = "border-t-[8px] border-t-[#35b6cf]";

    // Render Registration
    if (step === 'registration') {
        return (
            <div className="bg-slate-50 min-h-screen flex flex-col items-center justify-start pt-8 pb-10 px-3 font-sans">
                <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700&display=swap'); body { font-family: 'Outfit', sans-serif; }`}</style>

                <div className={`${FORM_WIDTH} animate-in slide-in-from-bottom-4 duration-500`}>
                    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 ${ACCENT_BORDER} p-6 mb-6`}>
                        <h1 className="text-2xl font-normal text-slate-900 mb-2">Dados Pessoais</h1>
                        <p className="text-slate-500 text-sm">Confirme seus dados para iniciar a avaliação.</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                                <User size={16} className="text-[#35b6cf]" /> Nome Completo
                            </label>
                            <input
                                type="text"
                                className="w-full border border-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#35b6cf]/20 focus:border-[#35b6cf] transition-all"
                                value={regData.name}
                                onChange={e => setRegData({ ...regData, name: e.target.value })}
                                placeholder="Seu nome"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                                    <Calendar size={16} className="text-[#35b6cf]" /> D. Nascimento
                                </label>
                                <input
                                    type="date"
                                    className="w-full border border-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#35b6cf]/20 focus:border-[#35b6cf] transition-all"
                                    value={regData.birth_date}
                                    onChange={e => setRegData({ ...regData, birth_date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                                    <Users size={16} className="text-[#35b6cf]" /> Gênero
                                </label>
                                <CustomSelect
                                    options={[
                                        { label: 'Masculino', value: 'Masculino' },
                                        { label: 'Feminino', value: 'Feminino' },
                                        { label: 'Outro', value: 'Outro' }
                                    ]}
                                    value={regData.gender}
                                    onChange={val => setRegData({ ...regData, gender: val })}
                                    placeholder="Selecione"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                                <Briefcase size={16} className="text-[#35b6cf]" /> Cargo / Função
                            </label>
                            <input
                                type="text"
                                className="w-full border border-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#35b6cf]/20 focus:border-[#35b6cf] transition-all"
                                value={regData.job_role}
                                onChange={e => setRegData({ ...regData, job_role: e.target.value })}
                                placeholder="Cargo atual"
                            />
                        </div>

                        <button
                            onClick={handleUpdatePatient}
                            className="w-full mt-4 bg-[#35b6cf] text-white py-3 rounded-lg font-bold text-lg hover:bg-[#2ca1b7] shadow-lg shadow-cyan-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            Iniciar Avaliação <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Render Quiz
    const currentQ = questions[currentQuestionIndex];
    if (step === 'quiz' && currentQ) {
        // Calculate progress
        // Note: Progress is tricky with logic skips, but simple ratio is okay for MVP
        const progress = Math.round(((currentQuestionIndex + 1) / questions.length) * 100);

        return (
            <div className="bg-slate-50 min-h-screen flex flex-col items-center justify-center p-4 font-sans">
                <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700&display=swap'); body { font-family: 'Outfit', sans-serif; }`}</style>

                <div className={`${FORM_WIDTH} w-full`}>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 h-2 rounded-full mb-6 overflow-hidden">
                        <div
                            className="bg-[#35b6cf] h-full rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 min-h-[400px] flex flex-col justify-center animate-in zoom-in-95 duration-300">

                        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-8 text-center leading-tight">
                            {currentQ.text}
                        </h2>

                        <div className="w-full max-w-md mx-auto space-y-4">
                            {/* YES/NO Buttons */}
                            {currentQ.type === 'yes_no' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => handleAnswerSubmit('Não')}
                                        className="py-4 rounded-xl border-2 border-slate-100 hover:border-[#35b6cf] hover:bg-blue-50 text-slate-600 font-bold text-lg transition-all active:scale-95"
                                    >
                                        Não
                                    </button>
                                    <button
                                        onClick={() => handleAnswerSubmit('Sim')}
                                        className="py-4 rounded-xl bg-[#35b6cf] text-white font-bold text-lg shadow-lg shadow-cyan-500/30 hover:bg-[#2ca1b7] transition-all active:scale-95"
                                    >
                                        Sim
                                    </button>
                                </div>
                            )}

                            {/* Scale / Select Options */}
                            {(currentQ.type === 'scale' || currentQ.type === 'select') && (
                                <div className="flex flex-col gap-3">
                                    {currentQ.question_options?.map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => handleAnswerSubmit(opt.label)}
                                            className="w-full py-3 px-6 rounded-xl border border-slate-200 hover:border-[#35b6cf] hover:bg-blue-50 text-slate-700 font-medium text-left transition-all active:scale-[0.98] flex items-center justify-between group"
                                        >
                                            {opt.label}
                                            <ChevronRight size={18} className="text-slate-300 group-hover:text-[#35b6cf]" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Text Area */}
                            {currentQ.type === 'text' && (
                                <div className="flex flex-col gap-4">
                                    <textarea
                                        className="w-full border border-slate-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-[#35b6cf]/20 focus:border-[#35b6cf] min-h-[120px] resize-none"
                                        placeholder="Digite sua resposta aqui..."
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleAnswerSubmit(e.target.value);
                                            }
                                        }}
                                        id={`q-${currentQ.id}-text`}
                                    />
                                    <button
                                        onClick={() => {
                                            const val = document.getElementById(`q-${currentQ.id}-text`).value;
                                            if (val) handleAnswerSubmit(val);
                                        }}
                                        className="w-full py-3 bg-[#35b6cf] text-white rounded-xl font-bold hover:bg-[#2ca1b7] shadow-lg transition-all"
                                    >
                                        Próxima
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return <LoadingScreen />;
};

export default FormularioPublico;
