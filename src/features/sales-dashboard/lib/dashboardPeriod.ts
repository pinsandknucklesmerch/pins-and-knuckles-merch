export type DashboardSearchParams = Record<string, string | string[] | undefined>;

export type DashboardPeriod = {
  year: number;
  month: number;
};

export function parseDashboardPeriod(params: DashboardSearchParams, now = new Date()): DashboardPeriod {
  const yearValue = params.year;
  const monthValue = params.month;
  const parsedYear = Number(Array.isArray(yearValue) ? yearValue[0] : yearValue);
  const parsedMonth = Number(Array.isArray(monthValue) ? monthValue[0] : monthValue);

  return {
    year: Number.isInteger(parsedYear) && parsedYear >= 2020 ? parsedYear : now.getFullYear(),
    month: Number.isInteger(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12 ? parsedMonth : now.getMonth() + 1,
  };
}
