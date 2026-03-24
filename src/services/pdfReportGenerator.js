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
    // Define a data que será exibida no título (usa a data customizada ou a data atual)
    const displayDate = options.reportDate 
        ? new Date(options.reportDate + 'T12:00:00').toLocaleDateString('pt-BR') 
        : new Date().toLocaleDateString('pt-BR');
    
    // Título e Data concatenados e centralizados na página
    const reportTitle = `Avaliação Psicossocial - ${displayDate}`;
    // Renderiza o texto centralizado na posição vertical 38mm
    centerText(reportTitle, 38, 16, 'bold', '#139690');

    // --- 3. Texto Introdutório ---
    // Parágrafo explicativo sobre o que é o questionário psicossocial
    const introText = "Este laudo tem o objetivo de efetuar uma avaliação primária para captar o nível do estado de saúde mental, física e psicológica do trabalhador com a finalidade de encaminhar o mesmo para o atendimento psicológico presencial, caso possua a necessidade, diminuindo assim os riscos de ter um trabalhador fatigado, com tendências suicidas e com disposição para síndrome de Burnout. \n\nO questionário consiste em perguntas chave que verificam os níveis de satisfação com a vida pessoal e profissional, capacidade de resiliência, níveis de estresse, uso e abuso de álcool, drogas e medicação para dormir, doenças pré-existentes e fobias, já que essas patologias são as que mais afastam os colaboradores de seus serviços";

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#333333');
    // Prepara o texto distribuindo-o em linhas que respeitam as margens da página
    const introLines = doc.splitTextToSize(introText, contentWidth);
    // Escreve o texto com um recuo vertical levemente menor (45mm)
    doc.text(introLines, margin, 45); 

    // Calcula a posição vertical dinâmica para começar a próxima seção (gap reduzido para economizar espaço)
    let yPos = 45 + (introLines.length * 4.2) + 3;
    
    // --- 4. Tabela de Dados do Paciente ---
    // Desenha o cabeçalho "Dados do Paciente" na posição calculada
    drawSectionHeader('Dados do Paciente', yPos);
    // Incrementa posição para a tabela
    yPos += 10;

    // Converte a sigla do sexo para o nome por extenso (Ex: M -> Masculino)
    const genderFull = (patient.sexo === 'M' || patient.sexo === 'Masculino') ? 'Masculino' : 
                       (patient.sexo === 'F' || patient.sexo === 'Feminino') ? 'Feminino' : 
                       (patient.sexo || 'Não informado');

    // Estrutura os dados do paciente em um formato de grade para a função autoTable
    const patientData = [
        [{ content: 'Nome:', styles: { fontStyle: 'bold' } }, patient.name, { content: 'CPF:', styles: { fontStyle: 'bold' } }, patient.cpf || 'Não informado'],
        [{ content: 'Nascimento:', styles: { fontStyle: 'bold' } }, patient.nascimento || 'Não informado', { content: 'Sexo:', styles: { fontStyle: 'bold' } }, genderFull],
    ];

    // Cria a tabela visual usando o plugin autoTable com padding reduzido
    autoTable(doc, {
        startY: yPos, // Início da tabela
        body: patientData, // Conteúdo
        theme: 'plain', // Sem linhas pesadas
        styles: { fontSize: 9, cellPadding: 1.5 }, // Padding reduzido para 1.5mm
        columnStyles: {
            0: { cellWidth: 25 }, // Coluna rótulo
            1: { cellWidth: 80 }, // Valor do nome
            2: { cellWidth: 25 }, // Coluna rótulo
            3: { cellWidth: 'auto' } // CPF
        },
        margin: { left: margin, right: margin } // Margens laterais
    });

    // Pega a posição final da tabela e adiciona um gap pequeno (3mm)
    yPos = doc.lastAutoTable.finalY + 3;

    // --- 5. Tabela de Dados do Exame ---
    drawSectionHeader('Dados do Exame', yPos);
    yPos += 10;

    // Prepara a data formatada para a tabela (usa a data customizada se disponível)
    const reportDateObj = options.reportDate ? new Date(options.reportDate + 'T12:00:00') : new Date();
    // Formata apenas a data para exibição na tabela de Dados do Exame (sem horário conforme solicitado)
    const formattedDate = reportDateObj.toLocaleDateString('pt-BR');

    // Define os dados secundários do laudo para a tabela
    const examData = [
        [{ content: 'Data do Laudo:', styles: { fontStyle: 'bold' } }, formattedDate, { content: 'Médico Responsável:', styles: { fontStyle: 'bold' } }, doctor ? doctor.name : 'Fabianni C. N. C. Mello']
    ];

    // Renderiza a tabela de dados do exame com padding otimizado
    autoTable(doc, {
        startY: yPos, // Início vertical
        body: examData, // Conteúdo do exame
        theme: 'plain', // Estilo simples
        styles: { fontSize: 9, cellPadding: 1.5 }, // Padding reduzido
        columnStyles: {
            0: { halign: 'left', cellWidth: 26 }, // Rótulo "Data do Laudo:" grudado na margem esquerda
            1: { halign: 'left', cellWidth: 'auto' }, // Valor da data grudado no rótulo (o 'auto' cria o gap no meio)
            2: { halign: 'right', cellWidth: 'auto' }, // Rótulo "Médico Responsável:" grudado no nome (o 'auto' cria o gap no meio)
            3: { halign: 'right', cellWidth: 60 }  // Nome do médico grudado na margem direita
        },
        margin: { left: margin, right: margin } // Mantém margens
    });

    // Avança a posição vertical preparando o espaço do gráfico (gap de 3mm)
    yPos = doc.lastAutoTable.finalY + 3;

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
        // Isso garante que todos os dados internos terminem em uma escala de 0 a 5
        const finalFactors = {
            'Insatisfação Pessoal': 5 / 24,
            'Ansiedade': 5 / 32,
            'Depressão': 5 / 36,
            'Álcool': 5 / 38,
            'Drogas ou Remédios': 5 / 20,
            'Sono': 5 / 10,
            'Fumo': 5 / 14
        };

        Object.keys(scores).forEach(key => {
            if (finalFactors[key]) {
                // Multiplica o score bruto pelo fator para chegar no valor entre 0 e 5
                scores[key] = scores[key] * finalFactors[key];
            }
        });
    }

    // --- Desenho Físico do Gráfico de Barras ---
    // Altura reduzida para 28mm para economizar espaço vertical
    const chartHeight = 28; 
    // Largura útil do gráfico
    const chartWidth = contentWidth - 15; 
    // Recuo horizontal para a escala
    const chartX = margin + 10; 
    // Posição vertical calculada
    const chartY = yPos;

    // Escala máxima de 5 conforme solicitado
    const maxScore = 5; 

    // Configuração das linhas de grade e da escala lateral
    doc.setDrawColor(200, 200, 200); // Cor cinza suave
    doc.setLineWidth(0.1); // Linha fina
    doc.setFontSize(8); // Fonte pequena
    doc.setTextColor('#333333'); // Cor do texto

    // Loop para desenhar a escala de 1 em 1 (0, 1, 2, 3, 4, 5)
    for (let i = 0; i <= maxScore; i += 1) {
        // Calcula a posição Y de cada linha da grade
        const yLine = chartY + chartHeight - (i / maxScore * chartHeight);
        // Formata o valor numérico para exibição (ex: 0, 1, 2, 3, 4, 5)
        const label = i.toString();
        // Escreve o rótulo da escala à esquerda do eixo
        doc.text(label, chartX - 6, yLine + 1.5, { align: 'right' }); 
        // Desenha a linha horizontal da grade cruzando o gráfico
        doc.line(chartX, yLine, chartX + chartWidth, yLine); 
    }

    // Desenha as BARRAS COLORIDAS para cada categoria do exame
    // Largura da barra ajustada para melhor estética (10mm)
    const barWidth = 20; 
    // Total de categorias para distribuir no eixo X
    const numCategories = categories.length;
    // Espaço horizontal reservado para cada grupo de barra
    const sectionWidth = chartWidth / numCategories; 

    categories.forEach((cat, index) => {
        // Pega o valor calculado (agora já na escala 0-5)
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
    // Inicia a seção de análise se houver dados disponíveis
    if (narrativeData) {
        // Desloca a seção para baixo: 10mm originais + 3.5mm (equivale a 10px) = 13.5mm abaixo do gráfico
        let currentY = chartY + chartHeight + 13.5;

        // Desenha o cabeçalho da seção com caixa colorida
        drawSectionHeader('Análise', currentY);
        // Avança 14mm para iniciar o corpo do texto (proporcionando 6mm de padding do topo)
        currentY += 14;

        // Configura fonte padrão para o corpo da análise
        doc.setFontSize(9.5);
        // Usa a largura útil total da página
        const textWidth = contentWidth;

        // Função otimizada para imprimir texto processando tags HTML e forçando página única
        const printBlock = (text, fontSize = 9.5, fontStyle = 'normal', color = '#333333', align = 'left', spacing = 2) => {
            // Aborta se não houver conteúdo
            if (!text) return;
            
            // Limpa tags HTML para evitar que apareçam no PDF final
            let processedText = text
                .replace(/<p>/g, '') // Remove <p>
                .replace(/<\/p>/g, '\n\n') // Converte </p> em quebra dupla
                .replace(/<br\s*\/?>/g, '\n'); // Converte <br> em quebra simples

            // Define estilos de fonte antes de processar as linhas
            doc.setFontSize(fontSize);
            doc.setFont('helvetica', fontStyle);
            doc.setTextColor(color);

            // Divide o texto completo em parágrafos baseados em quebras de linha
            const paragraphs = processedText.split('\n');
            
            // Processa cada parágrafo individualmente
            paragraphs.forEach(paragraph => {
                // Se parágrafo for vazio, adiciona apenas o espaçamento
                if (paragraph.trim() === '') {
                    currentY += spacing;
                    return;
                }

                // Quebra o parágrafo em linhas que respeitem a largura do papel
                const lines = doc.splitTextToSize(paragraph, textWidth);
                // Calcula altura baseada em um fator de 4.2 para economizar espaço vertical
                const blockHeight = lines.length * 4.2; 

                // Desenha o texto efetivamente no documento
                doc.text(lines, margin, currentY, { align: 'left' });
                // Atualiza Y para o próximo bloco ou parágrafo
                currentY += blockHeight + spacing;
            });
        };

        // Define as fontes de texto para a narrativa (busca análise completa ou mental)
        const styledParts = [
            { text: narrativeData.full_analysis || narrativeData.mental_text, style: 'normal', color: '#333333' }
        ];

        // Processa cada parte com espaçamento reduzido (2mm)
        styledParts.filter(p => p.text).forEach(p => {
            // Chama a função de impressão sem possibilidade de quebra de página automática forçada aqui
            printBlock(p.text, 9.5, p.style, p.color, 'justify', 2); 
        });

        // Adiciona um gap final antes da assinatura (2mm)
        currentY += 2;

        // --- 8. Assinatura do Profissional ---
        // Adiciona bloco de assinatura se o médico estiver definido
        if (doctor && doctor.name) {
            // Posiciona a assinatura 8mm abaixo do texto (reduzido de 12mm)
            const signatureY = currentY + 8;
            // Texto formatado da assinatura
            const signatureText = `Assinado por: ${doctor.name}, CRP-${doctor.crp || 'Não informado'}.`;

            // Garante que a assinatura seja impressa na pág 1 se houver qualquer espaço, caso contrário, imprime no limite inferior
            const safeY = Math.min(signatureY, doc.internal.pageSize.getHeight() - 10);
            // Centraliza o texto da assinatura na horizontal
            doc.text(signatureText, pageWidth / 2, safeY, { align: 'center' });
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
