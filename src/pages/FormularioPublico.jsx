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
            <h1 className="text-2xl font-normal text-slate-800 mb-6">Avaliação Psicológica</h1>
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
                                value: String(opt.text || opt.label || opt.value),
                                label: String(opt.text || opt.label || opt.value)
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
                // Busca os dados do paciente exclusivamente na tabela 'patients', conforme solicitado
                // Busca os dados do paciente com joins profundos para obter CPF, Unidade e Empresa
                const { data: pat, error: patError } = await supabase
                    .from('patients')
                    // Join complexo: Patients -> Colaboradores -> Unidade -> Clientes (Empresa)
                    .select('*, colaboradores:uuid_colab(cpf, unidade(nome_unidade, clientes:empresaid(nome_fantasia)))')
                    .eq('uuid_colab', assess.patient_id)
                    .maybeSingle();

                // Verifica se o paciente foi encontrado
                if (pat) {
                    // Armazena os dados do paciente no estado do componente
                    setPatient(pat);
                    // Caso o paciente já possua uma assinatura, atualiza a url no estado
                    if (pat.assinatura) setSignatureUrl(pat.assinatura);
                } else {
                    // Exibe um aviso no console caso os dados do paciente não sejam encontrados
                    console.warn('Paciente não encontrado na tabela patients.');
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
            if (['scale', 'select', 'yes_no'].includes(q.type)) {
                // Busca a opção correspondente usando a mesma ordem de prioridade da renderização (text > label > value)
                const opt = q.question_options?.find(o => String(o.text || o.label || o.value) === val);
                
                if (opt) {
                    // Se encontrou a opção, usa o score_val definido no banco
                    score = Number(opt.score_val) || 0;
                } else if (q.type === 'yes_no') {
                    // Fallback apenas para yes_no caso as opções não tenham carregado (usa o peso da pergunta)
                    score = (val === 'Sim') ? (Number(q.weight) || 0) : 0;
                } else if (score === 0 && val !== '0' && /^\d+$/.test(val)) {
                    // Fallback para valores numéricos diretos se não houver mapeamento de opção
                    score = parseInt(val, 10);
                }
            }

            const { data: existing } = await supabase
                .from('answers')
                .select('id')
                .eq('assessment_id', assessmentId)
                .eq('question_id', q.id)
                .maybeSingle();

            // Verifica se a resposta já existe no banco de dados para decidir entre update ou insert
            if (existing) {
                // Define o objeto com os dados a serem atualizados (texto da resposta e pontuação calculada)
                const payload = {
                    answer_text: String(val),
                    score
                };
                // Gera um log detalhado no console para depuração, mostrando o destino, filtros e os dados enviados
                console.log("Atualizando resposta na tabela 'answers':", {
                    destino: 'answers',
                    filtro: { id: existing.id },
                    payload
                });
                // Executa a atualização na tabela 'answers' filtrando pelo ID do registro existente
                await supabase.from('answers').update(payload).eq('id', existing.id);
                console.log(`✅ [Sucesso] Resposta atualizada com sucesso no banco de dados. (Questão ID: ${q.id})`);
            } else {
                // Define o objeto com os dados para uma nova inserção (ID da avaliação, ID da pergunta, resposta e pontuação)
                const payload = {
                    assessment_id: assessmentId,
                    question_id: q.id,
                    answer_text: String(val),
                    score
                };
                // Gera um log descritivo indicando a inserção de uma nova resposta e os dados contidos nela
                console.log("Inserindo nova resposta na tabela 'answers':", {
                    destino: 'answers',
                    payload
                });
                // Realiza a inserção do novo registro na tabela 'answers'
                await supabase.from('answers').insert(payload);
                console.log(`✅ [Sucesso] Nova resposta inserida com sucesso no banco de dados. (Questão ID: ${q.id})`);
            }
        } catch (err) {
            console.error(`❌ [Erro CRUD] Falha ao salvar a resposta (Questão ID: ${q?.id}). Detalhes do erro:`, err);
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
            // Define o caminho completo dentro do bucket, incluindo a pasta 'assinaturas'
            const filePath = `assinaturas/${fileName}`;

            // 1. Upload para o Supabase Storage (Bucket 'assinaturas', Pasta 'assinaturas')
            const { error: uploadError } = await supabase.storage
                .from('assinaturas')
                .upload(filePath, blob, { contentType: 'image/png', upsert: true });

            if (uploadError) throw uploadError;

            // 2. Obtém a URL pública usando o caminho completo (incluindo a pasta)
            const { data: { publicUrl } } = supabase.storage.from('assinaturas').getPublicUrl(filePath);

            // 3. Salva a assinatura exclusivamente na tabela patients para centralizar os dados do colaborador
            if (patient && assessment?.patient_id) {
                // Cria o payload contendo apenas a URL pública da imagem da assinatura (agora com o caminho da pasta)
                const payload = { assinatura: publicUrl };
                // Registra no log o início do salvamento da assinatura, informando tabela, filtro e payload
                console.log("Salvando URL da assinatura (com pasta) na tabela 'patients':", {
                    destino: 'patients',
                    filtro: { uuid_colab: assessment.patient_id },
                    payload
                });
                // Atualiza a assinatura na tabela 'patients' usando uuid_colab como filtro
                await supabase.from('patients')
                    .update(payload)
                    // Importante: Filtra por uuid_colab pois o patient_id da avaliação é um UUID
                    .eq('uuid_colab', assessment.patient_id);
                
                console.log("✅ [Sucesso] Assinatura salva no bucket e vinculada ao paciente com sucesso.");
            }

            setSignatureUrl(dataUrl);
            setShowSigModal(false);
        } catch (err) {
            console.error("❌ [Erro CRUD] Falha ao fazer upload da assinatura ou vincular ao paciente. Detalhes do erro:", err);
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

        // Define o estado de carregamento como true para fornecer feedback visual ao usuário durante o processamento
        setLoading(true);
        try {
            // Prepara os dados de conclusão da avaliação, incluindo status, data e bloqueio de edições futuras
            const assessmentPayload = {
                status: 'completed',
                completed_at: new Date().toISOString(),
                locked: true
            };
            // Registra um log detalhado do envio para a tabela de avaliações, facilitando o rastreio da operação
            console.log("Enviando atualização de avaliação para a tabela 'assessments':", {
                destino: 'assessments',
                filtro: { id: assessmentId },
                payload: assessmentPayload
            });

            // Realiza a atualização do registro da avaliação no Supabase para marcar como concluída
            await supabase.from('assessments').update(assessmentPayload).eq('id', assessmentId);

            // Verifica se existe um ID de paciente vinculado para atualizar seu status na listagem principal
            if (assessment?.patient_id) {
                // Define o novo status do paciente como "Respondido" conforme solicitado
                const patientPayload = {
                    status: 'Respondido'
                };
                // Registra um log descritivo da atualização do status do paciente para a tabela 'patients'
                console.log("Enviando atualização de status do paciente para a tabela 'patients':", {
                    destino: 'patients',
                    filtro: { uuid_colab: assessment.patient_id },
                    payload: patientPayload
                });

                // Executa a atualização do status na tabela de pacientes usando o UUID como filtro
                await supabase.from('patients').update(patientPayload).eq('uuid_colab', assessment.patient_id);
            }

            console.log("✅ [Sucesso] O Formulário Completo foi processado. Todas as respostas enviadas com sucesso e status atualizado.");

            // Altera o estado de status local para 'finished' para renderizar a tela de sucesso
            setStatus('finished');
        } catch (err) {
            // Em caso de erro na requisição, exibe um alerta contendo a mensagem de erro detalhada
            console.error("❌ [Erro CRUD] Falha ao enviar o formulário e finalizar a avaliação. Detalhes do erro:", err);
            alert('Erro ao enviar: ' + err.message);
        } finally {
            // Independentemente do sucesso ou erro, desativa o indicador de carregamento
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
                        Avaliação Psicológica - {patient?.colaboradores?.unidade?.clientes?.nome_fantasia || ''}
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
                                    {(patient.colaboradores?.cpf || patient.cpf) && <span> (CPF: {patient.colaboradores?.cpf || patient.cpf})</span>}
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
                            portador do documento de identificação <span className="border-b border-slate-400 px-2 font-bold inline-block min-w-[120px] text-center">{patient.colaboradores?.cpf || patient.cpf || '_________________'}</span>,
                            mediante a assinatura abaixo, declaro serem verdadeiras todas as informações por mim relatadas nesta avaliação.
                        </p>

                        <div className="mt-12 flex flex-col items-center">
                            {signatureUrl ? (
                                <div className="flex flex-col items-center animate-in zoom-in-50">
                                    <div className="bg-slate-50 p-2 rounded border border-slate-100 mb-2">
                                        <img src={signatureUrl} alt="Assinatura" className="h-16 object-contain" />
                                    </div>
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
