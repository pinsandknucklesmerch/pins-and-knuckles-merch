"use client";

import { ArrowDown, ArrowDownUp, ArrowUp } from "lucide-react";
import { useActionState, useEffect, useMemo, useState } from "react";
import { ActionButton } from "@/components/ui/ActionButton";
import { deleteProductType, saveProductType } from "../actions";
import { initialDataManagementActionState, PRICING_CATEGORIES, type AccessLevel, type ProductTypeRecord } from "../types";
import { Select } from "@/components/ui/Select";
import { Surface } from "@/components/ui/Surface";
import { feedback, isInlineValidation } from "@/components/ui/feedback";
import { canManagePinsHub, hasPinsHubAccessLevel } from "@/lib/access/pinsHubRoles";
import { normaliseCommodityCode } from "../lib/productTypeValidation";

const inputClass = "hub-native-control";
type SortKey = "name" | "commodityCode" | "pricingCategory";
type SortDirection = "asc" | "desc";

export function ProductTypesManager({ productTypes, accessLevel }: { productTypes: ProductTypeRecord[]; accessLevel: AccessLevel }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("name");
  const [direction, setDirection] = useState<SortDirection>("asc");
  const [selected, setSelected] = useState<ProductTypeRecord | null>(null);
  const canWrite = hasPinsHubAccessLevel(accessLevel, "write");
  const visible = useMemo(() => {
    const multiplier = direction === "asc" ? 1 : -1;
    return productTypes.filter((item) => [item.name, item.commodityCode, item.countryOfOrigin, item.invoiceDescription, item.pricingCategory].join(" ").toLowerCase().includes(query.toLowerCase())).sort((left, right) => left[sort].localeCompare(right[sort]) * multiplier);
  }, [productTypes, query, sort, direction]);
  const changeSort = (key: SortKey) => {
    if (key === sort) setDirection((current) => current === "asc" ? "desc" : "asc");
    else { setSort(key); setDirection("asc"); }
  };
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <input aria-label="Search Product Types" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Product Types" className={`${inputClass} w-full sm:w-72`} />
      {canWrite ? <button type="button" onClick={() => setSelected({ id: "", name: "", commodityCode: "", countryOfOrigin: "", invoiceDescription: "", defaultInvoiceCost: null, invoiceCurrencyCode: null, pricingCategory: "TSHIRT", isActive: true })} className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Add Product Type</button> : null}
    </div>
    {selected ? <ProductTypeForm record={selected.id ? selected : null} accessLevel={accessLevel} onClose={() => setSelected(null)} /> : null}
    <Surface className="overflow-x-auto bg-card/70 p-0">
      <table className="min-w-full text-left text-sm"><thead className="bg-secondary/60 text-xs text-muted-foreground"><tr>
        <th className="px-4 py-3 font-medium">Edit</th>
        <Header label="Name" sortKey="name" sort={sort} direction={direction} onClick={changeSort} />
        <Header label="Commodity Code" sortKey="commodityCode" sort={sort} direction={direction} onClick={changeSort} />
        <Header label="Pricing Category" sortKey="pricingCategory" sort={sort} direction={direction} onClick={changeSort} />
        <th className="px-4 py-3 font-medium">Invoice Details</th>
      </tr></thead><tbody>{visible.length ? visible.map((item) => <tr key={item.id} className="border-t border-border/70"><td className="px-4 py-3">{canWrite ? <ActionButton onClick={() => setSelected(item)}>Edit</ActionButton> : "—"}</td><td className="px-4 py-3 font-medium">{item.name}</td><td className="px-4 py-3 font-mono text-xs">{normaliseCommodityCode(item.commodityCode) || "—"}</td><td className="px-4 py-3">{item.pricingCategory}</td><td className="px-4 py-3">{[item.countryOfOrigin, item.invoiceDescription].filter(Boolean).join(" · ") || "—"}</td></tr>) : <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No Product Types.</td></tr>}</tbody></table>
    </Surface>
  </div>;
}

