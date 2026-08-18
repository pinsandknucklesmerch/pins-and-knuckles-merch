"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ArrowDown, ArrowDownUp, ArrowUp, Check, Columns3 } from "lucide-react";
import { useActionState, useEffect, useMemo, useState } from "react";
import { ActionButton } from "@/components/ui/ActionButton";
import { deactivateGarment, saveGarment } from "../actions";
import { formatGarmentCurrency, garmentAriaSort, nextGarmentSort, sortGarments, type GarmentSortKey, type SortDirection } from "../lib/garments";
import { initialDataManagementActionState, type AccessLevel, type GarmentRecord, type ProductTypeRecord } from "../types";
import { Select } from "@/components/ui/Select";
import { Dialog } from "@/components/ui/Dialog";
import { Surface } from "@/components/ui/Surface";
import { feedback, isInlineValidation } from "@/components/ui/feedback";
import { canManagePinsHub, hasPinsHubAccessLevel } from "@/lib/access/pinsHubRoles";

const inputClass = "hub-native-control";
const display = (value: string | number | null) => value ?? "—";
const columnOptions = [
  { key: "brand", label: "Brand" },
  { key: "name", label: "Name" },
  { key: "eurBasePrice", label: "EUR Price" },
  { key: "gbpPrice", label: "GBP Price" },
  { key: "altCode", label: "Alt Code" },
  { key: "colour", label: "Colour" },
  { key: "tags", label: "Tags" },
  { key: "extraSizeCost", label: "Extra Size Cost" },
  { key: "productTypeName", label: "Product Type" },
] as const;
type ColumnKey = (typeof columnOptions)[number]["key"];
type ColumnVisibility = Record<ColumnKey, boolean>;
const defaultColumnVisibility: ColumnVisibility = { brand: true, name: true, eurBasePrice: true, gbpPrice: true, altCode: false, colour: false, tags: false, extraSizeCost: false, productTypeName: true };

