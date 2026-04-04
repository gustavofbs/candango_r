import pdfMake from "pdfmake/build/pdfmake"
import * as pdfFonts from "pdfmake/build/vfs_fonts"

// Configurar fontes
if (pdfMake.vfs === undefined) {
  pdfMake.vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : (pdfFonts as any).vfs
}

interface CompanyInfo {
  name: string | null
  cnpj: string
  address: string
  city: string
  phone: string
  email: string
  contact?: string | null
}

interface TableColumn {
  text: string
  width?: string | number
  alignment?: "left" | "center" | "right"
}

interface PDFOptions {
  reportType: string
  reportNumber?: string
  reportDate: string
  companyInfo: CompanyInfo
  clientInfo?: {
    name: string
    address?: string
    neighborhood?: string
    city?: string
    state?: string
  }
  columns: TableColumn[]
  data: any[]
  totals?: { label: string; value: string }[]
  observations?: string
  orientation?: "portrait" | "landscape"
}

export function generatePDF(options: PDFOptions) {
  const {
    reportType,
    reportNumber,
    reportDate,
    companyInfo,
    clientInfo,
    columns,
    data,
    totals,
    observations,
    orientation = "portrait",
  } = options

  // Cabeçalho da tabela
  const tableHeaders = columns.map((col) => ({
    text: col.text,
    style: "tableHeader",
    alignment: col.alignment || "left",
  }))

  // Linhas de dados
  const tableBody = data.map((row) =>
    columns.map((col) => ({
      text: row[col.text] || "",
      alignment: col.alignment || "left",
      fontSize: 9,
    }))
  )

  // Construir conteúdo do documento
  const content: any[] = [
    // Cabeçalho da Empresa
    {
      columns: [
        {
          width: "*",
          stack: [
            { text: companyInfo.name || "Empresa", style: "companyName" },
            { text: companyInfo.cnpj, style: "companyInfo" },
            { text: companyInfo.address, style: "companyInfo" },
            { text: `${companyInfo.city}`, style: "companyInfo" },
          ],
        },
        {
          width: "auto",
          stack: [
            { text: `Tel.: ${companyInfo.phone}`, style: "companyContact", alignment: "right" },
            { text: companyInfo.email, style: "companyContact", alignment: "right" },
            ...(companyInfo.contact
              ? [{ text: `Contato: ${companyInfo.contact}`, style: "companyContact", alignment: "right" }]
              : []),
          ],
        },
      ],
      margin: [0, 0, 0, 10],
    },
  ]

  // Dados do Cliente (se existir)
  if (clientInfo) {
    content.push({
      text: "Dados do Cliente",
      style: "sectionTitle",
      margin: [0, 0, 0, 5],
    })

    const clientStack: any[] = [
      { text: clientInfo.name, fontSize: 10, bold: true },
    ]

    // Adicionar endereço completo se disponível
    if (clientInfo.address || clientInfo.neighborhood || clientInfo.city || clientInfo.state) {
      const addressParts: string[] = []
      if (clientInfo.address) addressParts.push(clientInfo.address)
      if (clientInfo.neighborhood) addressParts.push(clientInfo.neighborhood)
      
      const cityState: string[] = []
      if (clientInfo.city) cityState.push(clientInfo.city)
      if (clientInfo.state) cityState.push(clientInfo.state)
      
      if (addressParts.length > 0) {
        clientStack.push({ text: addressParts.join(", "), fontSize: 9 })
      }
      if (cityState.length > 0) {
        clientStack.push({ text: cityState.join("/"), fontSize: 9 })
      }
    }

    content.push({
      stack: clientStack,
      margin: [0, 0, 0, 10],
    })
  }

  // Data alinhada à direita (acima da barra)
  content.push({
    text: `Data: ${reportDate}`,
    fontSize: 10,
    alignment: "right",
    margin: [0, 0, 0, 5],
  })

  // Barra com título do relatório (PEDIDO DE VENDA Nº) usando tabela para garantir o fundo
  const reportTitle = reportNumber ? `PEDIDO DE VENDA Nº ${reportNumber}` : reportType.toUpperCase()
  content.push({
    table: {
      widths: ["*"],
      body: [
        [
          {
            text: reportTitle,
            fontSize: 11,
            bold: true,
            color: "#FFFFFF",
            fillColor: "#666666",
            alignment: "center",
            margin: [0, 5, 0, 5],
            border: [false, false, false, false],
          },
        ],
      ],
    },
    layout: "noBorders",
    margin: [0, 0, 0, 15],
  })

  // Tabela de dados
  content.push({
    table: {
      headerRows: 1,
      widths: columns.map((col) => col.width || "auto"),
      body: [tableHeaders, ...tableBody],
    },
    layout: {
      fillColor: (rowIndex: number) => {
        return rowIndex === 0 ? "#666666" : rowIndex % 2 === 0 ? "#F5F5F5" : null
      },
      hLineWidth: (i: number, node: any) => (i === 0 || i === 1 || i === node.table.body.length ? 1 : 0.5),
      vLineWidth: () => 0,
      hLineColor: () => "#CCCCCC",
    },
    margin: [0, 0, 0, 15],
  })

  // Seção de Totais (se existir)
  if (totals && totals.length > 0) {
    const totalsRows = totals.map(total => [
      { text: "", border: [false, false, false, false] },
      { text: "", border: [false, false, false, false] },
      { text: "", border: [false, false, false, false] },
      { text: total.label, alignment: "right", fontSize: 10, bold: total.label.includes("Total"), border: [false, false, false, false] },
      { text: total.value, alignment: "right", fontSize: 10, bold: total.label.includes("Total"), border: [false, false, false, false] },
    ])

    content.push({
      table: {
        widths: columns.map((col) => col.width || "auto"),
        body: totalsRows,
      },
      layout: "noBorders",
      margin: [0, 0, 0, 15],
    })
  }

  // Rodapé com assinatura (se necessário)
  // Removido: Observações e Formas de Pagamento

  // Definição do documento
  const docDefinition: any = {
    pageSize: "A4",
    pageOrientation: orientation,
    pageMargins: [40, 40, 40, 40],
    content,
    styles: {
      companyName: {
        fontSize: 14,
        bold: true,
        margin: [0, 0, 0, 2],
      },
      companyInfo: {
        fontSize: 8,
        margin: [0, 1, 0, 0],
      },
      companyContact: {
        fontSize: 8,
        margin: [0, 1, 0, 0],
      },
      sectionTitle: {
        fontSize: 10,
        bold: false,
        margin: [0, 5, 0, 5],
      },
      reportDate: {
        fontSize: 10,
        alignment: "right",
      },
      reportTitle: {
        fontSize: 11,
        bold: true,
        alignment: "center",
        fillColor: "#666666",
        color: "#FFFFFF",
        margin: [0, 5, 0, 5],
      },
      tableHeader: {
        bold: true,
        fontSize: 9,
        color: "#FFFFFF",
        fillColor: "#666666",
      },
    },
    defaultStyle: {
      font: "Roboto",
    },
  }

  // Gerar e baixar PDF
  pdfMake.createPdf(docDefinition).download(`${reportType.replace(/\s+/g, "_")}_${reportDate.replace(/\//g, "-")}.pdf`)
}
