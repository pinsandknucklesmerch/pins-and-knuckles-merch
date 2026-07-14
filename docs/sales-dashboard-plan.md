# Sales Dashboard Plan

## Route

`/hub/sales-dashboard`

The route stays behind existing Supabase authentication and Pins Hub access control through the hub shell. It is read-only and must not add access bypasses or testing-only permissions.

## Target Feature Structure

```text
src/features/sales-dashboard/
  components/
    DateRangeFilter.tsx
    KpiCard.tsx
    LeadSourceBreakdown.tsx
    SalespersonKpiTable.tsx
    SalesDashboardView.tsx
  data/
    fixtures.ts
    getSalesDashboardData.ts
    mondayClient.server.ts
    mondayQueries.server.ts
  lib/
    calculateKpis.ts
    mapMondayItems.ts
    dateRange.ts
  types.ts
```

Page files should compose the feature and load initial data. They should not contain Monday query strings, column mapping, KPI math, or data normalisation.

## Dashboard Scope

- new incoming leads
- leads split by salesperson
- conversions by salesperson
- conversion rate
- lead source category breakdown
- date range filtering
- total KPI cards
- per-person KPI cards or table rows
- loading, empty, and error states

## Monday Information Needed

### Board IDs

- Leads board ID
- Optional deals/orders board ID if conversions live outside the leads board
- Optional salesperson/users board ID if salesperson metadata is not stored directly on lead items

### Column IDs

Required column IDs should be collected before implementation:

- lead created date
- lead status
- assigned salesperson
- conversion status or converted flag
- converted date
- lead source
- lead value or estimated value, if revenue KPIs are later needed
- person/contact name, if displayed
- company/account, if displayed

### Expected Column Meanings

- Lead created date: date the lead entered the pipeline.
- Assigned salesperson: person, people, text, or status column identifying the owner.
- Lead status: current lead pipeline status.
- Conversion status: value that identifies won/converted leads.
- Converted date: date used for date-range conversion reporting.
- Lead source: source category such as website, referral, repeat customer, social, event, or manual.

## Server-Side Monday Query Flow

1. Server component receives date range params.
2. Validate and normalise the date range in `src/features/sales-dashboard/lib/dateRange.ts`.
3. Call `getSalesDashboardData()` from the route or server component.
4. `getSalesDashboardData()` calls a server-only Monday client.
5. Monday GraphQL requests fetch board items and required columns only.
6. Raw Monday items are passed through `mapMondayItems()`.
7. KPI functions calculate totals, per-person metrics, conversion rates, and source breakdowns.
8. The route renders a compact operational dashboard using feature and shared UI components.

## Mapping And Normalisation

Create a typed normalised record before calculating KPIs:

```ts
type SalesLead = {
  id: string;
  name: string;
  createdAt: string;
  salespersonId: string | null;
  salespersonName: string;
  sourceCategory: string;
  status: string;
  convertedAt: string | null;
  isConverted: boolean;
};
```

Mapping should handle missing, deleted, or renamed Monday values by returning explicit `null`, `Unassigned`, or `Unknown` values rather than throwing inside UI components.

## KPI Calculation Functions

Keep KPI math pure and independently testable:

- `calculateTotalKpis(leads)`
- `calculateSalespersonKpis(leads)`
- `calculateConversionRate(totalLeads, convertedLeads)`
- `calculateLeadSourceBreakdown(leads)`
- `filterLeadsByDateRange(leads, dateRange)`

Do not calculate KPI values inside React components.

## Caching Strategy

- Use server-side fetching only.
- Start with a short cache window suitable for an operational dashboard, for example 5 minutes.
- Add a manual refresh path later only if operators need it.
- Do not cache Monday tokens or expose raw Monday responses to client components.
- Keep fixture data available until live Monday mapping is verified.

## Environment Variables

Server-only:

```text
MONDAY_API_TOKEN=
MONDAY_LEADS_BOARD_ID=
MONDAY_CONVERSIONS_BOARD_ID=
MONDAY_LEAD_CREATED_COLUMN_ID=
MONDAY_LEAD_STATUS_COLUMN_ID=
MONDAY_SALESPERSON_COLUMN_ID=
MONDAY_CONVERSION_STATUS_COLUMN_ID=
MONDAY_CONVERTED_DATE_COLUMN_ID=
MONDAY_LEAD_SOURCE_COLUMN_ID=
```

Do not create `NEXT_PUBLIC_` Monday variables.

## Error Handling

- Missing Monday configuration should return a typed configuration error.
- Monday API failures should return a typed fetch error.
- Mapping failures should include the item id and column id in server logs, not tokens or full payloads.
- UI should show compact shared error states and avoid exposing raw provider errors to users.
- Empty data should show an empty state, not a failed dashboard.

## Implementation Sequence

1. Build fixture data and reusable dashboard UI.
2. Add typed KPI calculation functions.
3. Add a server-side Monday client.
4. Add real Monday data mapping.
5. Replace fixtures with live data after board and column IDs are verified.

## Testing Approach

- Unit test KPI functions with fixture leads.
- Unit test Monday mapping with representative raw column values.
- Test missing optional values such as no salesperson, no source, and no converted date.
- Verify route-level loading, empty, and error states.
- Run `npm run lint`, `npx tsc --noEmit`, and `npm run build` before handoff.