function Header({ label, sortKey, sort, direction, onClick }: { label: string; sortKey: SortKey; sort: SortKey; direction: SortDirection; onClick: (key: SortKey) => void }) {
  const active = sort === sortKey;
  const Icon = active ? direction === "asc" ? ArrowUp : ArrowDown : ArrowDownUp;
  return <th aria-sort={active ? direction === "asc" ? "ascending" : "descending" : "none"} className="px-4 py-3 font-medium"><button type="button" onClick={() => onClick(sortKey)} className={`inline-flex items-center gap-1 whitespace-nowrap ${active ? "text-foreground" : "hover:text-foreground"}`}><span>{label}</span><span className="grid size-3 shrink-0 place-items-center"><Icon aria-hidden="true" className={`size-3 ${active ? "text-foreground" : "text-muted-foreground/70"}`} /></span><span className="sr-only">{active ? `, sorted ${direction === "asc" ? "ascending" : "descending"}` : ", not sorted"}</span></button></th>;
}

function ProductTypeForm({ record, accessLevel, onClose }: { record: ProductTypeRecord | null; accessLevel: AccessLevel; onClose: () => void }) {
  const [saveState, saveAction, pending] = useActionState(saveProductType, initialDataManagementActionState);
  const formId = record ? `product-type-${record.id}` : "new-product-type";
  useEffect(() => { if (!saveState.message) return; if (saveState.ok) feedback.success(record ? "Product Type updated" : "Product Type added"); else if (!isInlineValidation(saveState.message)) feedback.error(saveState.message); }, [record, saveState]);
  return <Surface className="min-w-0 bg-card/80"><form id={formId} action={saveAction} className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
    <input name="id" value={record?.id ?? ""} readOnly hidden />
    <label className="grid gap-1 text-sm"><span>Name</span><input required name="name" defaultValue={record?.name ?? ""} className={inputClass} /></label>
    <label className="grid gap-1 text-sm"><span>Commodity Code</span><input name="commodity_code" defaultValue={normaliseCommodityCode(record?.commodityCode ?? "")} className={inputClass} /></label>
    <label className="grid gap-1 text-sm"><span>Country of Origin</span><input name="country_of_origin" defaultValue={record?.countryOfOrigin ?? ""} className={inputClass} /></label>
    <label className="grid gap-1 text-sm"><span>Invoice Description</span><input name="invoice_description" defaultValue={record?.invoiceDescription ?? ""} className={inputClass} /></label>
    <label className="grid gap-1 text-sm"><span>Default Invoice Cost</span><input inputMode="decimal" name="default_invoice_cost" defaultValue={record?.defaultInvoiceCost ?? ""} className={inputClass} /></label>
    <label className="grid gap-1 text-sm"><span>Invoice Currency</span><Select name="invoice_currency_code" defaultValue={record?.invoiceCurrencyCode ?? ""}><option value="">—</option><option value="GBP">GBP</option><option value="EUR">EUR</option></Select></label>
    <label className="grid gap-1 text-sm"><span>Pricing Category</span><Select required name="pricing_category" defaultValue={record?.pricingCategory ?? "TSHIRT"}>{PRICING_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</Select></label>
    <label className="grid gap-1 text-sm"><span>Active</span><Select name="is_active" defaultValue={record?.isActive === false ? "false" : "true"}><option value="true">Active</option><option value="false">Inactive</option></Select></label>
    {saveState.message && !saveState.ok && isInlineValidation(saveState.message) ? <p role="alert" className="sm:col-span-2 lg:col-span-4 text-sm text-destructive">{saveState.message}</p> : null}
    <div className="flex gap-2 sm:col-span-2 lg:col-span-4"><button disabled={pending} className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50">{pending ? "Saving…" : "Save Product Type"}</button><button type="button" onClick={onClose} className="h-9 rounded-md border border-input px-3 text-sm hover:bg-accent">Close</button></div>
  </form>{record && canManagePinsHub(accessLevel) ? <div className="mt-3"><DeleteProductType id={record.id} /></div> : null}</Surface>;
}

function DeleteProductType({ id }: { id: string }) { const [state, action, pending] = useActionState(deleteProductType, initialDataManagementActionState); useEffect(() => { if (!state.message) return; if (state.ok) feedback.success("Product Type deleted"); else feedback.error(state.message); }, [state]); return <form action={action} onSubmit={(event) => { if (!window.confirm("Permanently delete this unreferenced Product Type?")) event.preventDefault(); }}><input hidden name="id" value={id} readOnly /><button disabled={pending} className="h-9 rounded-md border border-destructive/60 px-3 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50">Delete</button></form>; }
