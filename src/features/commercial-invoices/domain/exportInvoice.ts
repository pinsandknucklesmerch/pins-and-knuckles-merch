import type { CalculatedInvoice } from "./types.ts";
import {
  formatMoney,
  getAddressBlock,
  getAddressRows,
  getBaseFilename,
} from "./formatInvoice.ts";

export const LINE_ITEM_HEADERS = [
  "Product",
  "Design Name",
  "Type",
  "Description",
  "Cost",
  "Qty",
  "Total",
  "Commodity Code",
  "Country of Origin",
] as const;

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function getExportFilename(
  invoice: CalculatedInvoice,
  extension: "xlsx" | "pdf",
): string {
  return `${getBaseFilename(invoice.details.reference, invoice.details.date)}.${extension}`;
}

export async function exportInvoiceXlsx(invoice: CalculatedInvoice) {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Commercial Invoice");
  const currencyFormat = invoice.details.currency === "GBP" ? "£#,##0.00" : "€#,##0.00";
  worksheet.columns = [20, 24, 18, 28, 14, 10, 14, 22, 22].map((width) => ({ width }));
  worksheet.mergeCells("A1:I1");
  worksheet.getCell("A1").value = "Commercial Invoice";
  worksheet.getCell("A1").font = { bold: true, size: 16 };

  const detailRows = [
    ["Invoice No / Reference", invoice.details.reference],
    ["Date", invoice.details.date],
    ["Ship Date", invoice.details.shipDate],
    ["Tracking", invoice.details.tracking],
    ["Box Count", invoice.details.boxCount],
    ["Weight", invoice.details.weight],
    ["Currency", invoice.details.currency],
    ["Print Location", invoice.details.printLocation],
    ["Duties Payable By", invoice.details.dutiesPayableBy],
  ];
  detailRows.forEach((values, index) => {
    const row = worksheet.getRow(index + 3);
    row.values = values;
    row.getCell(1).font = { bold: true };
  });

  const addressStart = 13;
  worksheet.getCell(`A${addressStart}`).value = "Sender";
  worksheet.getCell(`D${addressStart}`).value = "Receiver";
  worksheet.getCell(`A${addressStart}`).font = { bold: true };
  worksheet.getCell(`D${addressStart}`).font = { bold: true };
  getAddressRows(invoice.sender).forEach((values, index) => {
    const row = worksheet.getRow(addressStart + index + 1);
    row.getCell(1).value = values[0];
    row.getCell(2).value = values[1];
    row.getCell(1).font = { bold: true };
  });
  getAddressRows(invoice.receiver).forEach((values, index) => {
    const row = worksheet.getRow(addressStart + index + 1);
    row.getCell(4).value = values[0];
    row.getCell(5).value = values[1];
    row.getCell(4).font = { bold: true };
  });

  const headerRowNumber = addressStart + 13;
  const header = worksheet.getRow(headerRowNumber);
  header.values = [...LINE_ITEM_HEADERS];
  header.font = { bold: true };
  invoice.lineItems.forEach((item, index) => {
    const row = worksheet.getRow(headerRowNumber + index + 1);
    row.values = [
      item.product,
      item.designName,
      item.type,
      item.description,
      item.costValue,
      item.quantityValue,
      item.total,
      item.commodityCode,
      item.countryOfOrigin,
    ];
    row.getCell(5).numFmt = currencyFormat;
    row.getCell(7).numFmt = currencyFormat;
  });

  const totalRow = headerRowNumber + invoice.lineItems.length + 2;
  worksheet.getCell(`A${totalRow}`).value = "Total Quantity";
  worksheet.getCell(`B${totalRow}`).value = invoice.totals.totalQuantity;
  worksheet.getCell(`A${totalRow + 1}`).value = "Final Invoice Total";
  worksheet.getCell(`B${totalRow + 1}`).value = invoice.totals.grandTotal;
  worksheet.getCell(`B${totalRow + 1}`).numFmt = currencyFormat;
  worksheet.getCell(`A${totalRow}`).font = { bold: true };
  worksheet.getCell(`A${totalRow + 1}`).font = { bold: true };

  const declarationRow = totalRow + 4;
  worksheet.getCell(`A${declarationRow}`).value = "Declaration";
  worksheet.getCell(`A${declarationRow}`).font = { bold: true };
  worksheet.mergeCells(`A${declarationRow + 1}:I${declarationRow + 2}`);
  worksheet.getCell(`A${declarationRow + 1}`).value =
    `I declare that the information on this commercial invoice is true and correct and that the goods were printed in ${invoice.details.printLocation}.`;
  worksheet.getCell(`A${declarationRow + 1}`).alignment = { wrapText: true, vertical: "top" };
  [["A", "Name:"], ["D", "Signature:"], ["G", "Date:"]].forEach(([column, label]) => {
    worksheet.getCell(`${column}${declarationRow + 4}`).value = label;
    worksheet.getCell(`${column}${declarationRow + 4}`).font = { bold: true };
  });
  worksheet.getCell(`B${declarationRow + 4}`).value = "____________________________";
  worksheet.getCell(`E${declarationRow + 4}`).value = "____________________________";
  worksheet.getCell(`H${declarationRow + 4}`).value = "________________";

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer as BlobPart], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    getExportFilename(invoice, "xlsx"),
  );
}

