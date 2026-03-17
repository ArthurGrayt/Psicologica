import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle, Lock, User, ChevronDown, AlignLeft, ChevronUp, Search, Check, X } from 'lucide-react';
import SearchableSelect from '../components/SearchableSelect';
import SignatureCanvas from 'react-signature-canvas';

/* --- Components Visuals (Styles) --- */
const LoadingScreen = () => (
    <div className="fixed inset-0 bg-slate-50 z-50 flex items-center justify-center font-sans antialiased">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#35b6cf] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[#35b6cf] font-medium animate-pulse">Carregando avaliação...</p>
        </div>
    </div>
);

const SuccessScreen = () => (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#ccedf3] flex items-center justify-center p-6 font-sans">
        <div className="bg-white p-8 rounded-xl shadow border-t-[10px] border-t-[#35b6cf] max-w-[640px] w-full text-center animate-in zoom-in-95 duration-500">
            <h1 className="text-2xl font-normal text-slate-800 mb-6">Levantamento Preliminar Psicossocial</h1>
            <div className="mb-6 text-left p-4 bg-slate-50 rounded text-slate-800 text-[14px]">
                Sua resposta foi registrada.
            </div>
            <button onClick={() => window.close()} className="text-[#35b6cf] hover:text-[#2ca9c0] text-sm font-medium hover:underline">
                Enviar outra resposta
            </button>
        </div>
    </div>
);

const BlockedScreen = ({ message }) => (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#ccedf3] flex items-center justify-center p-6 font-sans">
        <div className="bg-white p-8 rounded-xl shadow border-t-[10px] border-red-400 max-w-[640px] w-full text-center">
            <div className="mx-auto w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                <Lock size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Acesso Indisponível</h3>
            <p className="text-slate-500">{message || 'Esta avaliação já foi finalizada ou não está mais disponível.'}</p>
        </div>
    </div>
);

