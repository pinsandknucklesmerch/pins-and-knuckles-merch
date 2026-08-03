export type DashboardView = "overview" | "ytd" | "year-comparison" | "snuggle";

export function parseDashboardView(value: string | undefined): DashboardView {
  if (value === "snuggle") return "snuggle";
  if (value === "year-comparison") return "year-comparison";
  if (value === "ytd") return "ytd";
  return "overview";
}
