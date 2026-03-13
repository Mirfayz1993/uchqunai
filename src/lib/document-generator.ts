import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  Packer,
} from "docx";
import ExcelJS from "exceljs";

// ========== MARKDOWN PARSER ==========

type ParsedBlock =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "numbered-list"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] };

function parseMarkdownContent(content: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  const lines = content.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) {
      i++;
      continue;
    }

    // Skip document markers
    if (line.startsWith("[DOCUMENT:")) {
      i++;
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        text: cleanMarkdown(headingMatch[2]),
      });
      i++;
      continue;
    }

    // Table detection
    if (line.includes("|") && lines[i + 1]?.trim().match(/^\|[\s\-:|]+\|$/)) {
      const tableHeaders = line
        .split("|")
        .map((h) => h.trim())
        .filter(Boolean);
      i += 2; // skip header and separator
      const tableRows: string[][] = [];
      while (i < lines.length && lines[i].trim().includes("|")) {
        const row = lines[i]
          .trim()
          .split("|")
          .map((c) => c.trim())
          .filter(Boolean);
        tableRows.push(row);
        i++;
      }
      blocks.push({ type: "table", headers: tableHeaders, rows: tableRows });
      continue;
    }

    // Numbered list
    if (line.match(/^\d+[\.\)]\s/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().match(/^\d+[\.\)]\s/)) {
        items.push(cleanMarkdown(lines[i].trim().replace(/^\d+[\.\)]\s/, "")));
        i++;
      }
      blocks.push({ type: "numbered-list", items });
      continue;
    }

    // Bullet list
    if (line.match(/^[-*]\s/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().match(/^[-*]\s/)) {
        items.push(cleanMarkdown(lines[i].trim().replace(/^[-*]\s/, "")));
        i++;
      }
      blocks.push({ type: "list", items });
      continue;
    }

    // Regular paragraph
    blocks.push({ type: "paragraph", text: cleanMarkdown(line) });
    i++;
  }

  return blocks;
}

function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1") // bold
    .replace(/\*(.+?)\*/g, "$1") // italic
    .replace(/`(.+?)`/g, "$1") // code
    .replace(/\[(.+?)\]\(.+?\)/g, "$1") // links
    .trim();
}

// ========== WORD GENERATOR ==========

