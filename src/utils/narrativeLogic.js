
// Logic to generate the narrative report client-side
// Replaces the broken 'get_narrative_report' RPC

export const generateNarrative = (assessment, answers, questions) => {

    // 1. Calculate Scores
    const categories = [
        { key: 'Insatisfação Pessoal', dbKeys: ['insatisfacaopessoal', 'satisfacaopessoal'] },
        { key: 'Ansiedade', dbKeys: ['ansiedade'] },
        { key: 'Depressão', dbKeys: ['depressao'] },
        { key: 'Álcool', dbKeys: ['alcool'] },
        { key: 'Fumo', dbKeys: ['fumo'] },
        { key: 'Drogas ou Remédios', dbKeys: ['drogas', 'drogasouremédios'] },
        { key: 'Sono', dbKeys: ['sono'] }
    ];

    const scores = {};
    categories.forEach(c => scores[c.key] = 0);

    // Map Questions to Categories
    const questionCategoryMap = {};
    if (questions) {
        questions.forEach(q => {
            const cat = q.category_key || q.categories?.name || q.category;
            if (cat) questionCategoryMap[q.id] = normalizeStr(cat);
        });
    }

    if (answers) {
        answers.forEach(ans => {
            const qId = ans.question_id;
            const normCat = questionCategoryMap[qId];
            if (!normCat) return;

            // Find matching category
            const matchedCat = categories.find(c => c.dbKeys.some(k => normalizeStr(k) === normCat || normCat.includes(normalizeStr(k))));

            if (matchedCat) {
                scores[matchedCat.key] += Number(ans.score) || 0;
            }
        });

        // 1.1 Normalize Scores to 30 points ceiling
        // Factor = 30 / OriginalMaxScore
        const factors = {
            'Insatisfação Pessoal': 30 / 24,   // 12 items * 2
            'Ansiedade': 30 / 32,             // 16 items * 2
            'Depressão': 30 / 36,             // 18 items * 2
            'Álcool': 30 / 38,                 // AUDIT (38 points max)
            'Drogas ou Remédios': 30 / 20,    // 10 items? Actually 8 items * 2 = 16? 
                                              // Let's use the actual max from DB to be safe or the user provided 30/ItemCount.
                                              // Based on user: 8 items -> 30/8 = 3.75 per unit. 
                                              // If unit = 2pts, then Factor = 3.75 / 2 = 1.875.
                                              // Total original max for Drogas was 20. 30/20 = 1.5.
            'Sono': 30 / 10,                  // 5 items * 2
            'Fumo': 30 / 14                   // 6 items? Max was 14. 
        };

        // If category uses user's "30 / Count" rule directly:
        // Factor = (30 / ItemCount) / 2
        // Insat: (30/12)/2 = 1.25
        // Ans: (30/16)/2 = 0.9375
        // Dep: (30/18)/2 = 0.8333
        // Sono: (30/5)/2 = 3.0
        // Drogas: (30/8)/2 = 1.875 (User said 8 items)
        // Fumo: (30/6)/2 = 2.5 (User said 6 items)
        // Alcool: (30/10)/2 = 1.5 (User said 10 items)

        const finalFactors = {
            'Insatisfação Pessoal': 30 / 24,   // 1.25
            'Ansiedade': 30 / 32,             // 0.9375
            'Depressão': 30 / 36,             // 0.8333...
            'Álcool': 30 / 38,                 // 0.7895...
            'Drogas ou Remédios': 30 / 20,    // 1.5
            'Sono': 30 / 10,                  // 3.0
            'Fumo': 30 / 14                   // 2.1428...
        };

        Object.keys(scores).forEach(key => {
            if (finalFactors[key]) {
                scores[key] = scores[key] * finalFactors[key];
            }
        });
    }

    // 2. Generate Analysis Text (Natural Language)

    // Intro
    const intro = "O paciente foi submetido à avaliação psicológica para verificação de seu estado de saúde mental, como condição necessária à realização do trabalho.";

    // Helper for intensity (Recalibrated for 0-30 scale)
    const getIntensity = (score) => {
        const s = Number(score) || 0;
        if (s === 0) return 'nulo';
        if (s <= 7.5) return 'leve';
        if (s <= 15) return 'moderado';
        return 'severo';
    };


    // ----- PARÁGRAFO 1: SAÚDE MENTAL -----
    const scoreInsat = scores['Insatisfação Pessoal'] || 0;
    const scoreAnxiety = scores['Ansiedade'] || 0;
    const scoreDepression = scores['Depressão'] || 0;

    // Monta frase sobre Insatisfação Pessoal (Threshold base: 5/24 * 30 = 6.25)
    let insatPhrase = '';
    if (scoreInsat > 15) insatPhrase = 'relatou insatisfação significativa com sua vida atual';
    else if (scoreInsat > 6.25) insatPhrase = 'relatou insatisfação moderada com sua vida atual';
    else if (scoreInsat > 0) insatPhrase = 'relatou leve insatisfação com sua vida atual';
    else insatPhrase = 'relatou estar satisfeito com sua vida atual';

    // Monta frase sobre Ansiedade (Threshold base: 10/32 * 30 = 9.375)
    let anxietyPhrase = '';
    if (scoreAnxiety > 18.75) anxietyPhrase = 'Foram identificados indicadores severos de ansiedade';
    else if (scoreAnxiety > 9.375) anxietyPhrase = 'Foram identificados indicadores relevantes de ansiedade';
    else if (scoreAnxiety > 0) anxietyPhrase = 'Foram identificados indicadores leves de ansiedade';
    else anxietyPhrase = 'Não foram identificados indicadores de ansiedade';

    // Monta frase sobre Depressão (Threshold base: 16/36 * 30 = 13.33)
    let depressionPhrase = '';
    if (scoreDepression > 20) depressionPhrase = 'Os índices de depressão apresentaram-se em nível severo, com múltiplos indicadores de desesperança e tristeza persistente';
    else if (scoreDepression > 13.33) depressionPhrase = 'Os índices de depressão apresentaram-se em nível moderado, com alguns indicadores de desesperança';
    else if (scoreDepression > 0) depressionPhrase = 'Os índices de depressão apresentaram-se em nível leve';
    else depressionPhrase = 'Não foram identificados indicadores de depressão';

    // Combina as frases de saúde mental em um parágrafo coeso
    const mentalText =
        `Durante o período da avaliação, foi possível identificar que o paciente ${insatPhrase}. ` +
        `${anxietyPhrase}. ${depressionPhrase}.`;


    // ----- PARÁGRAFO 2: HÁBITOS -----
    const scoreAlcohol = scores['Álcool'] || 0;
    const scoreDrugs = scores['Drogas ou Remédios'] || 0;
    const scoreSmoke = scores['Fumo'] || 0;
    const scoreSleep = scores['Sono'] || 0;

    // Monta frase sobre Álcool (Threshold base: 8/38 * 30 = 6.31)
    let alcoholPhrase = '';
    if (scoreAlcohol >= 15.79) alcoholPhrase = 'apresenta dependência grave ao álcool, com risco à saúde e à segurança no trabalho';
    else if (scoreAlcohol >= 6.31) alcoholPhrase = 'apresenta uso nocivo de bebidas alcoólicas';
    else if (scoreAlcohol > 0) alcoholPhrase = 'relatou consumo moderado ou ocasional de bebidas alcoólicas';
    else alcoholPhrase = 'relatou não fazer uso ou fazer uso mínimo de bebidas alcoólicas';

    // Monta frase sobre Drogas/Remédios (Threshold original ~6, nova escala ~9)
    let drugsPhrase = '';
    if (scoreDrugs >= 9) drugsPhrase = 'faz uso recorrente de drogas ou medicamentos não prescritos';
    else if (scoreDrugs > 0) drugsPhrase = 'faz uso de algum medicamento ou substância';
    else drugsPhrase = 'declarou não fazer uso de nenhum tipo de droga ilícita';

    // Monta frase sobre Fumo (Threshold original ~6, nova escala ~12.8)
    let smokePhrase = '';
    if (scoreSmoke >= 12.8) smokePhrase = 'apresenta dependência intensa ao tabaco';
    else if (scoreSmoke > 0) smokePhrase = `apresenta dependência ${getIntensity(scoreSmoke)} ao tabaco`;
    else smokePhrase = 'declarou não ser fumante';

    // Monta frase sobre Sono (Threshold original ~4, nova escala ~12)
    let sleepPhrase = '';
    if (scoreSleep >= 24) sleepPhrase = 'relata distúrbios graves do sono, com impacto significativo na qualidade de vida';
    else if (scoreSleep >= 12) sleepPhrase = 'relata alterações relevantes no padrão de sono';
    else if (scoreSleep > 0) sleepPhrase = 'relata algumas alterações leves no sono';
    else sleepPhrase = 'relata sono regular e sem intercorrências';

    // Combina as frases de hábitos em um parágrafo coeso
    const habitsText =
        `Em relação aos hábitos e estilo de vida, o colaborador ${alcoholPhrase}. ` +
        `Quanto ao uso de substâncias, ${drugsPhrase}. ` +
        `No que diz respeito ao tabaco, ${smokePhrase}. ` +
        `Sobre o padrão de sono, ${sleepPhrase}.`;

    // ----- PARÁGRAFO 3: CONCLUSÃO -----
    // Thresholds recalibrated for 0-30 scale:
    // Depression: 16/36 * 30 = 13.33
    // Anxiety: 10/32 * 30 = 9.375
    // Alcohol: 20/38 * 30 = 15.79
    const hasSevereFlags =
        scoreDepression > 13.33 ||
        scoreAnxiety > 9.375 ||
        scoreAlcohol >= 15.79;

    // Conclusão baseada na presença ou não de indicadores severos de risco
    const conclusionText = hasSevereFlags
        ? 'Com base nos dados coletados, foram identificados indicadores de risco relevantes que exigem atenção especializada. Recomenda-se o acompanhamento por profissional de saúde mental.'
        : 'O paciente avaliado apresenta, no momento, um estado psicoemocional compatível com o desempenho de suas funções laborais. Não foram identificados indícios de quadros graves ou incapacitantes. Diante disso, o colaborador encontra-se APTO para o pleno exercício de suas atividades operacionais ou administrativas.';

    // Une os três parágrafos com uma linha em branco entre eles
    const full_analysis = [mentalText, habitsText, conclusionText].filter(Boolean).join("\n\n");

    // 3. Status (Apto ou Inapto)
    const is_apto = !hasSevereFlags;
    const status_label = is_apto ? "APTO" : "INAPTO";
    const status_message = is_apto
        ? "O colaborador encontra-se APTO para exercer suas atividades laborais, considerando os aspectos psicossociais avaliados."
        : "O colaborador apresenta indicadores de risco que recomendam avaliação médica antes de retornar às atividades laborais.";

    // 4. Disclaimer
    const disclaimer = "Este documento é um subsídio para a avaliação médica ocupacional e não substitui o diagnóstico clínico.";

    return {
        intro,
        full_analysis,
        status_label,
        status_message,
        is_apto,
        disclaimer,
        // Campos legados para compatibilidade com o gerador de PDF
        narrative: full_analysis,
        mental_text: mentalText,
        habits_text: habitsText
    };
};

const normalizeStr = (str) => {
    if (!str) return '';
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};
