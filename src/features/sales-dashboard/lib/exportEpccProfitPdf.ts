import { jsPDF } from "jspdf";

export type EpccProfitPdfData = {
  year: number;
  monthName: string;
  monthlyProfit: number | null;
  yearToDateProfit: number | null;
  previousYear: number;
  previousYearMonthlyProfit: number | null;
};

const formatCurrency = (value: number | null): string => {
  if (value === null) {
    return "Not available";
  }

  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const safeFilenamePart = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export function exportEpccProfitPdf(data: EpccProfitPdfData): void {
  const document = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = document.internal.pageSize.getWidth();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  document.setFillColor(20, 20, 22);
  document.rect(0, 0, pageWidth, 38, "F");

  document.setTextColor(255, 255, 255);
  document.setFont("helvetica", "bold");
  document.setFontSize(19);
  document.text("Pins & Knuckles", margin, 17);

  document.setFont("helvetica", "normal");
  document.setFontSize(11);
  document.text("EPCC Profit Report", margin, 27);

  document.setTextColor(25, 25, 25);
  document.setFont("helvetica", "bold");
  document.setFontSize(16);
  document.text(`${data.monthName} ${data.year}`, margin, 54);

  document.setFont("helvetica", "normal");
  document.setFontSize(9);
  document.setTextColor(100, 100, 100);
  document.text(
    `Generated ${new Intl.DateTimeFormat("en-GB", {
      dateStyle: "long",
    }).format(new Date())}`,
    margin,
    61,
  );

  const cards = [
    {
      label: "Monthly Profit",
      value: formatCurrency(data.monthlyProfit),
      detail: `${data.monthName} ${data.year}`,
    },
    {
      label: "Year-to-Date Profit",
      value: formatCurrency(data.yearToDateProfit),
      detail: `January to ${data.monthName} ${data.year}`,
    },
    {
      label: "Previous Year Monthly Profit",
      value: formatCurrency(data.previousYearMonthlyProfit),
      detail: `${data.monthName} ${data.previousYear}`,
    },
  ];

  let y = 76;

  for (const card of cards) {
    document.setDrawColor(215, 215, 215);
    document.setFillColor(248, 248, 248);
    document.roundedRect(margin, y, contentWidth, 34, 3, 3, "FD");

    document.setFont("helvetica", "normal");
    document.setFontSize(9);
    document.setTextColor(90, 90, 90);
    document.text(card.label.toUpperCase(), margin + 7, y + 9);

    document.setFont("helvetica", "bold");
    document.setFontSize(18);
    document.setTextColor(25, 25, 25);
    document.text(card.value, margin + 7, y + 21);

    document.setFont("helvetica", "normal");
    document.setFontSize(8);
    document.setTextColor(105, 105, 105);
    document.text(card.detail, margin + 7, y + 29);

    y += 42;
  }

  document.setDrawColor(220, 220, 220);
  document.line(margin, 262, pageWidth - margin, 262);

  document.setFont("helvetica", "normal");
  document.setFontSize(8);
  document.setTextColor(115, 115, 115);
  document.text(
    "Pins & Knuckles internal reporting",
    margin,
    270,
  );

  const filename = [
    "epcc-profit-report",
    safeFilenamePart(data.monthName),
    data.year,
  ].join("-");

  document.save(`${filename}.pdf`);
}