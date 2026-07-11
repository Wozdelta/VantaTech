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

  // Header Global que aparece em todas as páginas
  const addHeader = () => {
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Catálogo de Preços", 15, 15);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Atualizado em: ${dataAtual}`, pageWidth - 15, 15, { align: 'right' });
  };

  // Rodapé Global que aparece em todas as páginas
  const addFooter = (data: any) => {
    const str = `Página ${data.pageNumber} de ${data.pageCount}`;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(str, pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text("Gerado por VantaTech", 15, pageHeight - 10);
  };

  // Montando as tabelas
  let startY = 35; // Posição inicial após o header

  // Observação Geral no topo da primeira página
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("* Observação Geral: Os valores podem mudar dependendo da condição do aparelho.", 15, startY);
  startY += 15;

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

    // Preparar dados da tabela
    const tableBody: any[] = [];
    
    gruposDaMarca.forEach(grupo => {
      // Adicionar linha de divisória para o Aparelho Base
      tableBody.push([
        { 
          content: grupo.nome, 
          colSpan: 3, 
          styles: { 
            fillColor: [241, 245, 249], // Slate 100
            textColor: [30, 41, 59], // Slate 800
            fontStyle: 'bold', 
            halign: 'left',
            fontSize: 10
          } 
        }
      ]);

      // Ordenar variações (ex: 128GB, 256GB)
      const variacoesOrdenadas = [...grupo.variacoes].sort((a, b) => a.nome.localeCompare(b.nome));
      
      variacoesOrdenadas.forEach(variacao => {
        tableBody.push([
          `• ${variacao.nome}`, // Apenas o nome da variação (com bullet)
          formatCurrency(variacao.valor_venda), // Preço de Venda
          formatDate(variacao.ia_atualizado_em || variacao.criado_em) // Atualização
        ]);
      });
    });

    // Gerar tabela para esta marca
    autoTable(doc, {
      startY: startY,
      head: [['Aparelho', 'Venda', 'Atualizado']],
      body: tableBody,
      theme: 'striped',
      headStyles: {
        fillColor: headerBgColor,
        textColor: 255,
        fontSize: 10,
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
        1: { cellWidth: 50, textColor: [21, 128, 61], fontStyle: 'bold' }, // Verde no preço principal
        2: { cellWidth: 'auto' }
      },
      margin: { top: 30, left: 15, right: 15 },
      didDrawPage: (data) => {
        addHeader();
        addFooter(data);
      }
    });

    // Atualizar o Y para a próxima categoria (com base no final desta tabela)
    startY = (doc as any).lastAutoTable.finalY + 15;
  });

  // Resumo Final (última página)
  if (startY > pageHeight - 50) {
    doc.addPage();
    startY = 35;
    // O didDrawPage já cuidou do header/footer
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

  // Baixar o arquivo
  doc.save(`Catalogo_Precos_${new Date().getTime()}.pdf`);
}
