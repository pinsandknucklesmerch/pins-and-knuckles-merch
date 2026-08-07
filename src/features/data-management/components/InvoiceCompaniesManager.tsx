"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { ActionButton } from "@/components/ui/ActionButton";
import { Surface } from "@/components/ui/Surface";
import { feedback } from "@/components/ui/feedback";
import { canManagePinsHub, hasPinsHubAccessLevel } from "@/lib/access/pinsHubRoles";
import { createInvoiceCompanyAction, deleteInvoiceCompanyAction, setInvoiceCompanyActiveAction, updateInvoiceCompanyAction } from "../actions/invoiceDirectoryActions";
import { filterInvoiceCompanies, sortInvoiceCompanies } from "../lib/invoiceDirectory";
import { initialDataManagementActionState, type AccessLevel, type InvoiceCompanyRecord } from "../types";
import { InvoiceDirectoryLifecycleDialog } from "./InvoiceDirectoryLifecycleDialog";

const inputClass = "hub-native-control";
const areaClass = `${inputClass} h-auto min-h-20 resize-y py-2`;

const emptyCompany: InvoiceCompanyRecord = { id: "", organisationId: "", label: "", companyName: "", contactName: "", country: "", eori: "", vatNumber: "", taxId: "", telephone: "", email: "", addressLine1: "", addressLine2: "", city: "", region: "", postalCode: "", notes: "", isActive: true };

export function InvoiceCompaniesManager({ companies, accessLevel }: { companies: InvoiceCompanyRecord[]; accessLevel: AccessLevel }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<InvoiceCompanyRecord | null>(null);
  const canWrite = hasPinsHubAccessLevel(accessLevel, "write");
  const canAdmin = canManagePinsHub(accessLevel);
  const visible = useMemo(() => sortInvoiceCompanies(filterInvoiceCompanies(companies, query)), [companies, query]);

  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <input aria-label="Search Invoice Companies" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Invoice Companies" className={`${inputClass} w-full sm:w-72`} />
      {canWrite ? <ActionButton onClick={() => setSelected(emptyCompany)}>Add Invoice Company</ActionButton> : null}
    </div>
    {selected ? <InvoiceCompanyForm key={selected.id || "new"} record={selected.id ? selected : null} onClose={() => setSelected(null)} /> : null}
    <Surface className="overflow-x-auto bg-card/70 p-0">
      <table className="min-w-[950px] text-left text-sm"><thead className="bg-secondary/60 text-xs text-muted-foreground"><tr><th className="px-4 py-3">Label</th><th className="px-4 py-3">Company</th><th className="px-4 py-3">Country</th><th className="px-4 py-3">EORI</th><th className="px-4 py-3">VAT</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th></tr></thead><tbody>{visible.length ? visible.map((company) => <tr key={company.id} className="border-t border-border/70"><td className="px-4 py-3 font-medium">{company.label}</td><td className="px-4 py-3">{company.companyName}</td><td className="px-4 py-3">{company.country || "—"}</td><td className="px-4 py-3 font-mono text-xs">{company.eori || "—"}</td><td className="px-4 py-3 font-mono text-xs">{company.vatNumber || "—"}</td><td className="max-w-56 truncate px-4 py-3">{company.email || "—"}</td><td className="px-4 py-3">{company.isActive ? "Active" : "Inactive"}</td><td className="px-4 py-3"><div className="flex flex-wrap gap-3">{canWrite ? <button type="button" onClick={() => setSelected(company)} className="text-primary hover:underline">Edit</button> : null}{canAdmin ? <><InvoiceDirectoryLifecycleDialog id={company.id} label="invoice company" active={company.isActive} action={setInvoiceCompanyActiveAction} /><InvoiceDirectoryLifecycleDialog id={company.id} label="invoice company" mode="delete" action={deleteInvoiceCompanyAction} /></> : null}{!canWrite ? "—" : null}</div></td></tr>) : <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">No Invoice Companies.</td></tr>}</tbody></table>
    </Surface>
  </div>;
}

function InvoiceCompanyForm({ record, onClose }: { record: InvoiceCompanyRecord | null; onClose: () => void }) {
  const action = record ? updateInvoiceCompanyAction : createInvoiceCompanyAction;
  const [state, formAction, pending] = useActionState(action, initialDataManagementActionState);
  useEffect(() => { if (!state.message) return; if (state.ok) { feedback.success(state.message); onClose(); } else if (!state.fieldErrors) feedback.error(state.message); }, [onClose, state]);
  return <Surface className="min-w-0 bg-card/80"><form action={formAction} className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4"><input name="id" value={record?.id ?? ""} readOnly hidden />
    <CompanyField label="Label" name="label" required value={record?.label ?? ""} error={state.fieldErrors?.label} /><CompanyField label="Company name" name="companyName" required value={record?.companyName ?? ""} error={state.fieldErrors?.companyName} /><CompanyField label="Contact name" name="contactName" value={record?.contactName ?? ""} /><CompanyField label="Country" name="country" value={record?.country ?? ""} /><CompanyField label="EORI" name="eori" value={record?.eori ?? ""} /><CompanyField label="VAT number" name="vatNumber" value={record?.vatNumber ?? ""} /><CompanyField label="EIN / Tax ID" name="taxId" value={record?.taxId ?? ""} /><CompanyField label="Telephone" name="telephone" value={record?.telephone ?? ""} /><CompanyField label="Email" name="email" type="email" value={record?.email ?? ""} error={state.fieldErrors?.email} /><CompanyField label="Address line 1" name="addressLine1" value={record?.addressLine1 ?? ""} /><CompanyField label="Address line 2" name="addressLine2" value={record?.addressLine2 ?? ""} /><CompanyField label="City" name="city" value={record?.city ?? ""} /><CompanyField label="Region / county" name="region" value={record?.region ?? ""} /><CompanyField label="Postal code" name="postalCode" value={record?.postalCode ?? ""} /><label className="grid gap-1 text-sm sm:col-span-2 lg:col-span-4"><span>Notes</span><textarea name="notes" defaultValue={record?.notes ?? ""} className={areaClass} rows={2} /></label>
    {state.message && !state.ok && state.fieldErrors ? <p role="alert" className="text-sm text-destructive sm:col-span-2 lg:col-span-4">{state.message}</p> : null}<div className="flex gap-2 sm:col-span-2 lg:col-span-4"><button disabled={pending} className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50">{pending ? "Saving…" : record ? "Save Invoice Company" : "Add Invoice Company"}</button><button type="button" onClick={onClose} className="h-9 rounded-md border border-input px-3 text-sm hover:bg-accent">Close</button></div>
  </form></Surface>;
}

function CompanyField({ label, name, value, error, required = false, type = "text" }: { label: string; name: string; value: string; error?: string; required?: boolean; type?: string }) { return <label className="grid min-w-0 gap-1 text-sm"><span className="flex justify-between gap-2">{label}{error ? <span className="text-destructive">{error}</span> : null}</span><input required={required} name={name} type={type} defaultValue={value} className={inputClass} /></label>; }
