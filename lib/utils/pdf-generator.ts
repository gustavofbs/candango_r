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
    contact?: string
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

    content.push({
      stack: [
        { text: clientInfo.name, fontSize: 10, bold: true },
        ...(clientInfo.contact ? [{ text: clientInfo.contact, fontSize: 9 }] : []),
      ],
      margin: [0, 0, 0, 10],
    })
  }

  // Título do relatório centralizado
  const reportTitle = reportNumber ? `${reportType.toUpperCase()} Nº ${reportNumber}` : reportType.toUpperCase()
  content.push({
    text: reportTitle,
    style: "reportTitle",
    alignment: "center",
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

  // Observações e Data alinhadas à direita
  const footerItems: any[] = []
  
  if (observations) {
    footerItems.push({
      text: "Observações",
      fontSize: 9,
      bold: true,
      margin: [0, 0, 0, 2],
    })
    footerItems.push({
      text: observations,
      fontSize: 9,
      margin: [0, 0, 0, 10],
    })
  }

  footerItems.push({
    text: `Data: ${reportDate}`,
    fontSize: 9,
    margin: [0, 0, 0, 0],
  })

  content.push({
    stack: footerItems,
    alignment: "right",
    margin: [0, 0, 0, 0],
  })

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
