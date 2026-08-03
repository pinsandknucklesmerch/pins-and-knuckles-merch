export type DashboardView = "overview" | "ytd" | "year-comparison";

export function parseDashboardView(value: string | undefined): DashboardView {
  if (value === "year-comparison") return "year-comparison";
  if (value === "ytd") return "ytd";
  return "overview";
}