export async function exportInvoicePdf(invoice: CalculatedInvoice) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Commercial Invoice", 40, 36);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  [
    `Invoice No / Reference: ${invoice.details.reference}`,
    `Date: ${invoice.details.date}`,
    `Ship Date: ${invoice.details.shipDate}`,
    `Tracking: ${invoice.details.tracking}`,
    `Box Count: ${invoice.details.boxCount}`,
    `Weight: ${invoice.details.weight}`,
    `Currency: ${invoice.details.currency}`,
    `Print Location: ${invoice.details.printLocation}`,
    `Duties Payable By: ${invoice.details.dutiesPayableBy}`,
  ].forEach((row, index) => doc.text(row, 40, 58 + index * 13));
  doc.setFont("helvetica", "bold");
  doc.text("Sender", 330, 58);
  doc.text("Receiver", 570, 58);
  doc.setFont("helvetica", "normal");
  doc.text(getAddressBlock(invoice.sender), 330, 74, { maxWidth: 210 });
  doc.text(getAddressBlock(invoice.receiver), 570, 74, { maxWidth: 220 });

  autoTable(doc, {
    startY: 205,
    head: [[...LINE_ITEM_HEADERS]],
    body: invoice.lineItems.map((item) => [
      item.product,
      item.designName,
      item.type,
      item.description,
      formatMoney(item.costValue, invoice.details.currency),
      item.quantityValue.toLocaleString("en-GB"),
      formatMoney(item.total, invoice.details.currency),
      item.commodityCode,
      item.countryOfOrigin,
    ]),
    styles: { fontSize: 7, cellPadding: 3, overflow: "linebreak" },
    headStyles: { fillColor: [32, 32, 32], textColor: [255, 255, 255] },
    columnStyles: { 3: { cellWidth: 120 }, 7: { cellWidth: 82 }, 8: { cellWidth: 88 } },
    margin: { left: 40, right: 40 },
  });
  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 420;
  doc.setFont("helvetica", "bold");
  doc.text(`Total Quantity: ${invoice.totals.totalQuantity.toLocaleString("en-GB")}`, 40, finalY + 24);
  doc.text(`Final Invoice Total: ${formatMoney(invoice.totals.grandTotal, invoice.details.currency)}`, 40, finalY + 40);
  const declarationY = finalY + 72;
  if (declarationY > 520) doc.addPage();
  const sectionY = declarationY > 520 ? 48 : declarationY;
  doc.text("Declaration", 40, sectionY);
  doc.setFont("helvetica", "normal");
  doc.text(`Print Location: ${invoice.details.printLocation}`, 40, sectionY + 16);
  doc.text(
    `I declare that the information on this commercial invoice is true and correct and that the goods were printed in ${invoice.details.printLocation}.`,
    40,
    sectionY + 34,
    { maxWidth: 760 },
  );
  doc.text("Name: ____________________________", 40, sectionY + 72);
  doc.text("Signature: ____________________________", 300, sectionY + 72);
  doc.text("Date: __________________", 600, sectionY + 72);
  doc.save(getExportFilename(invoice, "pdf"));
}