/* --- Question Component --- */
const QuestionCard = ({ question, answer, onAnswer, error }) => {
    // Determine input type
    const renderInput = () => {
        if (question.type === 'yes_no') {
            return (
                <div className="flex flex-col gap-3 mt-4">
                    {['Sim', 'Não'].map((opt) => (
                        <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${answer === opt ? 'border-[#35b6cf]' : 'border-slate-300 group-hover:border-slate-400'}`}>
                                {answer === opt && <div className="w-2.5 h-2.5 rounded-full bg-[#35b6cf]" />}
                            </div>
                            <input
                                type="radio"
                                name={`q-${question.id}`}
                                value={opt}
                                checked={answer === opt}
                                onChange={() => onAnswer(opt)}
                                className="hidden"
                            />
                            <span className="text-[14px] text-[#202124]">{opt}</span>
                        </label>
                    ))}
                </div>
            );
        }

        if (question.type === 'scale' || question.type === 'select') {
            const hasOptions = question.question_options && question.question_options.length > 0;

            return (
                <div className="mt-6 relative max-w-[400px]">
                    {hasOptions ? (
                        <SearchableSelect
                            options={question.question_options.map(opt => ({
                                value: String(opt.label || opt.text || opt.value),
                                label: String(opt.label || opt.text || opt.value)
                            }))}
                            value={String(answer || '')}
                            onChange={(val) => onAnswer(val)}
                            placeholder="Escolher opção..."
                        />
                    ) : (
                        <p className="text-red-500 text-xs italic">Erro: Nenhuma opção carregada para esta pergunta.</p>
                    )}
                </div>
            );
        }

        if (question.type === 'text') {
            return (
                <div className="mt-6">
                    <input
                        type="text"
                        placeholder="Sua resposta"
                        value={answer || ''}
                        onChange={(e) => onAnswer(e.target.value)}
                        className="w-full border-b border-slate-300 py-2 text-[#202124] text-[14px] focus:outline-none focus:border-[#35b6cf] transition-all"
                    />
                </div>
            );
        }

        return null;
    };

    return (
        <div id={`question-${question.id}`} className={`bg-white rounded-xl shadow-sm border border-slate-200 px-6 py-7 mb-3 transition-all duration-300 ${error ? 'border-red-500 border-l-8' : ''}`}>
            <h3 className="text-[15px] text-[#202124] font-normal leading-relaxed">
                {question.text} {question.required !== false && <span className="text-red-500 ml-1">*</span>}
            </h3>
            {renderInput()}
            {error && (
                <p className="text-[#d93025] text-[12px] mt-4 flex items-center gap-1">
                    <AlignLeft size={14} /> Esta pergunta é obrigatória
                </p>
            )}
        </div>
    );
};

/* --- Signature Modal Component --- */
const SignatureModal = ({ isOpen, onClose, onSave, loading }) => {
    const sigCanvas = useRef({});

    const clear = () => sigCanvas.current.clear();
    const save = () => {
        if (sigCanvas.current.isEmpty()) {
            alert("Por favor, assine antes de salvar.");
            return;
        }
        // Fix: Use getCanvas() to avoid trim-canvas import error in Vite
        onSave(sigCanvas.current.getCanvas().toDataURL('image/png'));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-[#35b6cf] p-4 text-white flex justify-between items-center">
                    <h3 className="font-bold">Assinatura Digital</h3>
                    <button onClick={onClose} className="hover:bg-white/20 p-1 rounded"><X size={20} /></button>
                </div>

                <div className="p-4 bg-slate-50 flex justify-center">
                    <div className="border-2 border-dashed border-slate-300 rounded bg-white relative">
                        <SignatureCanvas
                            ref={sigCanvas}
                            penColor="black"
                            canvasProps={{ width: 320, height: 180, className: 'sigCanvas' }}
                        />
                        <p className="text-[10px] text-slate-300 text-center absolute bottom-2 w-full pointer-events-none uppercase tracking-widest">Área de Assinatura</p>
                    </div>
                </div>

                <div className="p-4 bg-white border-t border-slate-100 flex justify-between gap-3">
                    <button onClick={clear} className="text-slate-500 hover:bg-slate-100 px-4 py-2 rounded text-sm transition-colors">
                        Limpar
                    </button>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="border border-slate-300 text-slate-700 px-4 py-2 rounded text-sm hover:bg-slate-50 transition-colors">
                            Cancelar
                        </button>
                        <button
                            onClick={save}
                            disabled={loading}
                            className="bg-[#35b6cf] text-white px-6 py-2 rounded text-sm hover:bg-[#2da9c0] transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <Check size={16} />}
                            Salvar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* --- Main Component --- */
const FormularioPublico = () => {
    const { assessmentId } = useParams();

    // States
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [status, setStatus] = useState('active'); // active, locked, finished

    // Data
    const [assessment, setAssessment] = useState(null);
    const [patient, setPatient] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [validationErrors, setValidationErrors] = useState([]);
    const [showScrollTop, setShowScrollTop] = useState(false);

    // Scroll ref for error focusing
    const topRef = useRef(null);

    // Signature State
    const [showSigModal, setShowSigModal] = useState(false);
    const [signatureUrl, setSignatureUrl] = useState(null);
    const [sigLoading, setSigLoading] = useState(false);

    useEffect(() => {
        if (assessmentId) fetchAssessment();

        const handleScroll = () => {
            if (window.scrollY > 300) {
                setShowScrollTop(true);
            } else {
                setShowScrollTop(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [assessmentId]);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const fetchAssessment = async () => {
        setLoading(true);
        try {
            // 1. Get Assessment
            const { data: assess, error: assessError } = await supabase
                .from('assessments')
                .select('*')
                .eq('id', assessmentId)
                .maybeSingle();

            if (assessError || !assess) throw new Error('Avaliação não encontrada.');

            if (assess.locked || assess.status === 'completed') {
                setStatus('locked');
                setLoading(false);
                return;
            }

            setAssessment(assess);
            if (assess.status === 'pending' || assess.status === 'sent') {
                await supabase.from('assessments').update({ status: 'in_progress', started_at: new Date().toISOString() }).eq('id', assessmentId);
            }

            // 2. Busca dados detalhados do colaborador (Paciente)
            if (assess.patient_id) {
                // Prioriza a tabela 'colaboradores' conforme a nova diretiva
                // Busca o colaborador na tabela 'colaboradores' com os dados da unidade
                const { data: colab, error: colabError } = await supabase
                    .from('colaboradores') // Especifica a tabela colaboradores
                    .select('*, unidade:unidade(nome_unidade)') // Seleciona todos os campos e faz join com unidade
                    .eq('id', assess.patient_id) // Filtra pelo ID do colaborador
                    .maybeSingle(); // Retorna o primeiro registro ou null

                if (colab) {
                    setPatient(colab);
                    if (colab.assinatura) setSignatureUrl(colab.assinatura);
                } else {
                    console.warn('Colaborador não encontrado na tabela oficial. Verificando tabela legada...');
                    const { data: pat } = await supabase.from('patients').select('*').eq('id', assess.patient_id).maybeSingle();
                    setPatient(pat);
                    if (pat?.assinatura) setSignatureUrl(pat.assinatura);
                }
            }

            // 3. Load Questions & Options (Strict Join)
            const { data: qs, error: qError } = await supabase
                .from('questions')
                .select('*, question_options(*), categories(name)')
                .order('id', { ascending: true });

            if (qError) throw qError;

            console.log('Dados carregados (Perguntas + Opções):', qs);
            setQuestions(qs || []);

            // 4. Load Existing Answers
            const { data: ans } = await supabase.from('answers').select('*').eq('assessment_id', assessmentId);
            const ansMap = {};
            ans?.forEach(a => { ansMap[a.question_id] = a.answer_text; });
            setAnswers(ansMap);

        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerChange = async (q, val) => {
        setAnswers(prev => ({ ...prev, [q.id]: val }));

        if (validationErrors.includes(q.id)) {
            setValidationErrors(prev => prev.filter(id => id !== q.id));
        }

        try {
            let score = 0;
            if (q.type === 'yes_no' && val === 'Sim') score = q.weight || 0;
            if (q.type === 'scale' || q.type === 'select') {
                const opt = q.question_options?.find(o => String(o.text || o.label || o.value) === val);
                if (opt) {
                    score = opt.score_val || 0;
                    if (score === 0 && val !== '0' && /^\d+$/.test(val)) {
                        score = parseInt(val, 10);
                    }
                }
            }

            const { data: existing } = await supabase
                .from('answers')
                .select('id')
                .eq('assessment_id', assessmentId)
                .eq('question_id', q.id)
                .maybeSingle();

            if (existing) {
                await supabase.from('answers').update({
                    answer_text: String(val),
                    score
                }).eq('id', existing.id);
            } else {
                await supabase.from('answers').insert({
                    assessment_id: assessmentId,
                    question_id: q.id,
                    answer_text: String(val),
                    score
                });
            }
        } catch (err) {
            console.error('Auto-save error', err);
        }
    };

    const checkVisibility = (q) => {
        if (!q.depends_on_question_id) return true;
        const parentAns = answers[q.depends_on_question_id];
        return parentAns === q.show_if_value;
    };

    const handleSignatureSave = async (dataUrl) => {
        setSigLoading(true);
        try {
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            const fileName = `sig_${assessmentId}_${Date.now()}.png`;

            const { error: uploadError } = await supabase.storage
                .from('assinaturas')
                .upload(fileName, blob, { contentType: 'image/png', upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('assinaturas').getPublicUrl(fileName);

            // Salva a assinatura preferencialmente na tabela colaboradores
            if (patient && assessment?.patient_id) {
                await supabase.from('colaboradores').update({ assinatura: publicUrl }).eq('id', assessment.patient_id);
                // Também atualiza na tabela legada para compatibilidade, se necessário
                await supabase.from('patients').update({ assinatura: publicUrl }).eq('id', assessment.patient_id);
            }

            setSignatureUrl(publicUrl);
            setShowSigModal(false);
        } catch (err) {
            console.error(err);
            alert('Erro ao salvar assinatura. Tente novamente.');
        } finally {
            setSigLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!signatureUrl) {
            alert("É obrigatório assinar a declaração para enviar a resposta.");
            const el = document.getElementById('declaration-section');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        const visibleQuestions = questions.filter(checkVisibility);
        const missing = visibleQuestions.filter(q => q.required !== false && !answers[q.id]).map(q => q.id);

        if (missing.length > 0) {
            setValidationErrors(missing);
            const el = document.getElementById(`question-${missing[0]}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        if (!window.confirm('Deseja enviar suas respostas agora?')) return;

        setLoading(true);
        try {
            await supabase.from('assessments').update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                locked: true
            }).eq('id', assessmentId);
            setStatus('finished');
        } catch (err) {
            alert('Erro ao enviar: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingScreen />;
    if (status === 'locked') return <BlockedScreen />;
    if (status === 'finished') return <SuccessScreen />;
    if (error) return <BlockedScreen message={error} />;

    return (
        <div ref={topRef} className="min-h-screen bg-gradient-to-b from-[#f8fdfe] to-[#ccedf3] py-3 px-3 relative font-sans">
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap'); body { font-family: 'Roboto', sans-serif; }`}</style>

            <div className="max-w-[770px] mx-auto pb-20">
                {/* Logo Gama Center */}
                <div className="flex justify-start mb-6">
                    <img
                        src="/logo-gama.png?t=${Date.now()}"
                        alt="GAMA CENTER"
                        className="h-16 w-auto object-contain"
                        onError={(e) => {
                            e.target.src = '/logo-gama.png'; // Try without query if failed
                        }}
                    />
                </div>

                {/* Header Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 border-t-[10px] border-t-[#35b6cf] p-6 mb-3 relative overflow-hidden">
                    <h1 className="text-[24px] md:text-[32px] font-normal text-slate-900 mb-6 mt-2 leading-tight">
                        Levantamento Preliminar Psicossocial - {patient?.unidade?.nome_unidade || 'Fábrica Criativa'}
                    </h1>

                    {patient && (
                        <div className="bg-[#e8f0fe] rounded-lg p-4 border border-[#e8f0fe] flex items-center gap-4 transition-all">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-slate-100">
                                <User size={20} className="text-[#35b6cf]" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-[#1f2937] text-[15px] truncate">
                                    {patient.nome || patient.name || 'Colaborador'}
                                </div>
                                <div className="text-[#6b7280] text-[12px] mt-1">
                                    {patient.unidade?.nome_unidade || 'Unidade não informada'}
                                    {patient.cpf && <span> (CPF: {patient.cpf})</span>}
                                </div>
                            </div>
                        </div>
                    )}

                    <p className="text-[12px] text-red-600 mt-6 pt-4 border-t border-slate-100">* Indica pergunta obrigatória</p>
                </div>

                {/* Questions List */}
                {questions.map((q) => {
                    if (!checkVisibility(q)) return null;
                    return (
                        <QuestionCard
                            key={q.id}
                            question={q}
                            answer={answers[q.id]}
                            onAnswer={(val) => handleAnswerChange(q, val)}
                            error={validationErrors.includes(q.id)}
                        />
                    );
                })}

                {/* Declaration Section */}
                {patient && (
                    <div id="declaration-section" className="bg-white rounded-xl shadow-sm border border-slate-200 px-8 py-8 mb-6 mt-8">
                        <p className="text-[14px] text-slate-800 leading-relaxed text-justify">
                            Eu, <span className="border-b border-slate-400 px-2 font-bold inline-block min-w-[200px] text-center">{patient.nome || patient.name || '______________________'}</span>,
                            portador do documento de identificação <span className="border-b border-slate-400 px-2 font-bold inline-block min-w-[120px] text-center">{patient.cpf || '_________________'}</span>,
                            mediante a assinatura abaixo, declaro serem verdadeiras todas as informações por mim relatadas nesta avaliação.
                        </p>

                        <div className="mt-12 flex flex-col items-center">
                            {signatureUrl ? (
                                <div className="flex flex-col items-center animate-in zoom-in-50">
                                    <img src={signatureUrl} alt="Assinatura" className="h-16 object-contain mb-2" />
                                    <div className="border-b border-slate-800 w-full max-w-xs mb-1"></div>
                                    <p className="text-sm text-slate-500 mb-4">Assinatura Digital Registrada</p>
                                    <button onClick={() => setShowSigModal(true)} className="text-xs text-[#35b6cf] hover:underline">
                                        Alterar assinatura
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center w-full">
                                    <button
                                        onClick={() => setShowSigModal(true)}
                                        className="bg-slate-800 text-white px-6 py-3 rounded-lg shadow hover:bg-slate-700 transition-all flex items-center gap-2 mb-2"
                                    >
                                        <div className="w-5 h-5 border border-white rounded-sm"></div>
                                        Clique para Assinar
                                    </button>
                                    <p className="text-xs text-red-500 mt-2">* Obrigatório para envio</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <SignatureModal
                    isOpen={showSigModal}
                    onClose={() => setShowSigModal(false)}
                    onSave={handleSignatureSave}
                    loading={sigLoading}
                />

                {/* Footer Buttons */}
                <div className="flex justify-between items-center mt-6">
                    <button
                        onClick={handleSubmit}
                        className="bg-[#35b6cf] text-white px-8 py-2.5 rounded hover:bg-[#2da9c0] shadow-sm transition-colors font-medium text-[14px]"
                    >
                        Enviar
                    </button>

                    <div className="text-[14px] text-slate-600 cursor-pointer hover:bg-slate-100 px-3 py-1.5 rounded transition-colors" onClick={() => { if (window.confirm('Limpar todas as respostas?')) setAnswers({}); }}>
                        Limpar formulário
                    </div>
                </div>

                <div className="text-center mt-12 text-[12px] text-slate-500 leading-relaxed">
                    Este conteúdo não foi criado nem aprovado pela CorpEd Psicologia. <br />
                    <span className="underline cursor-pointer">Denunciar abuso</span> -
                    <span className="underline cursor-pointer ml-1">Termos de Serviço</span> -
                    <span className="underline cursor-pointer ml-1">Política de Privacidade</span>
                </div>
                <div className="text-center mt-4 text-[#70757a] text-[22px] font-normal" style={{ fontFamily: "'Google Sans', Roboto, Arial, sans-serif" }}>
                    Formulários
                </div>

            </div>

            {/* Scroll to Top Button */}
            {showScrollTop && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-6 right-6 bg-[#35b6cf] text-white p-3 rounded-full shadow-lg hover:bg-[#2da9c0] transition-all duration-300 animate-in fade-in zoom-in-75 z-50 flex items-center justify-center group"
                    aria-label="Voltar ao topo"
                >
                    <ChevronUp size={24} className="group-hover:-translate-y-1 transition-transform" />
                </button>
            )}
        </div>
    );
};

export default FormularioPublico;
