"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Panel } from "@/components/ui/Panel";
import { moveEpccReportTemplateComponent, updateEpccReportTemplateComponent, type EpccReportPageId, type EpccReportTemplate, type EpccReportTemplateComponent, type EpccReportTemplateComponentPresentationUpdate } from "../lib/epccReportTemplate";

type EpccReportTemplateEditorProps = {
  template: EpccReportTemplate;
  onChange: (template: EpccReportTemplate) => void;
};

const PAGE_GROUPS: Array<{ id: EpccReportPageId; label: string }> = [
  { id: "company-profit", label: "Company Profit" },
  { id: "year-to-date", label: "Year to Date" },
];

function componentsForPage(template: EpccReportTemplate, page: EpccReportPageId) {
  return template.components
    .filter((component) => component.page === page)
    .sort((left, right) => left.region.localeCompare(right.region) || left.order - right.order);
}

function componentTitle(component: EpccReportTemplateComponent) {
  if (component.type === "monthly-profit") return "Monthly Profit";
  if (component.type === "bonus-profit") return "Bonus Profit";
  if (component.type === "ytd-summary") return "YTD Profit";
  if (component.type === "previous-year-ytd") return "Previous-year YTD";
  if (component.type === "ytd-target") return "YTD Target";
  if (component.type === "target-variance") return "Target Variance";
  if (component.type === "monthly-profit-comparison") return "Monthly Profit Comparison";
  return component.type === "active-marketing-enquiries" ? "Active Marketing Enquiries" : "Conversion Rate";
}

export function EpccReportTemplateEditor({ template, onChange }: EpccReportTemplateEditorProps) {
  const updateComponent = (id: EpccReportTemplateComponent["id"], updates: EpccReportTemplateComponentPresentationUpdate) => {
    let next = updateEpccReportTemplateComponent(template, id, updates);
    if (id === "target-variance" && updates.labels?.varianceBelow) next = updateEpccReportTemplateComponent(next, "ytd-summary", { labels: { ...next.components.find((component) => component.id === "ytd-summary")?.labels, varianceBelow: updates.labels.varianceBelow } });
    onChange(next);
  };

  return (
    <Panel title="Report Components" className="h-fit">
      <div className="grid gap-5">
        {PAGE_GROUPS.map((page) => {
          const components = componentsForPage(template, page.id);
          return (
            <section key={page.id} aria-labelledby={`${page.id}-components-heading`} className="grid gap-2">
              <h2 id={`${page.id}-components-heading`} className="text-xs font-semibold text-muted-foreground">{page.label}</h2>
              <div className="grid gap-2">
                {components.map((component, index) => {
                  const previous = components[index - 1];
                  const next = components[index + 1];
                  const canMoveUp = previous?.region === component.region;
                  const canMoveDown = next?.region === component.region;
                  return (
                    <div key={component.id} className="grid gap-2 rounded-md border border-border/80 bg-background/40 p-2">
                      <div className="flex items-center justify-between gap-2">
                        <label className="flex min-w-0 items-center gap-2 text-sm font-medium">
                          <input
                            type="checkbox"
                            checked={component.enabled}
                            onChange={(event) => updateComponent(component.id, { enabled: event.target.checked })}
                            className="size-4 accent-primary"
                          />
                          <span className="truncate">{componentTitle(component)}</span>
                        </label>
                        <div className="flex shrink-0 gap-1">
                          <button type="button" aria-label={`Move ${componentTitle(component)} up`} disabled={!canMoveUp} onClick={() => onChange(moveEpccReportTemplateComponent(template, component.id, "up"))} className="inline-flex size-8 items-center justify-center rounded-md border border-input text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"><ArrowUp className="size-3.5" aria-hidden="true" /></button>
                          <button type="button" aria-label={`Move ${componentTitle(component)} down`} disabled={!canMoveDown} onClick={() => onChange(moveEpccReportTemplateComponent(template, component.id, "down"))} className="inline-flex size-8 items-center justify-center rounded-md border border-input text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"><ArrowDown className="size-3.5" aria-hidden="true" /></button>
                        </div>
                      </div>
                      <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                        <span>Label</span>
                        <Input aria-label={`${componentTitle(component)} label`} value={component.label} onChange={(event) => updateComponent(component.id, { label: event.target.value })} />
                      </label>
                      {component.type === "monthly-profit" ? <label className="grid gap-1 text-xs font-medium text-muted-foreground"><span>Bonus label</span><Input value={component.labels?.bonus ?? "Bonus Profit"} onChange={(event) => updateComponent(component.id, { labels: { ...component.labels, bonus: event.target.value } })} /></label> : null}
                      {component.type === "target-variance" ? <label className="grid gap-1 text-xs font-medium text-muted-foreground"><span>Below-target label</span><Input value={component.labels?.varianceBelow ?? "Below target"} onChange={(event) => updateComponent(component.id, { labels: { ...component.labels, varianceBelow: event.target.value } })} /></label> : null}
                      {component.type === "ytd-summary" ? <div className="grid gap-2"><label className="grid gap-1 text-xs font-medium text-muted-foreground"><span>Previous-year label</span><Input value={component.labels?.previousYear ?? "YTD"} onChange={(event) => updateComponent(component.id, { labels: { ...component.labels, previousYear: event.target.value } })} /></label><label className="grid gap-1 text-xs font-medium text-muted-foreground"><span>Target label</span><Input value={component.labels?.target ?? "YTD Target"} onChange={(event) => updateComponent(component.id, { labels: { ...component.labels, target: event.target.value } })} /></label><label className="grid gap-1 text-xs font-medium text-muted-foreground"><span>Above-target label</span><Input value={component.labels?.varianceAbove ?? "Above target"} onChange={(event) => updateComponent(component.id, { labels: { ...component.labels, varianceAbove: event.target.value } })} /></label><label className="grid gap-1 text-xs font-medium text-muted-foreground"><span>Below-target label</span><Input value={component.labels?.varianceBelow ?? "Below target"} onChange={(event) => updateComponent(component.id, { labels: { ...component.labels, varianceBelow: event.target.value } })} /></label></div> : null}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </Panel>
  );
}
