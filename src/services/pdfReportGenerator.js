import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generatePDF = (patient, assessment, answers, questions, logoBase64) => {
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
        [{ content: 'Data do Laudo:', styles: { fontStyle: 'bold' } }, formattedDateTime, { content: 'Médico Responsável:', styles: { fontStyle: 'bold' } }, 'Fabianni C. N. C. Mello']
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
        { key: 'Satisfação Pessoal', color: '#0000FF' }, // Blue
        { key: 'Ansiedade', color: '#FF0000' }, // Red
        { key: 'Depressão', color: '#A52A2A' }, // Brown
        { key: 'Álcool', color: '#FFA500' }, // Orange
        { key: 'Fumo', color: '#000000' }, // Black
        { key: 'Drogas ou Remédios', color: '#800080' }, // Purple
        { key: 'Sono', color: '#008000' }  // Green
    ];

    // Calculate Scores
    // We iterate over the categories and sum the scores of answers belonging to questions in that category
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

    if (answers) {
        answers.forEach(ans => {
            const cat = questionCategoryMap[ans.question_id];
            // Normalize category naming just in case
            const matchedKey = categories.find(c => c.key.toLowerCase() === cat?.toLowerCase())?.key;

            if (matchedKey) {
                scores[matchedKey] += (ans.score || 0);
            }
        });
    }

    // Draw Chart Base
    const chartHeight = 60;
    const chartWidth = contentWidth - 15;
    const chartX = margin + 10;
    const chartY = yPos;
    const maxScore = 4;

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

    // --- Footer Logo (Example: Mountain Icon) ---
    // doc.addImage(...) - Skipping real image, drawing a placeholder shape if needed 
    // or just leave blank as per "adapte o nome... dados do paciente" instruction implies keeping structure.

    // Save
    doc.save(`Laudo_${patient.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};