export function GarmentsManager({ garments, productTypes, accessLevel }: { garments: GarmentRecord[]; productTypes: ProductTypeRecord[]; accessLevel: AccessLevel }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<GarmentSortKey>("code");
  const [direction, setDirection] = useState<SortDirection>("asc");
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(defaultColumnVisibility);
  const [selected, setSelected] = useState<GarmentRecord | null>(null);
  const canWrite = hasPinsHubAccessLevel(accessLevel, "write");
  const visible = useMemo(() => sortGarments(garments.filter((item) => [item.code, item.altCode, item.brand, item.name, item.colour, item.tags, item.productTypeName].filter(Boolean).join(" ").toLowerCase().includes(query.toLowerCase())), sort, direction), [garments, query, sort, direction]);
  const changeSort = (key: GarmentSortKey) => { const next = nextGarmentSort(sort, direction, key); setSort(next.key); setDirection(next.direction); };
  const show = (key: ColumnKey) => columnVisibility[key];
  const visibleColumnCount = 2 + Object.values(columnVisibility).filter(Boolean).length;
  const extraColumnCount = (["altCode", "colour", "tags", "extraSizeCost"] as const).filter((key) => show(key)).length;

  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><input aria-label="Search garments" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search garments" className={`${inputClass} w-full sm:w-72`} /><div className="flex items-center gap-2"><ColumnsMenu visibility={columnVisibility} onVisibilityChange={setColumnVisibility} />{canWrite ? <button type="button" onClick={() => setSelected({ id: "", code: "", altCode: null, brand: null, name: "", colour: null, tags: null, eurBasePrice: null, gbpPrice: null, extraSizeCost: null, isActive: true, productTypeId: null, productTypeName: null })} className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">Add Garment</button> : null}</div></div>
    {selected ? <GarmentForm record={selected.id ? selected : null} productTypes={productTypes} accessLevel={accessLevel} onClose={() => setSelected(null)} /> : null}
    <Surface className="overflow-x-auto bg-card/70 p-0"><table className={`${extraColumnCount >= 3 ? "min-w-[1050px]" : extraColumnCount ? "min-w-[800px]" : "w-full"} text-left text-sm`}><thead className="bg-secondary/60 text-xs text-muted-foreground"><tr><th className="px-4 py-3">Edit</th><Header label="Code" sortKey="code" sort={sort} direction={direction} onClick={changeSort} />{show("altCode") ? <Header label="Alt Code" sortKey="altCode" sort={sort} direction={direction} onClick={changeSort} /> : null}{show("brand") ? <Header label="Brand" sortKey="brand" sort={sort} direction={direction} onClick={changeSort} /> : null}{show("name") ? <Header label="Name" sortKey="name" sort={sort} direction={direction} onClick={changeSort} /> : null}{show("colour") ? <th className="px-4 py-3">Colour</th> : null}{show("tags") ? <th className="px-4 py-3">Tags</th> : null}{show("productTypeName") ? <Header label="Product Type" sortKey="productTypeName" sort={sort} direction={direction} onClick={changeSort} /> : null}{show("eurBasePrice") ? <Header label="EUR Price" sortKey="eurBasePrice" sort={sort} direction={direction} onClick={changeSort} /> : null}{show("gbpPrice") ? <Header label="GBP Price" sortKey="gbpPrice" sort={sort} direction={direction} onClick={changeSort} /> : null}{show("extraSizeCost") ? <Header label="Extra Size Cost" sortKey="extraSizeCost" sort={sort} direction={direction} onClick={changeSort} /> : null}</tr></thead><tbody>{visible.length ? visible.map((item) => <tr key={item.id} className="border-t border-border/70"><td className="px-4 py-3">{canWrite ? <ActionButton onClick={() => setSelected(item)}>Edit</ActionButton> : "—"}</td><td className="px-4 py-3 font-mono text-xs">{item.code}</td>{show("altCode") ? <td className="px-4 py-3">{display(item.altCode)}</td> : null}{show("brand") ? <td className="px-4 py-3">{display(item.brand)}</td> : null}{show("name") ? <td className="min-w-40 px-4 py-3 font-medium">{item.name}</td> : null}{show("colour") ? <td className="px-4 py-3">{display(item.colour)}</td> : null}{show("tags") ? <td className="max-w-48 truncate px-4 py-3">{display(item.tags)}</td> : null}{show("productTypeName") ? <td className="px-4 py-3">{display(item.productTypeName)}</td> : null}{show("eurBasePrice") ? <td className="px-4 py-3 text-right tabular-nums">{formatGarmentCurrency(item.eurBasePrice, "EUR")}</td> : null}{show("gbpPrice") ? <td className="px-4 py-3 text-right tabular-nums">{formatGarmentCurrency(item.gbpPrice, "GBP")}</td> : null}{show("extraSizeCost") ? <td className="px-4 py-3 text-right tabular-nums">{display(item.extraSizeCost)}</td> : null}</tr>) : <tr><td colSpan={visibleColumnCount} className="px-4 py-10 text-center text-muted-foreground">No garments.</td></tr>}</tbody></table></Surface>
  </div>;
}

function ColumnsMenu({ visibility, onVisibilityChange }: { visibility: ColumnVisibility; onVisibilityChange: (visibility: ColumnVisibility) => void }) {
  return <DropdownMenu.Root><DropdownMenu.Trigger type="button" className="inline-flex h-9 items-center gap-2 rounded-md border border-input px-3 text-sm font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Columns3 className="size-4" aria-hidden="true" />Columns</DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content align="end" sideOffset={6} className="z-50 min-w-44 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg"><DropdownMenu.Arrow className="fill-popover" />{columnOptions.map((column) => <DropdownMenu.CheckboxItem key={column.key} checked={visibility[column.key]} onCheckedChange={(checked) => onVisibilityChange({ ...visibility, [column.key]: checked })} className="flex min-h-8 cursor-pointer select-none items-center gap-2 rounded-sm px-2 text-sm outline-none data-[highlighted]:bg-primary/15 data-[highlighted]:text-foreground"><span className="grid size-3 place-items-center"><DropdownMenu.ItemIndicator><Check className="size-3" aria-hidden="true" /></DropdownMenu.ItemIndicator></span>{column.label}</DropdownMenu.CheckboxItem>)}</DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root>;
}

function Header({ label, sortKey, sort, direction, onClick }: { label: string; sortKey: GarmentSortKey; sort: GarmentSortKey; direction: SortDirection; onClick: (key: GarmentSortKey) => void }) { const active = sort === sortKey; const Icon = active ? direction === "asc" ? ArrowUp : ArrowDown : ArrowDownUp; return <th aria-sort={garmentAriaSort(active, direction)} className="px-4 py-3"><button type="button" onClick={() => onClick(sortKey)} className={`inline-flex items-center gap-1 whitespace-nowrap ${active ? "text-foreground" : "hover:text-foreground"}`}><span>{label}</span><span className="grid size-3 shrink-0 place-items-center"><Icon aria-hidden="true" className={`size-3 ${active ? "text-foreground" : "text-muted-foreground/70"}`} /></span><span className="sr-only">{active ? `, sorted ${direction === "asc" ? "ascending" : "descending"}` : ", not sorted"}</span></button></th>; }

