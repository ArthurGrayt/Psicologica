
export const generateNarrative = (assessment, answers, questions, dynamicConfigs = null) => {
    // 1. Definição das Categorias de Análise
    // ... (logic for scores initialization remains same)
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
    const questionCategoryMap = {};
    if (questions) {
        questions.forEach(q => {
            const cat = q.category_key || q.categories?.name || q.category;
            if (cat) questionCategoryMap[q.id] = normalizeStr(cat);
        });
    }

    // Processamento das Respostas do Paciente
    if (answers) {
        answers.forEach(ans => {
            const qId = ans.question_id;
            const normCat = questionCategoryMap[qId];
            if (!normCat) return;

            const matchedCat = categories.find(c => c.dbKeys.some(k => normalizeStr(k) === normCat || normCat.includes(normalizeStr(k))));
            if (matchedCat) {
                scores[matchedCat.key] += Number(ans.score) || 0;
            }
        });

        // 1.1 Normalização das Pontuações (Teto de 10 pontos)
        const finalFactors = {
            'Insatisfação Pessoal': 10 / 24,
            'Ansiedade': 10 / 32,
            'Depressão': 10 / 36,
            'Álcool': 10 / 38,
            'Drogas ou Remédios': 10 / 20,
            'Sono': 10 / 10,
            'Fumo': 10 / 14
        };

        Object.keys(scores).forEach(key => {
            if (finalFactors[key]) {
                scores[key] = scores[key] * finalFactors[key];
            }
        });
    }

    // Helper: Função para buscar o texto baseado no score e na configuração dinâmica (se existir)
    const getDynamicText = (categoryKey, score, fallbacks) => {
        // Se houver configurações dinâmicas para esta categoria, tenta usá-las
        if (dynamicConfigs && dynamicConfigs[categoryKey]) {
            // Ordena os thresholds do maior para o menor para pegar a primeira faixa compatível
            const sortedRules = [...dynamicConfigs[categoryKey]].sort((a, b) => b.threshold - a.threshold);
            const matched = sortedRules.find(r => score > r.threshold || (r.threshold === 0 && score === 0));
            if (matched) return matched.text;
        }

        // Se não houver config dinâmica ou compatível, usa o fallback hardcoded
        for (const f of fallbacks) {
            if (score > f.threshold) return f.text;
        }
        return fallbacks[fallbacks.length - 1].text; // Último item é o default (0)
    };

    // ----- PARÁGRAFO 1: SAÚDE MENTAL (Psicoemocional) -----
    const scoreInsat = scores['Insatisfação Pessoal'] || 0;
    const scoreAnxiety = scores['Ansiedade'] || 0;
    const scoreDepression = scores['Depressão'] || 0;

    const insatPhrase = getDynamicText('insatisfacao', scoreInsat, [
        { threshold: 7.5, text: 'relatou insatisfação significativa com sua vida atual' },
        { threshold: 5, text: 'relatou insatisfação moderada com sua vida atual' },
        { threshold: 2.5, text: 'relatou leve insatisfação com sua vida atual' },
        { threshold: -1, text: 'relatou estar satisfeito com sua vida atual' }
    ]);

    const anxietyPhrase = getDynamicText('ansiedade', scoreAnxiety, [
        { threshold: 7.5, text: 'O paciente possui alta possibilidade de apresentar transtornos de ansiedade' },
        { threshold: 5, text: 'O paciente possui moderada possibilidade de apresentar transtornos de ansiedade' },
        { threshold: 2.5, text: 'O paciente possui leve possibilidade de apresentar transtornos de ansiedade' },
        { threshold: -1, text: 'O paciente não manifestou possibilidade de apresentar transtornos de ansiedade' }
    ]);

    const depressionPhrase = getDynamicText('depressao', scoreDepression, [
        { threshold: 7.5, text: 'O paciente possui alta possibilidade de desenvolver depressão' },
        { threshold: 5, text: 'O paciente possui moderada possibilidade de desenvolver depressão' },
        { threshold: 2.5, text: 'O paciente possui leve possibilidade de desenvolver depressão' },
        { threshold: -1, text: 'O paciente não manifestou possibilidade de desenvolver depressão' }
    ]);

    const mentalText = `Durante o período da avaliação, foi possível identificar que o paciente ${insatPhrase}. ${anxietyPhrase}. ${depressionPhrase}.`;

    // ----- PARÁGRAFO 2: HÁBITOS E ESTILO DE VIDA -----
    const scoreAlcohol = scores['Álcool'] || 0;
    const scoreDrugs = scores['Drogas ou Remédios'] || 0;
    const scoreSmoke = scores['Fumo'] || 0;
    const scoreSleep = scores['Sono'] || 0;

    const alcoholPhrase = getDynamicText('alcool', scoreAlcohol, [
        { threshold: 7.5, text: 'relatou consumo frequente e substancial de bebidas alcoólicas' },
        { threshold: 5, text: 'relatou consumo cotidiano e moderado de bebidas alcoólicas' },
        { threshold: 2.5, text: 'relatou consumo social ou ocasional de bebidas alcoólicas' },
        { threshold: -1, text: 'relatou não fazer uso ou fazer uso mínimo/eventual de bebidas alcoólicas' }
    ]);

    const drugsPhrase = getDynamicText('drogas', scoreDrugs, [
        { threshold: 7.5, text: 'faz uso recorrente de drogas ilícitas ou medicamentos não prescritos' },
        { threshold: 5, text: 'faz uso de algum medicamento não prescrito ou substância ilícita de forma recreativa' },
        { threshold: -1, text: 'declarou não fazer uso de nenhum tipo de droga' }
    ]);

    const smokePhrase = getDynamicText('fumo', scoreSmoke, [
        { threshold: 7.5, text: 'apresenta dependência intensa ao tabaco' },
        { threshold: 5, text: 'apresenta dependência moderada/leve ao fumo' },
        { threshold: -1, text: 'declarou não ser fumante' }
    ]);

    const sleepPhrase = getDynamicText('sono', scoreSleep, [
        { threshold: 7.5, text: 'apresenta distúrbios graves do sono, com impacto na qualidade de vida' },
        { threshold: 5, text: 'apresenta alterações relevantes no padrão de sono' },
        { threshold: 2.5, text: 'apresenta algumas alterações leves no sono' },
        { threshold: -1, text: 'apresenta sono regular e sem intercorrências' }
    ]);

    const habitsText = `Em relação aos hábitos e estilo de vida, o colaborador ${alcoholPhrase}. Quanto ao uso de substâncias, ${drugsPhrase}. No que diz respeito ao fumo, ${smokePhrase}. Sobre o padrão de sono, ${sleepPhrase}.`;

    // ----- PARÁGRAFO 3: CONCLUSÃO E PARECER FINAL -----
    const hasSevereFlags = scoreDepression > 7.5 || scoreAnxiety > 7.5 || scoreAlcohol >= 7.5;

    // Busca textos gerais (Introdução, Disclaimer, Conclusão) das configurações dinâmicas
    const getGeneralConfig = (label, defaultText) => {
        if (dynamicConfigs && dynamicConfigs.geral) {
            const found = dynamicConfigs.geral.find(g => g.label === label || g.level === label);
            if (found && found.text) return found.text;
        }
        return defaultText;
    };

    const intro = getGeneralConfig('Introdução', "O paciente foi submetido à avaliação psicossocial para verificação de seu estado de saúde mental, como condição necessária à realização do trabalho.");
    const disclaimer = getGeneralConfig('Disclaimer (Aviso)', "Lembre-se que este teste por si só não pode diagnosticar uma patologia, mas pode indicar a presença de sintomas.") + "\n\n";

    const conclusionApto = getGeneralConfig('Conclusão (Apto)', 'O paciente apresenta, nesta avaliação, condições psicológicas compatíveis com suas atividades. Este parecer não é conclusivo quanto à aptidão, sendo essa responsabilidade do médico do trabalho.');
    const conclusionRisco = getGeneralConfig('Conclusão (Risco)', 'Com base nos dados coletados, foram identificados indicadores de risco relevantes e inconclusivos quanto à aptidão do paciente para o trabalho. Recomenda-se uma avaliação complementar com o médico do trabalho responsável pelo PCMSO');

    const conclusionText = hasSevereFlags ? conclusionRisco : conclusionApto;

    const full_analysis = [intro, mentalText, habitsText + " " + conclusionText, disclaimer].filter(Boolean).join("\n\n");

    return {
        intro,
        full_analysis,
        disclaimer,
        narrative: full_analysis,
        mental_text: mentalText,
        habits_text: habitsText,
        is_apto: !hasSevereFlags
    };
};

const normalizeStr = (str) => {
    if (!str) return '';
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};
