export type TrafficInvestigationRange = {
  startDate: string;
  endDate: string;
  baselineStartDate: string;
  baselineEndDate: string;
  baselineDays: number;
  isSingleDay: boolean;
};

export type TrafficInvestigationMetric = {
  selected: number;
  baselineAverage: number;
  difference: number;
  percentageChange: number | null;
};

export type TrafficInvestigationRow = {
  label: string;
  countryId?: string | null;
  sessions: TrafficInvestigationMetric;
};

export type TrafficInvestigation = {
  range: TrafficInvestigationRange;
  summary: {
    sessions: TrafficInvestigationMetric;
    activeUsers: TrafficInvestigationMetric;
    pageViews: TrafficInvestigationMetric;
  };
  contributors: TrafficInvestigationRow[];
  acquisition: TrafficInvestigationRow[];
  landingPages: TrafficInvestigationRow[];
  geography: TrafficInvestigationRow[];
  devices: TrafficInvestigationRow[];
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const MAX_TRAFFIC_INVESTIGATION_BUCKET_DAYS = 3;

function asUtcDate(value: string) {
  if (!ISO_DATE.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

function isoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function addUtcDays(value: Date, days: number) {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

export function parseTrafficInvestigationRange(startDate: string | null, endDate: string | null): TrafficInvestigationRange | null {
  const start = startDate ? asUtcDate(startDate) : null;
  const end = endDate ? asUtcDate(endDate) : null;
  if (!start || !end || start > end) return null;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (end > today) return null;
  const days = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
  if (days > MAX_TRAFFIC_INVESTIGATION_BUCKET_DAYS) return null;
  const baselineDays = days === 1 ? 7 : days;
  return {
    startDate: isoDate(start),
    endDate: isoDate(end),
    baselineStartDate: isoDate(addUtcDays(start, -baselineDays)),
    baselineEndDate: isoDate(addUtcDays(start, -1)),
    baselineDays,
    isSingleDay: days === 1,
  };
}

export function compareTraffic(selected: number, baselineTotal: number, baselineDays: number): TrafficInvestigationMetric {
  const baselineAverage = baselineDays > 0 ? baselineTotal / baselineDays : 0;
  const difference = selected - baselineAverage;
  return {
    selected,
    baselineAverage,
    difference,
    percentageChange: baselineAverage === 0 ? null : (difference / Math.abs(baselineAverage)) * 100,
  };
}

export function rankPositiveContributors(rows: TrafficInvestigationRow[], limit = 3) {
  return rows.filter((row) => row.sessions.difference > 0).sort((left, right) => right.sessions.difference - left.sessions.difference || right.sessions.selected - left.sessions.selected).slice(0, limit);
}