function GarmentForm({ record, productTypes, accessLevel, onClose }: { record: GarmentRecord | null; productTypes: ProductTypeRecord[]; accessLevel: AccessLevel; onClose: () => void }) {
  const [saveState, saveAction, pending] = useActionState(saveGarment, initialDataManagementActionState);
  const activeTypes = productTypes.filter((item) => item.isActive);
  useEffect(() => {
    if (!saveState.message) return;
    if (saveState.ok) feedback.success(record ? "Garment updated" : "Garment added");
    else if (!isInlineValidation(saveState.message)) feedback.error(saveState.message);
  }, [record, saveState]);
  return <Surface className="min-w-0 bg-card/80"><form action={saveAction} className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"><input name="id" value={record?.id ?? ""} readOnly hidden />
    <Field label="Code" name="code" required defaultValue={record?.code ?? ""} /><Field label="Alt Code" name="alt_code" defaultValue={record?.altCode ?? ""} /><Field label="Brand" name="brand_name" defaultValue={record?.brand ?? ""} /><Field label="Name" name="name" required defaultValue={record?.name ?? ""} /><Field label="Colour" name="colour" defaultValue={record?.colour ?? ""} /><label className="grid min-w-0 gap-1 text-sm"><span>Product Type</span><Select required name="product_type_id" defaultValue={record?.productTypeId ?? undefined} placeholder="Select Product Type">{activeTypes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></label><Field label="Tags" name="tags" defaultValue={record?.tags ?? ""} /><NumberField label="EUR Price" name="eur_base_price" value={record?.eurBasePrice} prefix="€" /><NumberField label="GBP Price" name="gbp_price" value={record?.gbpPrice} prefix="£" /><NumberField label="Extra Size Cost" name="extra_size_cost" value={record?.extraSizeCost} />
    {saveState.message && !saveState.ok && isInlineValidation(saveState.message) ? <p role="alert" className="text-sm text-destructive sm:col-span-2 xl:col-span-4">{saveState.message}</p> : null}<div className="flex flex-wrap gap-2 sm:col-span-2 xl:col-span-4"><button disabled={pending} className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50">{pending ? "Saving…" : "Save Garment"}</button><button type="button" onClick={onClose} className="h-9 rounded-md border border-input px-3 text-sm hover:bg-accent">Close</button>{record && canManagePinsHub(accessLevel) ? <DeactivateGarment id={record.id} /> : null}</div></form></Surface>;
}

function Field({ label, name, defaultValue, required = false }: { label: string; name: string; defaultValue: string; required?: boolean }) { return <label className="grid min-w-0 gap-1 text-sm"><span>{label}</span><input required={required} name={name} defaultValue={defaultValue} className={inputClass} /></label>; }
function NumberField({ label, name, value, prefix }: { label: string; name: string; value: number | null | undefined; prefix?: string }) { return <label className="grid min-w-0 gap-1 text-sm"><span>{label}</span><span className="relative min-w-0"><input name={name} type="number" min="0" step="0.01" defaultValue={value ?? ""} className={`${inputClass} ${prefix ? "pl-7" : ""}`} />{prefix ? <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-sm text-muted-foreground">{prefix}</span> : null}</span></label>; }

function DeactivateGarment({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(deactivateGarment, initialDataManagementActionState);
  useEffect(() => { if (!state.message) return; if (state.ok) { feedback.success("Garment deactivated"); setOpen(false); } else feedback.error(state.message); }, [state]);
  return <><button type="button" onClick={() => setOpen(true)} className="h-9 rounded-md border border-destructive/60 px-3 text-sm text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Deactivate</button><Dialog open={open} onClose={() => setOpen(false)} title="Deactivate garment" description="This garment will no longer appear in calculators or the active garment list." className="max-w-md"><form action={action} className="grid gap-4"><input hidden name="id" value={id} readOnly /><div className="flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} className="h-9 rounded-md border border-input px-3 text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Cancel</button><button type="submit" disabled={pending} className="h-9 rounded-md bg-destructive px-3 text-sm font-medium text-destructive-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">{pending ? "Deactivating…" : "Deactivate garment"}</button></div></form></Dialog></>;
}
