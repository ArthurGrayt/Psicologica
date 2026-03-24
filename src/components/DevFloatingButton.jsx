import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Bug, UserPlus, Edit3, X, Loader2, Play } from 'lucide-react';

// ID do usuário mestre autorizado a ver o botão
const MASTER_USER_ID = "9cff7ed7-00b3-41d9-99e1-f235c5de9174";

// Componente do botão flutuante para testes
const DevFloatingButton = () => {
    // Estado para armazenar se o usuário está autorizado
    const [isAuthorized, setIsAuthorized] = useState(false);
    // Estado para controlar se o menu está aberto
    const [isOpen, setIsOpen] = useState(false);
    // Estado para controlar o carregamento das ações manuais
    const [isLoading, setIsLoading] = useState(false);

    // Efeito para verificar o usuário logado ao montar o componente
    useEffect(() => {
        // Função assíncrona para buscar a sessão do usuário
        const checkUser = async () => {
            try {
                // Busca a sessão atual no Supabase
                const { data: { session } } = await supabase.auth.getSession();
                
                // Busca o usuário atual para garantir que pegamos a info correta
                const { data: { user } } = await supabase.auth.getUser();

                // Console logs estruturados para debug da autorização do float button
                console.log("[DEV_FLOAT] Verificando Autorização do Painel de Testes...");
                console.log("[DEV_FLOAT] UUID Requisitado (Master):", MASTER_USER_ID);
                console.log("[DEV_FLOAT] UUID Detectado na Sessão:", session?.user?.id || "Nenhum/Não Logado");
                console.log("[DEV_FLOAT] UUID Detectado via GetUser:", user?.id || "Nenhum/Não Logado");

                // Verifica se o ID bate com a regra do prompt (Arthur Ribeiro)
                if (user?.id === MASTER_USER_ID || session?.user?.id === MASTER_USER_ID) {
                    // Se for o usuário correto, autoriza a exibição do botão
                    console.log("[DEV_FLOAT] Acesso Autorizado! Mostrando botão.");
                    setIsAuthorized(true);
                } else {
                    // Aqui mantemos a segurança, mas avisamos o admin no F12 do porquê o componente não está visível
                    console.warn("[DEV_FLOAT] Acesso Negado: Você não está logado ou não possui o UUID correspondente à conta de 'Arthur Ribeiro'.");
                }
            } catch (err) {
                console.error("[DEV_FLOAT] Erro ao validar Auth:", err);
            }
        };
        // Executa a função
        checkUser();
    }, []);

    // Função para gerar um paciente aleatório e uma avaliação concluída
    const handleGenerateFakePatient = async () => {
        // [DEBUG] Monitoramento de execução para capturar disparos automáticos indevidos
        console.log("[DEV_FLOAT] handleGenerateFakePatient foi acionado.");
        console.trace("[DEV_FLOAT] Rastro da chamada:");

        // Guarda de segurança extra: Verifica novamente o ID do usuário antes de proceder com a inserção no banco
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id !== MASTER_USER_ID) {
            console.error("[DEV_FLOAT] Tentativa de execução não autorizada barrada.");
            return;
        }

        // Evita múltiplas requisições simultâneas definindo loading como true
        setIsLoading(true);
        try {
            // Gera um número aleatório de 6 dígitos para garantir um nome único
            const randomCode = Math.floor(100000 + Math.random() * 900000);
            // Define o nome do colaborador fake com base no código
            const fakeName = `Paciente Teste ${randomCode}`;

            // Define o payload para criar o colaborador na tabela 'colaboradores' (mockando unidade 1 como padrão)
            const collabPayload = {
                nome: fakeName,
                unidade: 1,
                avulso: true,
                cpf: "000.000.000-00",
                sexo: "M"
            };

            // Insere o novo colaborador fake no Supabase
            const { data: collabData, error: collabError } = await supabase
                .from('colaboradores')
                .insert(collabPayload)
                .select()
                .single();

            // Se der erro na inclusão do colaborador, lança uma exceção
            if (collabError) throw collabError;

            // Insere os dados na tabela 'patients' para exibir no dashboard
            const { error: patientError } = await supabase
                .from('patients')
                .insert({
                    uuid_colab: collabData.id,
                    name: collabData.nome,
                    status: 'Respondido', // Já colocamos como respondido para facilitar os testes
                    assinatura: 'https://placehold.co/320x180.png?text=Assinatura+Teste' // mock de url de assinatura
                });

            // Se der erro, lança exceção
            if (patientError) throw patientError;

            // Cria uma avaliação finalizada para esse paciente
            const { data: assessData, error: assessError } = await supabase
                .from('assessments')
                .insert({
                    patient_id: collabData.id,
                    status: 'completed',
                    locked: true,
                    created_at: new Date().toISOString(),
                    completed_at: new Date().toISOString()
                })
                .select()
                .single();

            // Lança exceção se falhar a criação da avaliação
            if (assessError) throw assessError;

            // Busca todas as perguntas cadastradas no banco para poder gerar respostas fakes
            const { data: questions, error: qError } = await supabase
                .from('questions')
                .select('id, type, weight, question_options(*)');

            // Lança exceção se falhar a busca das perguntas
            if (qError) throw qError;

            // Cria um array para armazenar os payloads dinâmicos das respostas de cada pergunta
            const answersToInsert = [];

            // Itera pelas questões encontradas para anexar respostas aleatórias ou mockadas
            if (questions) {
                // Para cada pergunta, verifica que tipo de resposta aceita
                for (const q of questions) {
                    // Valor e pontuação (score) a serem preenchidos
                    let answerVal = 'Teste';
                    let scoreVal = 0;

                    // Se a pergunta for do tipo Yes/No
                    if (q.type === 'yes_no') {
                        // Define aleatoriamente 50% de chance para Sim ou Não
                        const isYes = Math.random() > 0.5;
                        // Seta o valor string
                        answerVal = isYes ? 'Sim' : 'Não';
                        // Seta o score apenas se for Sim (padrão do sistema)
                        scoreVal = isYes ? (Number(q.weight) || 0) : 0;
                    } 
                    // Se for scale/select e tiver opções no banco
                    else if ((q.type === 'scale' || q.type === 'select') && q.question_options?.length > 0) {
                        // Escolhe uma opção TOTALMENTE ALEATÓRIA do banco
                        const randomIndex = Math.floor(Math.random() * q.question_options.length);
                        const randomOpt = q.question_options[randomIndex];
                        // Seta o valor da resposta mockada tentando campos comuns
                        answerVal = String(randomOpt.text || randomOpt.label || randomOpt.value || 'Opção Teste');
                        // Associa sua pontuação correspondente
                        scoreVal = Number(randomOpt.score_val) || 0;
                    } 
                    // Se a pergunta for textual livre
                    else if (q.type === 'text') {
                        // Simula texto inserido
                        answerVal = 'Resposta auto inserida por DevTool';
                    }

                    // Monta o objeto de resposta para enviar ao banco
                    answersToInsert.push({
                        assessment_id: assessData.id,
                        question_id: q.id,
                        answer_text: answerVal,
                        score: scoreVal
                    });
                }

                // Efetua a inserção na tabela 'answers' em batch (todas de umavez)
                if (answersToInsert.length > 0) {
                    const { error: ansError } = await supabase.from('answers').insert(answersToInsert);
                    // Lança a exceção caso falhe
                    if (ansError) throw ansError;
                }
            }

            // Exibe alertam de sucesso para o dev (Nesse caso o alert é aceitável, pois é painel de dev interno)
            alert(`Paciente Teste '${collabData.nome}' criado com respostas simuladas e finalizado! Recarregue a página.`);
            // Esconde o painel do menu DEV automaticamente
            setIsOpen(false);
        } catch (error) {
            // Emite um log descritivo se houver erro
            console.error("Erro no Auto-Test:", error);
            // Mostra o erro formal para o usuário
            alert(`Falha: ${error.message || 'Erro Desconhecido'}`);
        } finally {
            // Volta a flag de loading para falso para limpar os botões
            setIsLoading(false);
        }
    };

    // Se o usuário não for autorizado (não bater o ID do dev), não renderiza nada
    if (!isAuthorized) return null;

    // Retorna a representação JSX do Botão Float, caso seja o UUID esperado
    return (
        <div className="fixed bottom-28 xl:bottom-6 right-6 z-[9999] flex flex-col items-end pointer-events-auto">
            {/* Menu Dropup - Aberto condicionalmente baseado na var isOpen */}
            {isOpen && (
                <div className="mb-4 bg-white rounded-xl shadow-2xl border-2 border-indigo-500 overflow-hidden w-64 animate-in slide-in-from-bottom-5">
                    {/* Header do Menu Dev */}
                    <div className="bg-indigo-600 px-4 py-3 flex items-center justify-between text-white">
                        <div className="font-bold text-sm tracking-wide flex items-center gap-2">
                            <Bug size={16} /> 
                            {/* Texto informativo */}
                            [ DEV TOOLS ]
                        </div>
                        {/* Botão de Fechar X superior */}
                        <button onClick={() => setIsOpen(false)} className="hover:bg-indigo-500 rounded p-1 transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                    {/* Corpo com a listagem de operações que podemos simular */}
                    <div className="p-2 flex flex-col gap-1">
                        {/* Botão primário para Autogeração */}
                        <button 
                            disabled={isLoading}
                            onClick={handleGenerateFakePatient}
                            className="w-full text-left px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg flex items-center gap-3 transition-colors disabled:opacity-50"
                        >
                            {/* Renderização condicional para ícone de loading quando estiver processando */}
                            {isLoading ? <Loader2 size={18} className="animate-spin text-indigo-500" /> : <Play size={18} className="text-indigo-500" />}
                            Gerar Paciente Teste + Respostas 100%
                        </button>
                        <div className="border-t border-slate-100 my-1"></div>
                        {/* Aviso de utilidade do botão */}
                        <p className="text-[10px] text-slate-400 text-center uppercase p-2">
                            Ação cria um paciente novo resolvendo as constraints do banco automático.
                        </p>
                    </div>
                </div>
            )}

            {/* Float Button Round Effect, é o gatilho principal */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-center rounded-full shadow-xl transition-all duration-300 ${
                    isOpen ? 'bg-indigo-700 rotate-90 w-14 h-14' : 'bg-indigo-600 hover:-translate-y-1 w-14 h-14'
                }`}
                aria-label="Toggle Developer Tools"
            >
                {/* Oculta ou mostra o ícone de Bug */}
                {isOpen ? (
                    <X size={24} className="text-white" />
                ) : (
                    <Bug size={24} className="text-white" />
                )}
            </button>
        </div>
    );
};

// Exportamos o componente como padrão
export default DevFloatingButton;
