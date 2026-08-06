"use client";

import { useMemo, useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { Select } from "@/components/ui/Select";
import { DASHBOARD_MONTHS } from "@/features/sales-dashboard/types";
import { MemberKpiCards, MemberKpiHistoryTable } from "@/features/sales-dashboard/components/MemberKpiPresentation";
import type { MemberPerformanceData } from "@/features/sales-dashboard/data/memberPerformanceRepository";

export function ProfilePerformanceSection({ performance, initialYear, initialMonth }: { performance: MemberPerformanceData | null; initialYear: number; initialMonth: number }) {
  const availableYears = performance?.availableYears ?? [];
  const defaultYear = availableYears.includes(initialYear) ? initialYear : availableYears.at(-1) ?? initialYear;
  const [year, setYear] = useState(defaultYear);
  const [month, setMonth] = useState(initialMonth);
  const yearOptions = availableYears.length ? availableYears : [initialYear];
  const rows = useMemo(() => performance?.rows ?? [], [performance]);

  if (!performance) return <Panel title="Performance"><div className="text-sm font-medium text-foreground">Monday account not linked</div></Panel>;

  return <Panel title="Performance"><div className="mb-3 flex flex-wrap gap-3"><label className="grid min-w-28 gap-1 text-xs font-medium text-muted-foreground">Year<Select aria-label="Performance year" value={String(year)} onValueChange={(value) => setYear(Number(value))}>{yearOptions.map((option) => <option key={option} value={String(option)}>{option}</option>)}</Select></label><label className="grid min-w-36 gap-1 text-xs font-medium text-muted-foreground">Month<Select aria-label="Performance month" value={String(month)} onValueChange={(value) => setMonth(Number(value))}>{DASHBOARD_MONTHS.map((name, index) => <option key={name} value={String(index + 1)}>{name}</option>)}</Select></label></div><MemberKpiCards rows={rows} memberKey={performance.memberKey} year={year} month={month} /><div className="mt-3"><MemberKpiHistoryTable rows={rows} memberKey={performance.memberKey} year={year} month={month} /></div></Panel>;
}
