# Sales Dashboard Reference

This is a repository-verified implementation reference. The high-level authority is [PROJECT_CONTEXT.md](../ai-context/PROJECT_CONTEXT.md); operational ingestion detail is in [INGESTIONS_AND_CRONS.md](../operations/INGESTIONS_AND_CRONS.md).

## Data and route boundary

`/hub/sales-dashboard` accepts `year`, `month`, `dashboardView`, `tv`, and `duration` query state. It loads persisted dashboard data through `src/features/sales-dashboard/data/salesDashboardRepository.ts`; it never fetches Monday or Gmail during a page request. Scheduled jobs and manual scripts validate and persist snapshots for later rendering.

The dashboard uses `sales_kpi_months`, `sales_kpi_member_months`, effective-dated `sales_kpi_targets`, independent `sales_kpi_month_final_values`, and organisation-scoped `sales_dashboard_tv_settings`. Organisation rows take precedence over global rows.

## Views and shared calculations

Views are Overview, Company Profit, YTD, Snuggle, and Team Members. `calculateDashboardKpis.ts` is the company KPI calculation authority; `calculateYearToDate.ts`, `yearComparison.ts`, and `ytdComparison.ts` provide the shared YTD and comparison values. Presentation components consume those values rather than recreating KPI formulas.

- Overview shows the compact Monthly Profit, Sales Inbox, and performance KPIs. The user-facing enquiry metric is **Active Marketing Enquiries**.
- Company Profit uses the dedicated `CompanyProfitView` and `CompanyProfitGauge`: Monthly Profit, Target Profit, Profit Above Target, and Progress. It is distinct from the shared 150%-scale KPI gauge.
- YTD uses the shared comparison series and aggregate rate logic. Its report-relevant metrics are YTD Profit, Monthly Profit, Monthly Profit Comparison, Orders Processed, Active Marketing Enquiries, and Conversion Rate.

## EPCC profit PDF

The dedicated metric export workspace is `/hub/reporting/metrics`. It reuses `ExportMetricsButton`, `buildMetricExportRows`, shared metric definitions, period parsing, and the Sales Dashboard data pipeline. The duplicate Sales Dashboard export controls have been removed.
Reporting is now the canonical location for both EPCC report generation and metric exports. The Sales Dashboard remains the operational KPI/dashboard view and no longer exposes duplicate export controls.

The EPCC editor configures Monthly Profit, Bonus Profit, YTD Profit, Previous-year YTD, YTD Target, Target Variance, Monthly Profit Comparison, Active Marketing Enquiries, and Conversion Rate as independently enabled, ordered presentation components. Persisted templates are normalized against code-defined defaults; legacy nested label customizations migrate to promoted components. Page identity, gauges, chart internals, legends, values, and formulas remain fixed. Configuration remains presentation-only.

The primary EPCC / Company Profit report workspace is `/hub/reporting/epcc`; metric exports remain at `/hub/reporting/metrics`. Both reuse the shared `ProfitPdfExportButton` and `ProfitPdfReport`. `ProfitPdfReport` accepts the typed `EpccReportTemplate`, whose canonical default preserves the existing two-page output and export targets. One organisation-scoped active template is persisted; editing is restricted to existing Pins Hub admins. Configuration controls presentation only, while authoritative Sales Dashboard/domain calculations remain unchanged. Missing or malformed stored configuration falls back safely to the code-defined default. Codex should not run routine verification; Duncan runs the documented verification commands separately unless explicitly requesting Codex to run them.

The active export renders a fixed-width off-screen React subtree (`ProfitPdfReport`) and rasterizes its two `data-profit-pdf-page` sections into landscape A4 PDF pages. It is presentation-only and reuses `companyProfitPresentation`, `ytdChartPoints`, `ytdComparisonValue`, and the existing `CompanyProfitGauge`.

1. **Company Profit**: Monthly Profit, Target, Profit Above Target, and the Company Profit gauge.
2. **Year to Date**: YTD Profit, Monthly Profit, Monthly Profit Comparison, Orders Processed, Active Marketing Enquiries, and Conversion Rate.

## TV and access

TV mode is dashboard query state. Administrators configure six persisted slides—Overview, YTD, Year Comparison, Snuggle, Live Zoo Cam, and Team Members—at `/hub/sales-dashboard/tv/settings`, with enabled state, order, and 10–300 second durations.

From July 2026, Monday owns Quotes Done, Orders Processed, sales-inbox/conversion fields, and associated provenance; EPCC/NetSuite owns company monthly Profit and member Profit/PK Tax. Final values are display overrides and never overwrite source-owned values. Historical workbook fallback remains intentional technical debt until persisted coverage is confirmed.

## Operational boundary

The repository verifies code, persistence contracts, and scheduled configuration. It cannot verify Vercel execution, external credentials, remote Supabase policy/RPC parity, or production KPI rows.