export async function generateDocx(
  title: string,
  content: string
): Promise<Buffer> {
  const blocks = parseMarkdownContent(content);
  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 32,
          font: "Arial",
        }),
      ],
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    })
  );

  // Date
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Sana: ${new Date().toLocaleDateString("uz-UZ")}`,
          size: 20,
          color: "666666",
          font: "Arial",
        }),
      ],
      alignment: AlignmentType.RIGHT,
      spacing: { after: 400 },
    })
  );

  for (const block of blocks) {
    switch (block.type) {
      case "heading": {
        const level =
          block.level === 1
            ? HeadingLevel.HEADING_1
            : block.level === 2
              ? HeadingLevel.HEADING_2
              : HeadingLevel.HEADING_3;
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: block.text,
                bold: true,
                size: block.level === 1 ? 28 : block.level === 2 ? 24 : 22,
                font: "Arial",
              }),
            ],
            heading: level,
            spacing: { before: 200, after: 100 },
          })
        );
        break;
      }
      case "paragraph":
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: block.text,
                size: 22,
                font: "Arial",
              }),
            ],
            spacing: { after: 120 },
          })
        );
        break;
      case "list":
        for (const item of block.items) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: `\u2022  ${item}`, size: 22, font: "Arial" }),
              ],
              indent: { left: 400 },
              spacing: { after: 60 },
            })
          );
        }
        break;
      case "numbered-list":
        block.items.forEach((item, idx) => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `${idx + 1}. ${item}`,
                  size: 22,
                  font: "Arial",
                }),
              ],
              indent: { left: 400 },
              spacing: { after: 60 },
            })
          );
        });
        break;
      case "table": {
        const borderStyle = {
          style: BorderStyle.SINGLE,
          size: 1,
          color: "999999",
        };
        const borders = {
          top: borderStyle,
          bottom: borderStyle,
          left: borderStyle,
          right: borderStyle,
        };

        const headerRow = new TableRow({
          children: block.headers.map(
            (h) =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: h,
                        bold: true,
                        size: 20,
                        font: "Arial",
                      }),
                    ],
                  }),
                ],
                borders,
                width: {
                  size: Math.floor(100 / block.headers.length),
                  type: WidthType.PERCENTAGE,
                },
              })
          ),
        });

        const dataRows = block.rows.map(
          (row) =>
            new TableRow({
              children: row.map(
                (cell) =>
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: cell,
                            size: 20,
                            font: "Arial",
                          }),
                        ],
                      }),
                    ],
                    borders,
                  })
              ),
            })
        );

        children.push(
          new Table({
            rows: [headerRow, ...dataRows],
            width: { size: 100, type: WidthType.PERCENTAGE },
          })
        );
        children.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
        break;
      }
    }
  }

  // Footer
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "\n\nUchqunAI tomonidan yaratilgan hujjat",
          size: 16,
          color: "999999",
          italics: true,
          font: "Arial",
        }),
      ],
      spacing: { before: 400 },
      alignment: AlignmentType.CENTER,
    })
  );

  const doc = new Document({
    sections: [{ children }],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

// ========== EXCEL GENERATOR ==========

export async function generateXlsx(
  title: string,
  content: string
): Promise<Buffer> {
  const blocks = parseMarkdownContent(content);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "UchqunAI";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(title.slice(0, 31)); // Excel sheet name max 31 chars

  // Title row
  sheet.mergeCells("A1:F1");
  const titleCell = sheet.getCell("A1");
  titleCell.value = title;
  titleCell.font = { bold: true, size: 16, name: "Arial" };
  titleCell.alignment = { horizontal: "center" };

  // Date row
  sheet.mergeCells("A2:F2");
  const dateCell = sheet.getCell("A2");
  dateCell.value = `Sana: ${new Date().toLocaleDateString("uz-UZ")}`;
  dateCell.font = { size: 10, color: { argb: "FF666666" }, name: "Arial" };
  dateCell.alignment = { horizontal: "right" };

  let currentRow = 4;

  for (const block of blocks) {
    switch (block.type) {
      case "heading":
        sheet.getCell(`A${currentRow}`).value = block.text;
        sheet.getCell(`A${currentRow}`).font = {
          bold: true,
          size: block.level === 1 ? 14 : block.level === 2 ? 12 : 11,
          name: "Arial",
        };
        currentRow += 2;
        break;

      case "paragraph":
        sheet.getCell(`A${currentRow}`).value = block.text;
        sheet.getCell(`A${currentRow}`).font = { size: 10, name: "Arial" };
        sheet.getCell(`A${currentRow}`).alignment = { wrapText: true };
        currentRow++;
        break;

      case "list":
      case "numbered-list":
        block.items.forEach((item, idx) => {
          const prefix = block.type === "list" ? "\u2022" : `${idx + 1}.`;
          sheet.getCell(`A${currentRow}`).value = `${prefix} ${item}`;
          sheet.getCell(`A${currentRow}`).font = { size: 10, name: "Arial" };
          currentRow++;
        });
        currentRow++;
        break;

      case "table": {
        // Header row with styling
        block.headers.forEach((header, colIdx) => {
          const cell = sheet.getCell(currentRow, colIdx + 1);
          cell.value = header;
          cell.font = { bold: true, size: 10, name: "Arial", color: { argb: "FFFFFFFF" } };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF4472C4" },
          };
          cell.border = {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          };
          cell.alignment = { horizontal: "center" };
        });
        currentRow++;

        // Data rows
        block.rows.forEach((row, rowIdx) => {
          row.forEach((cellValue, colIdx) => {
            const cell = sheet.getCell(currentRow, colIdx + 1);
            // Try to parse numbers
            const num = Number(cellValue.replace(/\s/g, "").replace(",", "."));
            cell.value = isNaN(num) ? cellValue : num;
            cell.font = { size: 10, name: "Arial" };
            cell.border = {
              top: { style: "thin" },
              bottom: { style: "thin" },
              left: { style: "thin" },
              right: { style: "thin" },
            };
            // Alternating row colors
            if (rowIdx % 2 === 0) {
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFD9E2F3" },
              };
            }
          });
          currentRow++;
        });

        // Auto-fit columns
        block.headers.forEach((_, colIdx) => {
          const col = sheet.getColumn(colIdx + 1);
          col.width = 20;
        });

        currentRow += 2;
        break;
      }
    }
  }

  // Footer
  sheet.getCell(`A${currentRow + 1}`).value =
    "UchqunAI tomonidan yaratilgan hujjat";
  sheet.getCell(`A${currentRow + 1}`).font = {
    size: 8,
    color: { argb: "FF999999" },
    italic: true,
    name: "Arial",
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

// ========== PDF GENERATOR ==========
// Note: jsPDF runs on server side with Node.js
export async function generatePdf(
  title: string,
  content: string
): Promise<Buffer> {
  // Dynamic import for jsPDF (CommonJS compatibility)
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF();
  const blocks = parseMarkdownContent(content);
  let y = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(title, pageWidth / 2, y, { align: "center" });
  y += 10;

  // Date
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(
    `Sana: ${new Date().toLocaleDateString("uz-UZ")}`,
    pageWidth - margin,
    y,
    { align: "right" }
  );
  doc.setTextColor(0);
  y += 15;

  for (const block of blocks) {
    // Check page break
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    switch (block.type) {
      case "heading":
        doc.setFontSize(block.level === 1 ? 15 : block.level === 2 ? 13 : 11);
        doc.setFont("helvetica", "bold");
        doc.text(block.text, margin, y);
        y += block.level === 1 ? 10 : 8;
        break;

      case "paragraph": {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(block.text, maxWidth);
        doc.text(lines, margin, y);
        y += lines.length * 5 + 3;
        break;
      }

      case "list":
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        for (const item of block.items) {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          const lines = doc.splitTextToSize(`\u2022  ${item}`, maxWidth - 10);
          doc.text(lines, margin + 5, y);
          y += lines.length * 5 + 2;
        }
        y += 3;
        break;

      case "numbered-list":
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        block.items.forEach((item, idx) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          const lines = doc.splitTextToSize(
            `${idx + 1}. ${item}`,
            maxWidth - 10
          );
          doc.text(lines, margin + 5, y);
          y += lines.length * 5 + 2;
        });
        y += 3;
        break;

      case "table":
        autoTable(doc, {
          head: [block.headers],
          body: block.rows,
          startY: y,
          margin: { left: margin, right: margin },
          styles: { fontSize: 9, font: "helvetica" },
          headStyles: {
            fillColor: [68, 114, 196],
            textColor: 255,
            fontStyle: "bold",
          },
          alternateRowStyles: { fillColor: [217, 226, 243] },
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        y = (doc as any).lastAutoTable.finalY + 10;
        break;
    }
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.setFont("helvetica", "italic");
  doc.text("UchqunAI tomonidan yaratilgan hujjat", pageWidth / 2, 285, {
    align: "center",
  });

  return Buffer.from(doc.output("arraybuffer"));
}
