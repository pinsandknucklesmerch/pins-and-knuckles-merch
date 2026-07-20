import type {
  DashboardMonth,
  HistoricalSalesDashboardFixture,
  HistoricalYearData,
  SalesInboxYearData,
  SalespersonMonthlyMetric,
} from "../types";

// Normalized from docs/Monthly Compare.xlsx.
// Percentages are stored as percentage points (for example 59.2 means 59.2%).
// Blank workbook cells remain null; no November or December values are inferred.

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

function normalizeMonth(value: string): DashboardMonth {
  const normalized = value.trim().toLowerCase();
  const month = months.find((candidate) => candidate.toLowerCase() === normalized);
  if (!month) throw new Error(`Unsupported workbook month: ${value}`);
  return month;
}

function normalizeSalespersonName(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized === "cat" || normalized === "catherine") return "Catherine";
  return normalized.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizePercent(value: number | null) {
  return value === null || !Number.isFinite(value) ? null : Number(value.toFixed(2));
}

function normalizeCurrency(value: number | null) {
  return value === null || !Number.isFinite(value) ? null : Number(value.toFixed(2));
}

function createYear(
  year: number,
  enquiries: Array<number | null>,
  conversions: Array<number | null>,
  conversionRates: Array<number | null>,
  profit: Array<number | null>,
): HistoricalYearData {
  return {
    year,
    enquiries: enquiries.map((value) => value ?? null),
    conversions: conversions.map((value) => value ?? null),
    conversionRates: conversionRates.map(normalizePercent),
    profit: profit.map(normalizeCurrency),
  };
}

const years: HistoricalYearData[] = [
  createYear(2021,
    [null, null, null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null, null, null],
    [72735, 71786, 66645, 66726, 68606, 76284, 76961, 92011, 123447, 109966, 140981, 73321]),
  createYear(2022,
    [184, 186, 230, 172, 230, 205, 218, 269, 329, 286, 239, 151],
    [109, 126, 149, 119, 149, 131, 129, 158, 186, 199, 170, 91],
    [59.2, 67.7, 64.8, 69.2, 67.7, 63.9, 59.2, 58.7, 56.5, 69.6, 71.7, 60.3],
    [75195, 78969, 107380, 91168, 112545, 185968, 111189, 91461, 126851, 142821, 113423, 73391]),
  createYear(2023,
    [248, 261, 362, 270, 281, 258, 295, 319, 355, 361, 330, 127],
    [154, 162, 218, 168, 143, 154, 171, 175, 204, 248, 211, 63],
    [62.1, 62, 59.9, 60.4, 50.9, 62.2, 58, 54.9, 57.5, 68.7, 63.9, 49.6],
    [85567, 75576, 114642, 95591, 123912, 147311, 148545, 100958, 132197, 189014, 185581, 64185]),
  createYear(2024,
    [341, 398, 354, 343, 396, 336, 333, 278, 350, 303, 286, 140],
    [198, 232, 229, 218, 239, 189, 196, 162, 215, 173, 167, 66],
    [61.2, 58.3, 64.7, 63.6, 60.4, 55.3, 61.6, 55, 61.4, 59.1, 58, 47],
    [109605, 151625, 123978, 147929, 117736, 133940, 143342, 129997, 163681, 252641, 174801, 80671]),
  createYear(2025,
    [290, 252, 277, 273, 303, 268, 297, 294, 255, 323, null, null],
    [161, 144, 157, 169, 185, 159, 164, 194, 151, 190, null, null],
    [65.4, 57.5, 57, 61.9, 61.1, 59.3, 55.2, 66, 59.2, 58.8, null, null],
    [131411, 137901, 89135, 138441, 166458, 175938, 126161, 143714, 232069, 364197, 193674, null]),
];

function metric(name: string, enquiries: number | null, conversions: number | null, rate: number | null, profit: number | null, average: number | null): SalespersonMonthlyMetric {
  return {
    salespersonName: normalizeSalespersonName(name),
    enquiries,
    conversions,
    conversionRate: normalizePercent(rate),
    totalProfit: normalizeCurrency(profit),
    averageProfitPerJob: normalizeCurrency(average),
  };
}

