export type DashboardView = "overview" | "ytd" | "year-comparison" | "snuggle" | "team-members";

export function parseDashboardView(value: string | undefined): DashboardView {
  if (value === "snuggle") return "snuggle";
  if (value === "team-members") return "team-members";
  if (value === "year-comparison") return "year-comparison";
  if (value === "ytd") return "ytd";
  return "overview";
}
