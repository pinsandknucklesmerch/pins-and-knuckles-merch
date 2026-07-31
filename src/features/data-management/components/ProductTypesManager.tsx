"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { deleteProductType, saveProductType } from "../actions";
import { initialDataManagementActionState, PRICING_CATEGORIES, type AccessLevel, type ProductTypeRecord } from "../types";
import { Select } from "@/components/ui/Select";
import { Surface } from "@/components/ui/Surface";
import { feedback, isInlineValidation } from "@/components/ui/feedback";

const inputClass = "h-9 rounded-md border border-input bg-background px-2.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring";
type SortKey = "name" | "commodityCode" | "pricingCategory";

export function ProductTypesManager({ productTypes, accessLevel }: { productTypes: ProductTypeRecord[]; accessLevel: AccessLevel }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("name");
  const [selected, setSelected] = useState<ProductTypeRecord | null>(null);
  const canWrite = accessLevel !== "read";
  const visible = useMemo(() => productTypes.filter((item) => [item.name, item.commodityCode, item.pricingCategory].join(" ").toLowerCase().includes(query.toLowerCase())).sort((left, right) => left[sort].localeCompare(right[sort])), [productTypes, query, sort]);
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <input aria-label="Search Product Types" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Product Types" className={`${inputClass} w-full sm:w-72`} />
      {canWrite ? <button type="button" onClick={() => setSelected({ id: "", name: "", commodityCode: "", pricingCategory: "TSHIRT", isActive: true })} className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Add Product Type</button> : null}
    </div>
    {selected ? <ProductTypeForm record={selected.id ? selected : null} accessLevel={accessLevel} onClose={() => setSelected(null)} /> : null}
    <Surface className="overflow-x-auto bg-card/70 p-0">
      <table className="min-w-full text-left text-sm"><thead className="bg-secondary/60 text-xs text-muted-foreground"><tr>
        <Header label="Name" active={sort === "name"} onClick={() => setSort("name")} />
        <Header label="Commodity Code" active={sort === "commodityCode"} onClick={() => setSort("commodityCode")} />
        <Header label="Pricing Category" active={sort === "pricingCategory"} onClick={() => setSort("pricingCategory")} />
        <th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Edit</th>
      </tr></thead><tbody>{visible.length ? visible.map((item) => <tr key={item.id} className="border-t border-border/70"><td className="px-4 py-3 font-medium">{item.name}</td><td className="px-4 py-3 font-mono text-xs">{item.commodityCode}</td><td className="px-4 py-3">{item.pricingCategory}</td><td className="px-4 py-3">{item.isActive ? "Active" : "Inactive"}</td><td className="px-4 py-3">{canWrite ? <button type="button" onClick={() => setSelected(item)} className="text-primary hover:underline">Edit</button> : "—"}</td></tr>) : <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No Product Types.</td></tr>}</tbody></table>
    </Surface>
  </div>;
}

function Header({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) { return <th className="px-4 py-3 font-medium"><button type="button" onClick={onClick} className={active ? "text-foreground" : "hover:text-foreground"}>{label}</button></th>; }

function ProductTypeForm({ record, accessLevel, onClose }: { record: ProductTypeRecord | null; accessLevel: AccessLevel; onClose: () => void }) {
  const [saveState, saveAction, pending] = useActionState(saveProductType, initialDataManagementActionState);
  const formId = record ? `product-type-${record.id}` : "new-product-type";
  useEffect(() => { if (!saveState.message) return; if (saveState.ok) feedback.success(record ? "Product Type updated" : "Product Type added"); else if (!isInlineValidation(saveState.message)) feedback.error(saveState.message); }, [record, saveState]);
  return <Surface className="bg-card/80"><form id={formId} action={saveAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    <input name="id" value={record?.id ?? ""} readOnly hidden />
    <label className="grid gap-1 text-sm"><span>Name</span><input required name="name" defaultValue={record?.name ?? ""} className={inputClass} /></label>
    <label className="grid gap-1 text-sm"><span>Commodity Code</span><input required name="commodity_code" defaultValue={record?.commodityCode ?? ""} className={inputClass} /></label>
    <label className="grid gap-1 text-sm"><span>Pricing Category</span><Select required name="pricing_category" defaultValue={record?.pricingCategory ?? "TSHIRT"}>{PRICING_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</Select></label>
    <label className="grid gap-1 text-sm"><span>Active</span><Select name="is_active" defaultValue={record?.isActive === false ? "false" : "true"}><option value="true">Active</option><option value="false">Inactive</option></Select></label>
    {saveState.message && !saveState.ok && isInlineValidation(saveState.message) ? <p role="alert" className="sm:col-span-2 lg:col-span-4 text-sm text-destructive">{saveState.message}</p> : null}
    <div className="flex gap-2 sm:col-span-2 lg:col-span-4"><button disabled={pending} className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50">{pending ? "Saving…" : "Save Product Type"}</button><button type="button" onClick={onClose} className="h-9 rounded-md border border-input px-3 text-sm hover:bg-accent">Close</button></div>
  </form>{record && accessLevel === "admin" ? <div className="mt-3"><DeleteProductType id={record.id} /></div> : null}</Surface>;
}

function DeleteProductType({ id }: { id: string }) { const [state, action, pending] = useActionState(deleteProductType, initialDataManagementActionState); useEffect(() => { if (!state.message) return; if (state.ok) feedback.success("Product Type deleted"); else feedback.error(state.message); }, [state]); return <form action={action} onSubmit={(event) => { if (!window.confirm("Permanently delete this unreferenced Product Type?")) event.preventDefault(); }}><input hidden name="id" value={id} readOnly /><button disabled={pending} className="h-9 rounded-md border border-destructive/60 px-3 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50">Delete</button></form>; }