const salespersonMonths: Record<DashboardMonth, SalespersonMonthlyMetric[]> = {
  January: [metric("HARDUS", 88, 57, 64.7727, 28153, 493.9123), metric("BUX", 55, 37, 67.2727, 15123, 408.7297), metric("BERNIE", 91, 50, 54.9451, 9292, 185.84), metric("CAT", 29, 11, 37.931, 5014, 455.8182), metric("JOHAN", 67, 49, 73.1343, 39635, 808.8776)],
  February: [metric("HARDUS", 124, 77, 62.0968, 31115, 404.0909), metric("BUX", 84, 44, 52.381, 15353, 348.9318), metric("BERNIE", 81, 47, 58.0247, 10195, 216.9149), metric("CAT", 30, 13, 43.3333, 2319, 178.3846), metric("JOHAN", 67, 43, 64.1791, 50347, 1170.8605)],
  March: [metric("HARDUS", 108, 64, 59.2593, 25000, 390.625), metric("BUX", 57, 39, 68.4211, 22886, 586.8205), metric("BERNIE", 60, 36, 60, 11656, 323.7778), metric("CAT", 42, 21, 54, 3907, 186.0476), metric("JOHAN", 84, 66, 79, 57379, 869.3788)],
  April: [metric("HARDUS", 91, 54, 57, 14308, 264.963), metric("BUX", 62, 38, 61.2903, 41399, 1089.4474), metric("BERNIE", 73, 50, 68.4932, 16682, 333.64), metric("CAT", 29, 19, 65.5172, 4514, 237.5789), metric("JOHAN", 66, 48, 72.7273, 41025, 854.6875)],
  May: [metric("HARDUS", 108, 64, 59.2593, 22931, 358.2969), metric("BUX", 65, 40, 61.5385, 17890, 447.25), metric("BERNIE", 84, 44, 52.381, 11927, 271.0682), metric("CAT", 17, 6, 35.2941, 4413, 735.5), metric("JOHAN", 88, 71, 80.6818, 40918, 576.3099)],
  June: [metric("HARDUS", 90, 50, 55.5556, 29838, 596.76), metric("BUX", 81, 36, 44.4444, 19771, 549.1944), metric("BERNIE", 82, 43, 52.439, 18213, 423.5581), metric("CAT", 9, 7, 77.7778, 5148, 735.4286), metric("JOHAN", 54, 41, 75.9259, 56038, 1366.7805)],
  July: [metric("HARDUS", 88, 53, 60.2273, 34036, 642.1887), metric("BUX", 74, 35, 47.2973, 35615, 1017.5714), metric("BERNIE", 67, 38, 56.7164, 19589, 515.5), metric("JOHAN", 82, 56, 68.2927, 45800, 817.8571)],
  August: [metric("HARDUS", 84, 52, 62, 32288, null), metric("BUX", 67, 26, 39, 19878, null), metric("BERNIE", 56, 25, 45, 15370, null), metric("JOHAN", 59, 43, 73, 53663, null)],
  September: [metric("HARDUS", 100, 65, 65, 41321, null), metric("BUX", 87, 49, 56, 40538, null), metric("BERNIE", 73, 35, 48, 13291, null), metric("JOHAN", 74, 57, 77, 53317, null)],
  October: [metric("HARDUS", 93, 58, 62, 39865, null), metric("BUX", 60, 23, 38, 21388, null), metric("BERNIE", 63, 29, 46, 14655, null), metric("JOHAN", 82, 60, 73.2, 106932, null)],
  November: [metric("HARDUS", 105, 62, 59, 28948, null), metric("BUX", 50, 29, 58, 31799, null), metric("BERNIE", 63, 28, 44.4, 11824, null), metric("JOHAN", 52, 35, 67, 64575, null)],
  December: [metric("HARDUS", 40, 20, 50, null, null), metric("BUX", 28, 16, 57.1, null, null), metric("BERNIE", 33, 12, 36.4, null, null), metric("JOHAN", 25, 15, 60, null, null)],
};

const salesInbox: SalesInboxYearData[] = [
  { year: 2022, enquiries: [84, 87, 103, 75, 93, 94, 102, 101, 140, 110, 97, 58], conversions: [36, 46, 51, 43, 53, 49, 50, 41, 61, 55, 51, 28], conversionRates: [42.86, 52.87, 49.51, 57.33, 56.99, 52.13, 49.02, 40.59, 43.57, 50, 52.58, 48.28] },
  { year: 2023, enquiries: [69, 91, 116, 91, 113, 81, 105, 106, 106, 110, 79, 27], conversions: [27, 34, 45, 31, 30, 23, 40, 44, 40, 58, 32, 2], conversionRates: [39.13, 37.36, 38.79, 34.07, 26.55, 28.4, 38.1, 41.51, 37.74, 52.73, 40.51, 7.41] },
  { year: 2024, enquiries: [103, 116, 107, 83, 98, 108, 100, 87, 79, 69, 70, 40], conversions: [48, 44, 46, 34, 35, 29, 37, 28, 30, 21, 22, 9], conversionRates: [46.6, 37.93, 42.99, 40.96, 35.71, 26.85, 37, 32.18, 37.97, 30.43, 31.43, 23] },
  { year: 2025, enquiries: [74, 80, 79, 81, 87, 49, 67, 79, 78, 69, null, null], conversions: [28, 34, 21, 34, 32, 24, 23, 41, 35, 12, null, null], conversionRates: [37.8, 42.5, 26.6, 42, 36.8, 49, 34.3, 51.9, 44.9, 17.4, null, null] },
];

export const historicalSalesDashboardFixture: HistoricalSalesDashboardFixture = {
  years,
  // The workbook does not label these sheets with a year. Their headline totals
  // align most closely with the 2024 monthly data, so they are deliberately
  // scoped to 2024 instead of being repeated for every selectable year.
  salespersonYears: [{
    year: 2024,
    months: Object.fromEntries(
      Object.entries(salespersonMonths).map(([month, rows]) => [normalizeMonth(month), rows]),
    ) as Record<DashboardMonth, SalespersonMonthlyMetric[]>,
  }],
  salesInbox,
};

export { normalizeMonth, normalizePercent, normalizeSalespersonName };
