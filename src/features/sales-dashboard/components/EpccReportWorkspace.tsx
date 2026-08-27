"use client";

import { useMemo, useRef, useState, type RefObject } from "react";
import { ActionButton } from "@/components/ui/ActionButton";
import { Panel } from "@/components/ui/Panel";
import { Select } from "@/components/ui/Select";
import type { SalesDashboardData } from "../domain/types";
import { calculateCompanyMetrics } from "../domain/calculateDashboardKpis";
import { DASHBOARD_MONTHS } from "../types";
import { ProfitPdfExportButton } from "./ProfitPdfExportButton";
import { ProfitPdfReport } from "./ProfitPdfReport";
import { EpccReportTemplateEditor } from "./EpccReportTemplateEditor";
import { cloneEpccReportTemplate, type EpccReportTemplate } from "../lib/epccReportTemplate";
import { persistEpccReportTemplate } from "../actions/epccReportTemplateActions";

type EpccReportWorkspaceProps = {
  data: SalesDashboardData;
  year: number;
  month: number;
  initialTemplate: EpccReportTemplate;
  canEdit: boolean;
};

export function EpccReportWorkspace({ data, year, month, initialTemplate, canEdit }: EpccReportWorkspaceProps) {
  const profitReportRef = useRef<HTMLDivElement>(null);
  const [template, setTemplate] = useState<EpccReportTemplate>(() => cloneEpccReportTemplate(initialTemplate));
  const [draftTemplate, setDraftTemplate] = useState<EpccReportTemplate | null>(null);
  const isEditing = draftTemplate !== null;
  const activeTemplate = draftTemplate ?? template;
  const companyMetrics = useMemo(
    () => calculateCompanyMetrics(data.company, data.previousCompany, data.targets),
    [data.company, data.previousCompany, data.targets],
  );
  const monthlyProfitMetric = companyMetrics.find((metric) => metric.code === "MONTHLY_PROFIT");

  if (!monthlyProfitMetric) {
    throw new Error("Monthly Profit metric is unavailable.");
  }

  return (
    <>
      <Panel>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <form method="get" action="/hub/reporting/epcc" className="flex flex-wrap items-end gap-2">
            <label className="grid min-w-[5.5rem] gap-1 text-xs font-medium text-muted-foreground">
              <span>Year</span>
              <Select aria-label="Report year" className="min-w-[5.5rem]" name="year" defaultValue={String(year)}>
                {data.availableYears.map((value) => <option key={value} value={String(value)}>{value}</option>)}
              </Select>
            </label>
            <label className="grid min-w-[8rem] gap-1 text-xs font-medium text-muted-foreground">
              <span>Month</span>
              <Select aria-label="Report month" className="min-w-[8rem]" name="month" defaultValue={String(month)}>
                {DASHBOARD_MONTHS.map((name, index) => <option key={name} value={String(index + 1)}>{name}</option>)}
              </Select>
            </label>
            <ActionButton type="submit">Apply</ActionButton>
          </form>
          <ProfitPdfExportButton
            profitTargetRef={profitReportRef}
            profitFilename={`pins-profit-report-${DASHBOARD_MONTHS[month - 1].toLowerCase()}-${year}.pdf`}
          />
          {canEdit && !isEditing ? <button type="button" onClick={() => setDraftTemplate(cloneEpccReportTemplate(template))} className="h-9 rounded-md border border-input px-3 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Edit Report</button> : null}
        </div>
      </Panel>
      {isEditing ? <div className="grid min-w-0 gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]"><EpccReportTemplateEditor template={activeTemplate} onChange={setDraftTemplate} /><ReportPreview ref={profitReportRef} year={year} month={month} monthlyProfitMetric={monthlyProfitMetric} yearToDate={data.yearToDate} yearComparison={data.yearComparison} template={activeTemplate} /></div> : <ReportPreview ref={profitReportRef} year={year} month={month} monthlyProfitMetric={monthlyProfitMetric} yearToDate={data.yearToDate} yearComparison={data.yearComparison} template={activeTemplate} />}
      {isEditing ? <div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={() => setDraftTemplate(null)} className="h-9 rounded-md border border-input px-3 text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Cancel</button><button type="button" onClick={() => setDraftTemplate(cloneEpccReportTemplate())} className="h-9 rounded-md border border-input px-3 text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Reset to Default</button><ActionButton type="button" onClick={async () => { if (!draftTemplate) return; const result = await persistEpccReportTemplate(draftTemplate); if (result.ok) { setTemplate(cloneEpccReportTemplate(draftTemplate)); setDraftTemplate(null); } }}>{"Save"}</ActionButton></div> : null}
    </>
  );
}

type ReportPreviewProps = {
  year: number;
  month: number;
  monthlyProfitMetric: NonNullable<ReturnType<typeof calculateCompanyMetrics>[number]>;
  yearToDate: SalesDashboardData["yearToDate"];
  yearComparison: SalesDashboardData["yearComparison"];
  template: EpccReportTemplate;
};

function ReportPreview({ year, month, monthlyProfitMetric, yearToDate, yearComparison, template, ref }: ReportPreviewProps & { ref: RefObject<HTMLDivElement | null> }) {
  return <section aria-label="EPCC report preview" className="min-w-0 overflow-x-auto rounded-md border border-border bg-card"><div ref={ref} className="min-w-[1120px]"><ProfitPdfReport year={year} month={month} monthlyProfitMetric={monthlyProfitMetric} yearToDate={yearToDate} yearComparison={yearComparison} template={template} /></div></section>;
}
