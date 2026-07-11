import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Type definitions to match what's used in the admin panel
interface Variacao {
  id: string;
  nome: string;
  valor_pago: number;
  valor_venda: number;
  venda_excelente?: number | null;
  venda_bom?: number | null;
  venda_regular?: number | null;
  ia_atualizado_em?: string | null;
  criado_em?: string | null;
}

interface Grupo {
  id: string;
  nome: string;
  marcas?: { nome: string };
  variacoes: Variacao[];
}

export function generatePDFCatalog(grupos: Grupo[]) {
  // Configuração inicial do documento A4
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const dataAtual = new Date().toLocaleString('pt-BR');

  // Cores da Identidade Visual (VantaTech style)
  const primaryColor: [number, number, number] = [37, 99, 235]; // Azul moderno (Tailwind blue-600)
  const headerBgColor: [number, number, number] = [30, 41, 59]; // Slate 800
  const textColor: [number, number, number] = [51, 65, 85]; // Slate 700

  let totalAparelhos = 0;

  // Organizar e processar dados
  const catalogoPorMarca: Record<string, typeof grupos> = {};

  grupos.forEach(grupo => {
    const marca = grupo.marcas?.nome || 'Outros';
    if (!catalogoPorMarca[marca]) catalogoPorMarca[marca] = [];
    catalogoPorMarca[marca].push(grupo);
    totalAparelhos += grupo.variacoes.length;
  });

  // Ordenar marcas alfabeticamente
  const marcasOrdenadas = Object.keys(catalogoPorMarca).sort();

  // Função Auxiliar: Formatar moeda
  const formatCurrency = (value: number) => {
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Função Auxiliar: Formatar data (apenas dia/mês/ano)
  const formatDate = (isoString?: string | null) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('pt-BR');
    } catch {
      return '-';
    }
  };

  // Header e Footer serão adicionados no final iterando por todas as páginas
  const addHeaderAndFooter = () => {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      // Header
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, pageWidth, 25, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("Catálogo de Preços", 15, 15);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Atualizado em: ${dataAtual}`, pageWidth - 15, 15, { align: 'right' });

      // Footer
      const str = `Página ${i} de ${pageCount}`;
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(str, pageWidth / 2, pageHeight - 10, { align: 'center' });
      doc.text("Gerado por VantaTech", 15, pageHeight - 10);
    }
  };

  // Montando as tabelas
  let startY = 35; // Posição inicial após o header

  // Observação em destaque no topo da primeira página
  doc.setFillColor(254, 242, 242); // Fundo vermelho bem claro
  doc.setDrawColor(252, 165, 165); // Borda vermelha suave
  doc.setLineWidth(0.2);
  doc.rect(15, startY, pageWidth - 30, 10, 'FD');

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(220, 38, 38); // Vermelho escuro
  doc.text("Atenção:", 20, startY + 6.5);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(153, 27, 27); // Vermelho mais escuro para o texto
  doc.text("Os preços são estimativas e podem variar conforme a condição física e saúde da bateria do aparelho.", 35, startY + 6.5);

  startY += 18;

  marcasOrdenadas.forEach((marca, index) => {
    // Ordenar grupos (aparelhos) alfabeticamente dentro da marca
    const gruposDaMarca = catalogoPorMarca[marca].sort((a, b) => a.nome.localeCompare(b.nome));

    // Cabeçalho da Categoria
    if (startY > pageHeight - 40) {
      doc.addPage();
      startY = 35;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...primaryColor);
    doc.text(marca.toUpperCase(), 15, startY);
    startY += 5;

    gruposDaMarca.forEach(grupo => {
      const variacoesOrdenadas = [...grupo.variacoes].sort((a, b) => a.nome.localeCompare(b.nome));
      if (variacoesOrdenadas.length === 0) return; // Ignora grupos vazios

      const tableBody: any[] = [];
      variacoesOrdenadas.forEach(variacao => {
        tableBody.push([
          `${grupo.nome} ${variacao.nome}`, // Nome completo (Base + Variação)
          formatCurrency(variacao.valor_venda), // Preço de Venda
          formatDate(variacao.ia_atualizado_em || variacao.criado_em) // Atualização
        ]);
      });

      // Se estourar a página antes de iniciar a tabela
      if (startY > pageHeight - 30) {
        doc.addPage();
        startY = 35;
      }

      // Tabela separada para cada Aparelho Base
      autoTable(doc, {
        startY: startY,
        head: [[grupo.nome, 'Preço de Venda', 'Atualizado']], // Título do aparelho no cabeçalho
        body: tableBody,
        theme: 'striped',
        headStyles: {
          fillColor: [241, 245, 249], // Slate 100 - muito suave para diferenciar do azul principal
          textColor: [30, 41, 59], // Slate 800
          fontSize: 11,
          fontStyle: 'bold',
          halign: 'left'
        },
        bodyStyles: {
          fontSize: 9,
          textColor: textColor
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] // Slate 50
        },
        columnStyles: {
          0: { cellWidth: 90, fontStyle: 'bold' },
          1: { cellWidth: 50, textColor: [21, 128, 61], fontStyle: 'bold' }, // Verde no preço
          2: { cellWidth: 'auto' }
        },
        margin: { top: 30, left: 15, right: 15 },
        didDrawPage: (data) => {
          // Apenas atualiza o cursor se houver quebra
          if (data.cursor) {
            startY = data.cursor.y;
          }
        }
      });

      // Pula espaço para a próxima tabela
      startY = (doc as any).lastAutoTable.finalY + 8;
    });

    startY += 10; // Espaço extra após finalizar a marca
  });

  // Resumo Final (última página)
  if (startY > pageHeight - 50) {
    doc.addPage();
    startY = 35;
  }

  doc.setFillColor(241, 245, 249); // Slate 100
  doc.rect(15, startY, pageWidth - 30, 30, 'F');

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...headerBgColor);
  doc.text("Resumo do Catálogo", 20, startY + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Total de Categorias: ${marcasOrdenadas.length}`, 20, startY + 16);
  doc.text(`Total de Aparelhos: ${totalAparelhos}`, 20, startY + 22);

  // --- APLICA HEADER E FOOTER EM TODAS AS PÁGINAS ---
  addHeaderAndFooter();

  // Salvar
  doc.save(`Catalogo_Precos_${dataAtual.replace(/\//g, '-')}.pdf`);
}
