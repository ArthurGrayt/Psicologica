import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generatePDF = (patient, assessment, answers, questions, logoBase64, narrativeData, options = {}) => {
    // Extract doctor from options if passed
    const doctor = options.doctor || null;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);

    // --- Helper Functions ---
    const centerText = (text, y, size = 12, style = 'normal', color = '#000000') => {
        doc.setFontSize(size);
        doc.setFont('helvetica', style);
        doc.setTextColor(color);
        const textWidth = doc.getTextWidth(text);
        doc.text(text, (pageWidth - textWidth) / 2, y);
    };

    const drawSectionHeader = (text, y, bgColor = '#139690') => {
        doc.setFillColor(bgColor);
        doc.rect(margin, y, contentWidth, 8, 'F');
        centerText(text, y + 5.5, 12, 'bold', '#FFFFFF');
    };

    // --- 1. Header (Company Info) ---
    const title = 'Gama Center Medicina Ocupacional e Engenharia de Segurança do Trabalho';
    const address = 'RUA BARÃO DE POUSO ALEGRE, 90, SÃO SEBASTIÃO, CONSELHEIRO LAFAIETE/MG - (31) 3761-2417';

    // Dynamic Logo Dimensions
    let logoWidth = 35; // Default fallback
    let logoHeight = 20; // Fixed Height

    if (logoBase64) {
        try {
            const props = doc.getImageProperties(logoBase64);
            const aspectRatio = props.width / props.height;
            // Keep height fixed at 20, calculate width
            logoWidth = logoHeight * aspectRatio;
        } catch (e) {
            console.warn('Could not get image properties', e);
        }
    }

    // Calculate available width for text
    const availableTextWidth = contentWidth - (logoBase64 ? (logoWidth + 5) : 0);

    // --- Text Metrics Calculation ---
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#000000');

    const titleLines = doc.splitTextToSize(title, availableTextWidth);

    // Y Positions
    const titleStartY = 15;
    const titleBlockHeight = titleLines.length * 5;

    // Address Position
    const addressY = titleStartY + titleBlockHeight + 2;

    // Total Text Block Height (Title Top to Address Baseline)
    const textBlockBottomY = addressY;
    const textBlockTopY = titleStartY - 4; // Approx top of capital letters
    const textBlockCenterY = (textBlockTopY + textBlockBottomY) / 2;

    // --- Draw Logo Centered on Text Block ---
    if (logoBase64) {
        const logoX = pageWidth - margin - logoWidth;
        // Center Image Y relative to Text Block Center
        const logoY = textBlockCenterY - (logoHeight / 2);

        doc.addImage(logoBase64, 'PNG', logoX, logoY, logoWidth, logoHeight);
    }

    // --- Draw Text ---
    doc.text(titleLines, margin, titleStartY);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(address, margin, addressY);

    // Cyan Line under header - Positioned after the header block
    const lineY = Math.max(addressY + 4, textBlockCenterY + (logoHeight / 2) + 2);
    doc.setDrawColor(19, 150, 144); // #139690
    doc.setLineWidth(1);
    doc.line(margin, lineY, pageWidth - margin, lineY);

    // --- 2. Report Title ---
    centerText('Avaliação Psicossocial', 40, 18, 'bold', '#139690');
    centerText(`Data do exame: ${new Date().toLocaleDateString('pt-BR')}`, 46, 11, 'normal', '#139690');

    // --- 3. Intro Text ---
    const introText = "Este laudo tem o objetivo de efetuar uma avaliação primária para captar o nível do estado de saúde mental, física e psicológica do trabalhador com a finalidade de encaminhar o mesmo para o atendimento psicológico presencial, caso possua a necessidade, diminuindo assim os riscos de ter um trabalhador fatigado, com tendências suicidas e com disposição para síndrome de Burnout. \n\nO questionário consiste em perguntas chave que verificam os níveis de satisfação com a vida pessoal e profissional, capacidade de resiliência, níveis de estresse, uso e abuso de álcool, drogas e medicação para dormir, doenças pré-existentes e fobias, já que essas patologias são as que mais afastam os colaboradores de seus serviços";

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#000000');
    doc.text(doc.splitTextToSize(introText, contentWidth), margin, 55);

    // --- 4. Patient Data ---
    let yPos = 85;
    drawSectionHeader('Dados do Paciente', yPos);
    yPos += 10;

    const patientData = [
        [{ content: 'Nome:', styles: { fontStyle: 'bold' } }, patient.name, { content: 'CPF:', styles: { fontStyle: 'bold' } }, patient.cpf || 'Não informado'],
        [{ content: 'Nascimento:', styles: { fontStyle: 'bold' } }, patient.nascimento || 'Não informado', { content: 'Sexo:', styles: { fontStyle: 'bold' } }, patient.sexo || 'Não informado'],
    ];

    autoTable(doc, {
        startY: yPos,
        body: patientData,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 80 },
            2: { cellWidth: 25 },
            3: { cellWidth: 'auto' }
        },
        margin: { left: margin, right: margin }
    });

    yPos = doc.lastAutoTable.finalY + 5;

    // --- 5. Exam Data ---
    drawSectionHeader('Dados do Exame', yPos);
    yPos += 10;

    // Get formatted date/time
    const now = new Date();
    const formattedDateTime = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

    const examData = [
        [{ content: 'Data do Laudo:', styles: { fontStyle: 'bold' } }, formattedDateTime, { content: 'Médico Responsável:', styles: { fontStyle: 'bold' } }, doctor ? doctor.name : 'Fabianni C. N. C. Mello']
    ];

    autoTable(doc, {
        startY: yPos,
        body: examData,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 80 },
            2: { cellWidth: 35 },
            3: { cellWidth: 'auto' }
        },
        margin: { left: margin, right: margin }
    });

    yPos = doc.lastAutoTable.finalY + 10;

    // --- 6. Chart Logic & Drawing ---
    // Define Categories and Colors matching the image
    const categories = [
        { key: 'Insatisfação Pessoal', color: '#0000FF' }, // Renamed from 'Satisfação Pessoal'
        { key: 'Ansiedade', color: '#FF0000' },
        { key: 'Depressão', color: '#A52A2A' },
        { key: 'Álcool', color: '#FFA500' },
        { key: 'Fumo', color: '#000000' },
        { key: 'Drogas ou Remédios', color: '#800080' },
        { key: 'Sono', color: '#008000' }
    ];

    // Calculate Scores
    const scores = {};
    categories.forEach(cat => scores[cat.key] = 0);

    // Map Question ID to Category
    const questionCategoryMap = {};
    if (questions) {
        questions.forEach(q => {
            // Priority: category_key -> categories.name -> category
            const cat = q.category_key || q.categories?.name || q.category;
            if (cat) questionCategoryMap[q.id] = cat;
        });
    }

    // Helper for robust string comparison (removes accents, lowercase)
    const normalizeStr = (str) => {
        if (!str) return '';
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    };

    if (answers) {
        console.group('PDF Generator - Score Calculation Debug');
        console.log('Initial Scores:', { ...scores });

        answers.forEach(ans => {
            const qId = ans.question_id;
            const cat = questionCategoryMap[qId];

            if (!cat) {
                console.warn(`[Q${qId}] No category found in question map.`);
                return;
            }

            const normCat = normalizeStr(cat);
            // More Robust Mapping Keys
            const mapping = {
                'insatisfacaopessoal': 'Insatisfação Pessoal',
                'satisfacaopessoal': 'Insatisfação Pessoal',
                'ansiedade': 'Ansiedade',
                'depressao': 'Depressão',
                'alcool': 'Álcool',
                'fumo': 'Fumo',
                'drogas': 'Drogas ou Remédios',
                'drogasouremedios': 'Drogas ou Remédios',
                'sono': 'Sono'
            };

            let matchedKey = null;

            // 1. Direct Map
            if (mapping[normCat]) matchedKey = mapping[normCat];

            // 2. Direct Match in Categories (normalized)
            if (!matchedKey) {
                const direct = categories.find(c => normalizeStr(c.key) === normCat);
                if (direct) matchedKey = direct.key;
            }

            // 3. Substring match
            if (!matchedKey) {
                const partial = categories.find(c =>
                    normalizeStr(c.key).includes(normCat) || normCat.includes(normalizeStr(c.key))
                );
                if (partial) matchedKey = partial.key;
            }

            if (matchedKey) {
                const numericScore = parseFloat(ans.score);
                const finalScoreToAdd = isNaN(numericScore) ? 0 : numericScore;
                scores[matchedKey] += finalScoreToAdd;
            } else {
                console.warn(`[Q${qId}] Cat: "${cat}" (Norm: ${normCat}) -> NO MATCH FOUND!`);
            }
        });
        console.log('Final Calculated Scores:', scores);
        console.groupEnd();
    }

    // Draw Chart Base
    const chartHeight = 75; // Increased from 60 to 75 for better vertical spacing
    const chartWidth = contentWidth - 15;
    const chartX = margin + 10;
    const chartY = yPos;

    // Let's Find Max Score in our calculated scores to adjust scale
    const calculatedMax = Math.max(...Object.values(scores), 10); // Minimum 10 to avoid flat chart
    const maxScore = Math.ceil(calculatedMax / 5) * 5; // Round up to nearest 5

    // Grid lines (Horizontal: 0, 1, 2, 3, 4)
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.1);
    doc.setFontSize(8);
    doc.setTextColor('#333333');

    for (let i = 0; i <= maxScore; i++) {
        const yLine = chartY + chartHeight - (i / maxScore * chartHeight);
        doc.text(i.toString(), chartX - 6, yLine + 1.5, { align: 'right' }); // Better Y labels
        doc.line(chartX, yLine, chartX + chartWidth, yLine); // Horizontal Line
    }

    // Draw Sections and Vertical Grid Lines
    const barWidth = 16;
    const numCategories = categories.length;
    // Calculate space for each column (category block)
    const sectionWidth = chartWidth / numCategories;

    categories.forEach((cat, index) => {
        const score = Math.min(scores[cat.key] || 0, maxScore);
        const barHeight = (score / maxScore) * chartHeight;

        // Horizontal center of the current section
        const sectionCenterX = chartX + (index * sectionWidth) + (sectionWidth / 2);
        const xBar = sectionCenterX - (barWidth / 2);
        const yBar = chartY + chartHeight - barHeight;

        // Vertical Grid Line (at start of section, except first)
        if (index > 0) {
            const xGrid = chartX + (index * sectionWidth);
            doc.setDrawColor(220, 220, 220);
            doc.line(xGrid, chartY, xGrid, chartY + chartHeight);
        }

        // Draw Bar
        doc.setFillColor(cat.color);
        doc.rect(xBar, yBar, barWidth, barHeight, 'F');

        // Labels - Positioned further down and centered with the bar
        doc.setFontSize(7);
        doc.setTextColor('#333333');
        doc.saveGraphicsState();
        // Start label 12 units below the 0-line and center it with the section
        doc.text(cat.key, sectionCenterX, chartY + chartHeight + 12, { angle: 25, align: 'center' });
        doc.restoreGraphicsState();
    });

    // Outer Border (to overlap the grid edges for a clean look)
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.rect(chartX, chartY, chartWidth, chartHeight, 'S');

    // --- 7. Narrative Report (Análise) ---
    if (narrativeData) {
        let currentY = chartY + chartHeight + 20; // Start below chart

        // Check if we need a new page for the analysis
        if (currentY + 60 > doc.internal.pageSize.getHeight()) {
            doc.addPage();
            currentY = margin + 10;
        }

        drawSectionHeader('Análise', currentY);
        currentY += 15;

        // Badge Removed per requirement (it is part of the text now)
        currentY += 5;

        // --- Narrative Container ---
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor('#333333');

        const containerPadding = 0;
        const textWidth = contentWidth;

        // Helper to print a block of text and advance Y
        const printBlock = (text, fontSize = 10, fontStyle = 'normal', color = '#333333', align = 'justify') => {
            if (!text) return;
            doc.setFontSize(fontSize);
            doc.setFont('helvetica', fontStyle);
            doc.setTextColor(color);

            const lines = doc.splitTextToSize(text, textWidth);
            const blockHeight = lines.length * 5;

            // Page Check
            if (currentY + blockHeight > doc.internal.pageSize.getHeight() - margin) {
                doc.addPage();
                currentY = margin + 10;
            }

            doc.text(lines, margin + containerPadding, currentY, { align: align === 'justify' ? 'justify' : 'left', maxWidth: textWidth });
            currentY += blockHeight + 5; // Spacing after block
        };

        // 1. Text Sections
        if (narrativeData.intro) printBlock(narrativeData.intro);

        // Combined Analysis Section (Mental + Habits as one block)
        const fullAnalysis = narrativeData.full_analysis || [narrativeData.mental_text, narrativeData.habits_text].filter(Boolean).join('\n\n');

        if (fullAnalysis) {
            printBlock(fullAnalysis);
        }

        currentY += 5;

        // 2. Conclusion Box (APTO/INAPTO) with Dynamic Height
        if (narrativeData.status_label) {
            const isApto = narrativeData.is_apto;
            const boxColor = isApto ? '#f0fdf4' : '#fffbeb'; // bg-green-50 vs bg-amber-50
            const borderColor = isApto ? '#dcfce7' : '#fef3c7'; // border-green-100 vs border-amber-100
            const textColor = isApto ? '#15803d' : '#b45309'; // text-green-700 vs text-amber-700

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            // Split message into lines to fit box width (padding included)
            const messageLines = narrativeData.status_message ? doc.splitTextToSize(narrativeData.status_message, contentWidth - 30) : [];

            const labelHeight = 7;
            const padding = 6;
            const gap = 4;
            const messageBlockHeight = messageLines.length * 5;

            // Calculate Box Height based on content
            const boxHeight = (messageLines.length > 0)
                ? (padding * 2) + labelHeight + gap + messageBlockHeight
                : (padding * 2) + labelHeight;

            // Page Check
            if (currentY + boxHeight > doc.internal.pageSize.getHeight() - margin) {
                doc.addPage();
                currentY = margin + 10;
            }

            // Draw Box
            doc.setDrawColor(borderColor);
            doc.setFillColor(boxColor);
            doc.roundedRect(margin + 10, currentY, contentWidth - 20, boxHeight, 3, 3, 'FD');

            // Draw Label (APTO)
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(textColor);
            doc.text(narrativeData.status_label, pageWidth / 2, currentY + padding + 5, { align: 'center' });

            // Draw Message (Multi-line)
            if (messageLines.length > 0) {
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor('#334155');

                let textY = currentY + padding + labelHeight + gap + 2;
                messageLines.forEach(line => {
                    doc.text(line, pageWidth / 2, textY, { align: 'center' });
                    textY += 5;
                });
            }

            currentY += boxHeight + 10;
        }

        // 3. Disclaimer
        if (narrativeData.disclaimer) {
            printBlock(narrativeData.disclaimer, 8, 'italic', '#64748b'); // slate-500
        }

        // 4. Doctor Signature (Requested Feature)
        if (doctor && doctor.name) {
            const signatureY = currentY + 35; // Approx 100px / 2.83 (pts to mm conversion) ~ 35mm

            // Check page bounds
            if (signatureY + 10 > doc.internal.pageSize.getHeight() - margin) {
                doc.addPage();
                // New Page: Reset Y to margin
                // If we page break, the signature might detach from disclaimer, but better than being cut off.
                const newSignatureY = margin + 10;
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor('#000000');
                const signatureText = `Assinado por: ${doctor.name}, CRP-${doctor.crp || 'Não informado'}.`;
                doc.text(signatureText, pageWidth / 2, newSignatureY, { align: 'center' });
            } else {
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor('#000000');
                const signatureText = `Assinado por: ${doctor.name}, CRP-${doctor.crp || 'Não informado'}.`;
                doc.text(signatureText, pageWidth / 2, signatureY, { align: 'center' });
            }
        }
    }

    // Output
    if (options?.returnBase64) {
        const dataUri = doc.output('datauristring');
        return dataUri.split(',')[1];
    }

    // Save
    doc.save(`Laudo_${patient.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};
