
// Lógica para gerar o relatório narrativo no lado do cliente (Frontend)
// Substitui a antiga função 'get_narrative_report' que rodava no banco de dados (RPC)
// Recebe os dados do exame (assessment), as respostas (answers) e a definição das perguntas (questions)
export const generateNarrative = (assessment, answers, questions) => {

    // 1. Definição das Categorias de Análise
    // Criamos um array de objetos onde cada categoria tem um nome amigável (key) 
    // e as chaves correspondentes que podem vir do banco de dados (dbKeys)
    const categories = [
        { key: 'Insatisfação Pessoal', dbKeys: ['insatisfacaopessoal', 'satisfacaopessoal'] },
        { key: 'Ansiedade', dbKeys: ['ansiedade'] },
        { key: 'Depressão', dbKeys: ['depressao'] },
        { key: 'Álcool', dbKeys: ['alcool'] },
        { key: 'Fumo', dbKeys: ['fumo'] },
        { key: 'Drogas ou Remédios', dbKeys: ['drogas', 'drogasouremédios'] },
        { key: 'Sono', dbKeys: ['sono'] }
    ];

    // Inicializa o objeto de pontuações (scores) com zero para cada categoria definida acima
    const scores = {};
    categories.forEach(c => scores[c.key] = 0);

    // Mapeamento de Perguntas para Categorias
    // Criamos um dicionário (objeto) para saber rapidamente a qual categoria pertence cada ID de pergunta
    const questionCategoryMap = {};
    if (questions) {
        // Percorre a lista de perguntas vindas do banco de dados
        questions.forEach(q => {
            // Tenta obter o nome da categoria de diferentes campos possíveis na estrutura do banco
            const cat = q.category_key || q.categories?.name || q.category;
            // Se encontrar a categoria, salva no mapa associando ao ID da pergunta, normalizando o texto (sem acentos e minúsculo)
            if (cat) questionCategoryMap[q.id] = normalizeStr(cat);
        });
    }

    // Processamento das Respostas do Paciente
    if (answers) {
        // Percorre cada resposta dada pelo paciente no formulário
        answers.forEach(ans => {
            // Pega o ID da pergunta referente a esta resposta específica
            const qId = ans.question_id;
            // Busca no mapa qual categoria essa pergunta pertence
            const normCat = questionCategoryMap[qId];
            // Se não houver categoria mapeada, ignora esta resposta e pula para a próxima
            if (!normCat) return;

            // Encontra a categoria correspondente no nosso array 'categories' inicial
            // Comparamos a categoria da pergunta com as 'dbKeys' permitidas para cada grupo
            const matchedCat = categories.find(c => c.dbKeys.some(k => normalizeStr(k) === normCat || normCat.includes(normalizeStr(k))));

            // Se encontrarmos um grupo compatível (ex: a pergunta pertence a 'Ansiedade')
            if (matchedCat) {
                // Soma o valor da pontuação (score) da resposta ao acumulador daquela categoria
                scores[matchedCat.key] += Number(ans.score) || 0;
            }
        });

        // 1.1 Normalização das Pontuações (Teto de 30 pontos)
        // Como cada questionário tem um número diferente de perguntas, os totais brutos variam.
        // O cliente solicitou que todos os resultados sejam convertidos para uma escala de 0 a 10.
        // Fator de Conversão = 10 dividido pela Pontuação Máxima Possível da categoria.
        const finalFactors = {
            'Insatisfação Pessoal': 10 / 24,   // 12 itens com peso 2 cada = 24 total. 10/24 = 0.416 de peso por ponto bruto.
            'Ansiedade': 10 / 32,             // 16 itens com peso 2 cada = 32 total.
            'Depressão': 10 / 36,             // 18 itens com peso 2 cada = 36 total.
            'Álcool': 10 / 38,                // O Teste AUDIT tem máximo de 38 pontos.
            'Drogas ou Remédios': 10 / 20,    // Baseado em 10 perguntas ou peso total 20.
            'Sono': 10 / 10,                  // 5 itens com peso 2 cada = 10 total. 10/10 = 1 ponto bruto = 1 ponto escala.
            'Fumo': 10 / 14                   // 7 itens ou peso total 14 conforme estrutura do banco.
        };

        // Aplica o fator de multiplicação em cada categoria para normalizar os dados
        Object.keys(scores).forEach(key => {
            if (finalFactors[key]) {
                // Multiplica o score bruto pelo fator para chegar no valor entre 0 e 10
                scores[key] = scores[key] * finalFactors[key];
            }
        });
    }

    // 2. Geração do Texto de Análise (Linguagem Natural)
    // Aqui transformamos números em parágrafos explicativos para o laudo.

    // Introdução padrão do documento (Ajustado para "psicossocial" conforme imagem)
    const intro = "O paciente foi submetido à avaliação psicossocial para verificação de seu estado de saúde mental, como condição necessária à realização do trabalho.";

    // Função auxiliar para determinar a intensidade baseada na escala de 0 a 10
    const getIntensity = (score) => {
        const s = Number(score) || 0;
        if (s === 0) return 'nula';
        if (s <= 4.5) return 'baixa';
        if (s <= 7.5) return 'moderada';
        return 'intensa';
    };

    // ----- PARÁGRAFO 1: SAÚDE MENTAL (Psicoemocional) -----
    // Extrai scores específicos
    const scoreInsat = scores['Insatisfação Pessoal'] || 0;
    const scoreAnxiety = scores['Ansiedade'] || 0;
    const scoreDepression = scores['Depressão'] || 0;

    // Lógica para descrever o nível de satisfação com a vida (Total fidelidade à imagem)
    let insatPhrase = '';
    if (scoreInsat > 22.5) insatPhrase = 'relatou insatisfação significativa com sua vida atual';
    else if (scoreInsat > 15) insatPhrase = 'relatou insatisfação moderada com sua vida atual';
    else if (scoreInsat > 7.5) insatPhrase = 'relatou leve insatisfação com sua vida atual';
    else insatPhrase = 'relatou estar satisfeito com sua vida atual';


    // Lógica para descrever a presença de ansiedade (PHQ-4 / GAD-2)
     let anxietyPhrase = '';
    if (scoreAnxiety > 24) anxietyPhrase = 'O paciente possui alta possibilidade de apresentar transtornos de ansiedade';
    else if (scoreAnxiety > 12) anxietyPhrase = 'O paciente possui moderada possibilidade de apresentar transtornos de ansiedade';
    else if (scoreAnxiety > 6) anxietyPhrase = 'O paciente possui leve possibilidade de apresentar transtornos de ansiedade';
    else anxietyPhrase = 'O paciente não manifestou possibilidade de apresentar transtornos de ansiedade';

    // Lógica para descrever a presença de depressão (PHQ-4 / PHQ-2)
   let depressionPhrase = '';
    if (scoreDepression > 27) depressionPhrase = 'O paciente possui alta possibilidade de desenvolver depressão';
    else if (scoreDepression > 18) depressionPhrase = 'O paciente possui moderada possibilidade de desenvolver depressão';
    else if (scoreDepression > 9) depressionPhrase = 'O paciente possui leve possibilidade de desenvolver depressão';
    else depressionPhrase = 'O paciente não manifestou possibilidade de desenvolver depressão';

    // Concatena as frases acima em um texto corrido focado em saúde mental
    const mentalText =
        `Durante o período da avaliação, foi possível identificar que o paciente ${insatPhrase}. ` +
        `${anxietyPhrase}${depressionPhrase}.`;


    // ----- PARÁGRAFO 2: HÁBITOS E ESTILO DE VIDA -----
    const scoreAlcohol = scores['Álcool'] || 0;
    const scoreDrugs = scores['Drogas ou Remédios'] || 0;
    const scoreSmoke = scores['Fumo'] || 0;
    const scoreSleep = scores['Sono'] || 0;

    // Descrição do consumo de Álcool e Drogas (Unificado conforme imagem 1693)
     let alcoholPhrase = '';
    if (scoreAlcohol >= 15.79) alcoholPhrase = 'relatou consumo frequente e substancial de bebidas alcoólicas';
    else if (scoreAlcohol >= 6.31) alcoholPhrase = "relatou consumo cotidiano e moderado de bebidas alcoólicas";
    else if (scoreAlcohol > 0) alcoholPhrase = 'relatou consumo social ou ocasional de bebidas alcoólicas';
    else alcoholPhrase = 'relatou não fazer uso ou fazer uso mínimo/eventual de bebidas alcoólicas';
  
    let drugsPhrase = '';
    if (scoreDrugs >= 9) drugsPhrase = 'faz uso recorrente de drogas ilícitas ou medicamentos não prescritos';
    else if (scoreDrugs > 0) drugsPhrase = 'faz uso de algum medicamento não prescrito ou substância ilícita de forma recreativa';
    else drugsPhrase = 'declarou não fazer uso de nenhum tipo de droga';

    // Descrição do hábito de fumar (Tabagismo)
    let smokePhrase = '';
    if (scoreSmoke >= 10.5) smokePhrase = 'apresenta dependência intensa ao tabaco';
    else if (scoreSmoke > 0) smokePhrase = `apresenta dependência ${getIntensity(scoreSmoke)} ao fumo`;
    else smokePhrase = 'declarou não ser fumante';

    // Descrição da qualidade do sono
   let sleepPhrase = '';
    if (scoreSleep >= 24) sleepPhrase = 'apresenta distúrbios graves do sono, com impacto na qualidade de vida';
    else if (scoreSleep >= 18) sleepPhrase = 'apresenta alterações relevantes no padrão de sono';
    else if (scoreSleep > 6) sleepPhrase = 'apresenta algumas alterações leves no sono';
    else sleepPhrase = 'apresenta sono regular e sem intercorrências';

    // Concatena as frases de hábitos em um parágrafo estruturado
    const habitsText =
        `Em relação aos hábitos e estilo de vida, o colaborador ${alcoholPhrase}. ` +
        `Quanto ao uso de substâncias, ${drugsPhrase}. ` +
        `No que diz respeito ao fumo, ${smokePhrase}. ` +
        `Sobre o padrão de sono, ${sleepPhrase}.`;

    // ----- PARÁGRAFO 3: CONCLUSÃO E PARECER FINAL -----
    // Critérios para determinar se o paciente deve ser sinalizado com risco severo
    // Os limites (thresholds) abaixo são os pontos de corte na escala de 0 a 30
    const hasSevereFlags =
        scoreDepression > 7.5 || // Corte de depressão moderada/alta (13.33 / 3)
        scoreAnxiety > 7.5 ||    // Corte de ansiedade moderada/alta (9.375 / 3)
        scoreAlcohol >= 7.5;     // Corte de consumo abusivo de álcool (15.79 / 3)

    // Define o texto conclusivo (Sem prefixos, para ser colado nos hábitos)
    const conclusionText = hasSevereFlags
        ? 'Com base nos dados coletados, foram identificados indicadores de risco relevantes e inconclusivos quanto à aptidão do paciente para o trabalho. Recomenda-se uma avaliação complementar com o médico do trabalho responsável pelo PCMSO'
        : 'O paciente apresenta, nesta avaliação, condições psicológicas compatíveis com suas atividades. Este parecer não é conclusivo quanto à aptidão, sendo essa responsabilidade do médico do trabalho.';

    // 4. Aviso de Responsabilidade (Disclaimer - Separado em duas frases como na imagem)
    const disclaimer = "Lembre-se que este teste por si só não pode diagnosticar uma patologia, mas pode indicar a presença de sintomas.\n\n";

    // Montagem final do Laudo em 4 blocos distintos (Fiel à imagem 1693)
    // Bloco 1: Intro
    // Bloco 2: Saúde Mental
    // Bloco 3: Hábitos + Conclusão (unidos por espaço)
    // Bloco 4: Disclaimer
    const full_analysis = [
        intro, 
        mentalText, 
        habitsText + " " + conclusionText, 
        disclaimer
    ].filter(Boolean).join("\n\n");

    // Retorna um objeto completo contendo todas as variáveis calculadas e textos gerados
    return {
        intro,
        full_analysis,
        disclaimer,

        // Mantemos campos legados (narrative, mental_text...) para garantir que o gerador de PDF continue funcionando sem erros
        narrative: full_analysis,
        mental_text: mentalText,
        habits_text: habitsText
    };
};

// Função Utilitária: Normalização de Strings
// Remove acentos (diacríticos), converte para minúsculo e remove espaços extras.
// Isso garante que "Álcool", "alcool" e "ÁLCOOL " sejam interpretados como a mesma categoria.
const normalizeStr = (str) => {
    if (!str) return '';
    // normalize("NFD") separa o acento da letra, e o RegEx remove os "pedaços" de acento
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};
