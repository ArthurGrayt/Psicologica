
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
    }

    // 2. Generate Analysis Text (Natural Language)

    // Intro
    const intro = "O paciente foi submetido à avaliação psicológica para verificação de seu estado de saúde mental, como condição necessária à realização do trabalho.";

    // Helper for intensity
    const getIntensity = (score, category) => {
        const s = Number(score) || 0;
        if (s === 0) return 'nulo';
        if (s <= 2) return 'leve';
        if (s <= 5) return 'moderado';
        return 'severo';
    };

    // Helper for capitalization
    const capitalize = (str) => {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    // Helper to join parts: First part lowercase (continuation), others capitalized (new sentences)
    const formatNarrative = (parts) => {
        if (!parts || parts.length === 0) return "";
        return parts.map((part, index) => {
            // First item follows "que o paciente..." or "Em relação...," so keep lowercase
            if (index === 0) return part.charAt(0).toLowerCase() + part.slice(1);
            // Subsequent items are new sentences
            return capitalize(part);
        }).join(". ") + ".";
    };

    // Construct Mental Health Paragraph
    let mentalParts = [];

    // Insatisfação (Always present)
    const scoreInsat = scores['Insatisfação Pessoal'] || 0;
    if (scoreInsat > 5) mentalParts.push("relatou insatisfação significativa com sua vida atual");
    else if (scoreInsat > 2) mentalParts.push("relatou insatisfação moderada com sua vida atual");
    else if (scoreInsat > 0) mentalParts.push("relatou leve insatisfação com sua vida atual");
    else mentalParts.push("relatou estar satisfeito com sua vida atual");

    // Ansiedade
    const scoreAnxiety = scores['Ansiedade'] || 0;
    if (scoreAnxiety > 5) mentalParts.push("apresenta indicadores severos de ansiedade");
    else if (scoreAnxiety > 2) mentalParts.push("apresenta indicadores relevantes de ansiedade");
    else if (scoreAnxiety > 0) mentalParts.push("apresenta indicadores leves de ansiedade");

    // Depressão
    const scoreDepression = scores['Depressão'] || 0;
    if (scoreDepression > 5) mentalParts.push("demonstra indicadores severos de depressão e desesperança");
    else if (scoreDepression > 2) mentalParts.push("demonstra indicadores relevantes de depressão e desesperança");
    else if (scoreDepression > 0) mentalParts.push("demonstra indicadores leves de depressão");

    // Join Mental Parts
    let mentalText = "";
    if (mentalParts.length > 0) {
        mentalText = "Durante o período da avaliação, foi possível identificar que o paciente " + formatNarrative(mentalParts);
    }

    // Construct Habits Paragraph
    let habitsParts = [];

    // Alcohol
    const scoreAlcohol = scores['Álcool'] || 0;
    if (scoreAlcohol > 0) habitsParts.push("relatou fazer uso de bebidas alcoólicas");
    else habitsParts.push("relatou fazer uso ocasional ou nulo de bebidas alcoólicas");

    // Drugs
    const scoreDrugs = scores['Drogas ou Remédios'] || 0;
    if (scoreDrugs > 0) habitsParts.push("faz uso de medicamentos ou substâncias");
    else habitsParts.push("não faz uso de nenhum tipo de droga");

    // Smoking
    const scoreSmoke = scores['Fumo'] || 0;
    if (scoreSmoke > 0) habitsParts.push(`apresenta dependência ${getIntensity(scoreSmoke)} ao fumo`);
    else habitsParts.push("tem dependência nula ao fumo");

    // Sleep
    const scoreSleep = scores['Sono'] || 0;
    if (scoreSleep > 5) habitsParts.push("relata distúrbios graves do sono");
    else if (scoreSleep > 2) habitsParts.push("relata alterações relevantes no sono");
    else if (scoreSleep > 0) habitsParts.push("relata alterações leves no sono");
    else habitsParts.push("relata sono regular");

    let habitsText = "";
    if (habitsParts.length > 0) {
        habitsText = "Em relação aos hábitos e rotina, " + formatNarrative(habitsParts);
    }

    // Combine full analysis
    const full_analysis = [mentalText, habitsText].filter(Boolean).join("\n\n");

    // 3. Status
    const is_apto = true; // Logic to determine this could be added later
    const status_label = "APTO";
    const status_message = "O colaborador encontra-se APTO para exercer suas atividades laborais, considerando os aspectos psicossociais avaliados.";

    // 4. Disclaimer
    const disclaimer = "Este documento é um subsídio para a avaliação médica ocupacional e não substitui o diagnóstico clínico.";

    return {
        intro,
        full_analysis,
        status_label,
        status_message,
        is_apto,
        disclaimer,
        // Legacy fields for PDF generator compatibility
        narrative: full_analysis,
        mental_text: mentalText,
        habits_text: habitsText
    };
};

const normalizeStr = (str) => {
    if (!str) return '';
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};
