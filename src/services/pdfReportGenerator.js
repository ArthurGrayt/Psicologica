import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Função Principal que gera o arquivo PDF do Laudo Psicológico
// Recebe dados do paciente, meta-dados do exame, respostas, perguntas, logo da empresa e os textos da análise (narrativa)
export const generatePDF = (patient, assessment, answers, questions, logoBase64, narrativeData, options = {}) => {
    
    // Extrai o objeto 'doctor' das opções para saber qual médico está assinando o documento
    const doctor = options.doctor || null;

    // Instancia um novo documento PDF usando a biblioteca jsPDF
    const doc = new jsPDF();
    
    // Obtém a largura total da página configurada (padrão A4)
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Define a margem padrão das laterais e topo em milímetros
    const margin = 15;
    
    // Calcula a largura útil para o conteúdo (descontando as margens esquerda e direita)
    const contentWidth = pageWidth - (margin * 2);

    // --- Funções Auxiliares de Estilização ---

    // Função para renderizar texto centralizado na horizontal
    const centerText = (text, y, size = 12, style = 'normal', color = '#000000') => {
        doc.setFontSize(size); // Define tamanho da fonte
        doc.setFont('helvetica', style); // Define família e estilo (B/I)
        doc.setTextColor(color); // Define cor do texto (RGB ou Hex)
        const textWidth = doc.getTextWidth(text); // Mede a largura exata da frase
        // Desenha o texto posicionando o início em (Metade da Página - Metade do Texto)
        doc.text(text, (pageWidth - textWidth) / 2, y);
    };

    // Função para desenhar o título de uma seção com uma caixa colorida de fundo
    const drawSectionHeader = (text, y, bgColor = '#139690') => {
        doc.setFillColor(bgColor); // Define cor de preenchimento do retângulo
        doc.rect(margin, y, contentWidth, 8, 'F'); // Desenha um retângulo preenchido ('F')
        // Escreve o texto centralizado por cima da caixa colorida
        centerText(text, y + 5.5, 12, 'bold', '#FFFFFF');
    };

    // --- 1. Cabeçalho (Informações da Clínica/Empresa) ---
    const title = 'Gama Center Medicina Ocupacional e Engenharia de Segurança do Trabalho';
    const address = 'RUA BARÃO DE POUSO ALEGRE, 90, SÃO SEBASTIÃO, CONSELHEIRO LAFAIETE/MG - (31) 3761-2417';

    // Variáveis para dimensões dinâmicas do Logotipo
    let logoWidth = 35; // Largura padrão caso falte imagem
    let logoHeight = 20; // Altura fixa desejada para o topo

    // Lógica para processar a Imagem (Logo) se ela existir em formato Base64
    if (logoBase64) {
        try {
            // Obtém as propriedades originais da imagem para manter a proporção (aspect ratio)
            const props = doc.getImageProperties(logoBase64);
            const aspectRatio = props.width / props.height;
            // Calcula a largura proporcional baseada na nossa altura fixa de 20mm
            logoWidth = logoHeight * aspectRatio;
        } catch (e) {
            // Emite aviso no console se a imagem estiver corrompida ou inválida
            console.warn('Could not get image properties', e);
        }
    }

    // Calcula quanto espaço sobra para o texto do título ao lado da logo
    const availableTextWidth = contentWidth - (logoBase64 ? (logoWidth + 5) : 0);

    // Configura pincel e fonte para o Nome da Empresa no topo
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#000000');

    // Quebra o texto longo do título em várias linhas caso não caiba na largura disponível
    const titleLines = doc.splitTextToSize(title, availableTextWidth);

    // Define a posição vertical inicial do cabeçalho
    const titleStartY = 15;
    // Calcula a altura ocupada pelo bloco de títulos
    const titleBlockHeight = titleLines.length * 5;

    // Define onde o endereço da clínica será escrito (logo abaixo do título)
    const addressY = titleStartY + titleBlockHeight + 2;

    // Coordenadas métricas para centralizar a logo verticalmente em relação ao texto do lado
    const textBlockBottomY = addressY;
    const textBlockTopY = titleStartY - 4; 
    const textBlockCenterY = (textBlockTopY + textBlockBottomY) / 2;

    // Desenha o Logotipo se ele foi fornecido
    if (logoBase64) {
        const logoX = pageWidth - margin - logoWidth; // Alinhado à direita
        const logoY = textBlockCenterY - (logoHeight / 2); // Centralizado verticalmente
        // Adiciona a imagem ao documento
        doc.addImage(logoBase64, 'PNG', logoX, logoY, logoWidth, logoHeight);
    }

    // Escreve as linhas do Título da Empresa
    doc.text(titleLines, margin, titleStartY);

    // Escreve o endereço da clínica com fonte menor
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(address, margin, addressY);

    // Desenha uma linha decorativa ciana abaixo do cabeçalho
    const lineY = Math.max(addressY + 4, textBlockCenterY + (logoHeight / 2) + 2);
    doc.setDrawColor(19, 150, 144); // Cor institucional #139690
    doc.setLineWidth(1); // Espessura da linha
    doc.line(margin, lineY, pageWidth - margin, lineY);

    // --- 2. Título Central do Laudo ---
    // Nome do exame centralizado e em destaque
    centerText('Avaliação Psicossocial', 40, 18, 'bold', '#139690');
    // Data de hoje em que o arquivo foi gerado
    centerText(`Data do exame: ${new Date().toLocaleDateString('pt-BR')}`, 46, 11, 'normal', '#139690');

    // --- 3. Texto Introdutório ---
    // Parágrafo explicativo sobre o que é o questionário psicossocial
    const introText = "Este laudo tem o objetivo de efetuar uma avaliação primária para captar o nível do estado de saúde mental, física e psicológica do trabalhador com a finalidade de encaminhar o mesmo para o atendimento psicológico presencial, caso possua a necessidade, diminuindo assim os riscos de ter um trabalhador fatigado, com tendências suicidas e com disposição para síndrome de Burnout. \n\nO questionário consiste em perguntas chave que verificam os níveis de satisfação com a vida pessoal e profissional, capacidade de resiliência, níveis de estresse, uso e abuso de álcool, drogas e medicação para dormir, doenças pré-existentes e fobias, já que essas patologias são as que mais afastam os colaboradores de seus serviços";

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#333333');
    // Prepara o texto distribuindo-o em linhas que respeitam as margens da página
    const introLines = doc.splitTextToSize(introText, contentWidth);
    doc.text(introLines, margin, 48);

    // Calcula a posição vertical dinâmica para começar a próxima seção (evita textos sobrepostos)
    let yPos = 48 + (introLines.length * 4.2) + 4;
    
    // --- 4. Tabela de Dados do Paciente ---
    drawSectionHeader('Dados do Paciente', yPos);
    yPos += 10;

    // Estrutura os dados do paciente em um formato de grade para a função autoTable
    const patientData = [
        [{ content: 'Nome:', styles: { fontStyle: 'bold' } }, patient.name, { content: 'CPF:', styles: { fontStyle: 'bold' } }, patient.cpf || 'Não informado'],
        [{ content: 'Nascimento:', styles: { fontStyle: 'bold' } }, patient.nascimento || 'Não informado', { content: 'Sexo:', styles: { fontStyle: 'bold' } }, patient.sexo || 'Não informado'],
    ];

    // Cria a tabela visual usando o plugin autoTable
    autoTable(doc, {
        startY: yPos,
        body: patientData,
        theme: 'plain', // Sem linhas de grade pesadas
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: {
            0: { cellWidth: 25 }, // Coluna "Nome:"
            1: { cellWidth: 80 }, // Valor do Nome
            2: { cellWidth: 25 }, // Coluna "CPF:"
            3: { cellWidth: 'auto' } // Valor do CPF
        },
        margin: { left: margin, right: margin }
    });

    // Pega a posição de rodapé da última tabela para continuar escrevendo abaixo
    yPos = doc.lastAutoTable.finalY + 5;

    // --- 5. Tabela de Dados do Exame ---
    drawSectionHeader('Dados do Exame', yPos);
    yPos += 10;

    // Formatação de data e hora atual no padrão brasileiro
    const now = new Date();
    const formattedDateTime = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

    // Define os dados secundários do laudo
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

    // Avança a posição vertical preparando o Gráfico
    yPos = doc.lastAutoTable.finalY + 4;

    // --- 6. Lógica de Gráfico e Cálculo de Pontuação ---
    // Define as cores institucionais para cada uma das 7 dimensões do exame
    const categories = [
        { key: 'Insatisfação Pessoal', color: '#0000FF' }, // Azul
        { key: 'Ansiedade', color: '#FF0000' },           // Vermelho
        { key: 'Depressão', color: '#A52A2A' },           // Marrom
        { key: 'Álcool', color: '#FFA500' },              // Laranja
        { key: 'Fumo', color: '#000000' },                // Preto
        { key: 'Drogas ou Remédios', color: '#800080' },  // Roxo
        { key: 'Sono', color: '#008000' }                 // Verde
    ];

    // Inicializa somatório de pontos
    const scores = {};
    categories.forEach(cat => scores[cat.key] = 0);

    // Mapeamento de perguntas para categorias (semelhante ao narrativeLogic)
    const questionCategoryMap = {};
    if (questions) {
        questions.forEach(q => {
            const cat = q.category_key || q.categories?.name || q.category;
            if (cat) questionCategoryMap[q.id] = cat;
        });
    }

    // Função interna para comparação genérica de nomes de categorias
    const normalizeStr = (str) => {
        if (!str) return '';
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    };

    // Cálculos de soma de pontos para as barras do gráfico
    if (answers) {
        answers.forEach(ans => {
            const qId = ans.question_id;
            const cat = questionCategoryMap[qId];
            if (!cat) return;

            const normCat = normalizeStr(cat);
            // Dicionário de mapeamento para lidar com inconsistências de nomes no banco
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

            let matchedKey = mapping[normCat];

            if (!matchedKey) {
                const direct = categories.find(c => normalizeStr(c.key) === normCat);
                if (direct) matchedKey = direct.key;
            }

            // Se reconhecemos a categoria, somamos o valor da resposta
            if (matchedKey) {
                const numericScore = parseFloat(ans.score);
                scores[matchedKey] += isNaN(numericScore) ? 0 : numericScore;
            }
        });

        // Aplicação dos FATORES DE CORREÇÃO (Igual ao narrativeLogic)
        // Isso garante que todos os dados internos terminem em uma escala de 0 a 10
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
                // Multiplica o score bruto pelo fator para chegar no valor entre 0 e 10
                scores[key] = scores[key] * finalFactors[key];
            }
        });
    }

    // --- Desenho Físico do Gráfico de Barras ---
    const chartHeight = 35; // Altura do eixo vertical reduzida (~50%)
    const chartWidth = contentWidth - 15; // Largura do eixo horizontal
    const chartX = margin + 10; // Recuo para os números da escala
    const chartY = yPos;

    const maxScore = 10; // Limite superior fixo do gráfico (Escala 0-10)

    // Desenha a GRADE (Grid) e NUMERAÇÃO VERTICAL (Escala 0-10)
    doc.setDrawColor(200, 200, 200); // Cinza claro
    doc.setLineWidth(0.1);
    doc.setFontSize(8);
    doc.setTextColor('#333333');

    for (let i = 0; i <= maxScore; i++) {
        // Calcula a posição em Y de cada degrau da escala
        const yLine = chartY + chartHeight - (i / maxScore * chartHeight);
        doc.text(i.toString(), chartX - 6, yLine + 1.5, { align: 'right' }); // Escreve o número
        doc.line(chartX, yLine, chartX + chartWidth, yLine); // Desenha a linha horizontal da grade
    }

    // Desenha as BARRAS COLORIDAS para cada categoria
    const barWidth = 8; // Largura da barra reduzida para 50%
    const numCategories = categories.length;
    const sectionWidth = chartWidth / numCategories; // Espaço disponível para cada grupo

    categories.forEach((cat, index) => {
        // Pega o valor calculado (agora já na escala 0-10)
        const score = Math.min(scores[cat.key] || 0, maxScore);
        const barHeight = (score / maxScore) * chartHeight; // Converte valor em milímetros de barra

        // Centraliza a barra dentro da sua fatia no eixo X
        const sectionCenterX = chartX + (index * sectionWidth) + (sectionWidth / 2);
        const xBar = sectionCenterX - (barWidth / 2);
        const yBar = chartY + chartHeight - barHeight;

        // Desenha a própria barra retangular preenchida
        doc.setFillColor(cat.color);
        doc.rect(xBar, yBar, barWidth, barHeight, 'F');

        // Escreve os rótulos (Labels) na base do gráfico com 25 graus de inclinação
        doc.setFontSize(5);
        doc.setTextColor('#333333');
        doc.saveGraphicsState();
        doc.text(cat.key, sectionCenterX, chartY + chartHeight + 9, { angle: 25, align: 'center' });
        doc.restoreGraphicsState();
    });

    // Desenha a borda externa do gráfico para acabamento
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.rect(chartX, chartY, chartWidth, chartHeight, 'S');

    // --- 7. Documentação da Análise Narrativa (Relatório Escrito) ---
    if (narrativeData) {
        let currentY = chartY + chartHeight + 14; // Subi a Análise (era 18)

        // Removemos a verificação de quebra de página aqui para forçar o início na pág 1
        // Título da seção de texto
        drawSectionHeader('Análise', currentY);
        currentY += 12;

        doc.setFontSize(10);
        const textWidth = contentWidth;

        // Função para imprimir blocos de texto respeitando quebras de página automáticas
        const printBlock = (text, fontSize = 10, fontStyle = 'normal', color = '#333333', align = 'left', spacing = 3.5) => {
            if (!text) return;
            doc.setFontSize(fontSize);
            doc.setFont('helvetica', fontStyle);
            doc.setTextColor(color);

            // Divide o parágrafo em linhas
            const lines = doc.splitTextToSize(text, textWidth);
            const blockHeight = lines.length * 5; // Reduzi de 6 para 5 a altura da linha no bloco

            // Se o bloco de texto realmente exceder o fim da página atual (só quebra em último caso)
            if (currentY + blockHeight > doc.internal.pageSize.getHeight() - 6) {
                doc.addPage(); // Cria nova folha
                currentY = margin + 10; // Reinicia o topo
            }

            // Escreve as linhas no papel PDF
            doc.text(lines, margin, currentY, { align: 'left' });
            currentY += blockHeight + spacing; // Incrementa a posição vertical
        };


        // Define a ordem e estilos das partes do laudo
        const styledParts = [
            { text: narrativeData.full_analysis || narrativeData.mental_text, style: 'normal', color: '#333333' }
        ];

        // Processa a impressão de cada parte de forma independente
        styledParts.filter(p => p.text).forEach(p => {
            // O valor 2.5mm representa uma redução maior para garantir que caiba em uma página
            printBlock(p.text, 9.5, p.style, p.color, 'justify', 2.5); 
        });

        currentY += 2;

        // --- 8. Assinatura do Profissional ---
        // Se houver um médico selecionado, escreve o nome e CRP no rodapé do documento
        if (doctor && doctor.name) {
            const signatureY = currentY + 12; // Subi a assinatura (era 18)
            const signatureText = `Assinado por: ${doctor.name}, CRP-${doctor.crp || 'Não informado'}.`;

            if (signatureY + 5 > doc.internal.pageSize.getHeight() - 5) {
                doc.addPage();
                doc.text(signatureText, pageWidth / 2, margin + 10, { align: 'center' });
            } else {
                doc.text(signatureText, pageWidth / 2, signatureY, { align: 'center' });
            }
        }
    }

    // Se as opções pedirem Base64 (para visualização prévia), retorna a string
    if (options?.returnBase64) {
        const dataUri = doc.output('datauristring');
        return dataUri.split(',')[1];
    }

    // Por fim, executa o comando de download do arquivo PDF com nome dinâmico baseado no paciente e data
    doc.save(`Laudo_${patient.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};
