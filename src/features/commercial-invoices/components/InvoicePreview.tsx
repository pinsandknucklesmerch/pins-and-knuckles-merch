import { formatMoney, getAddressRows } from "../domain/formatInvoice";
import type { CalculatedInvoice, InvoiceAddress } from "../domain/types";

function AddressBlock({ title, address }: { title: string; address: InvoiceAddress }) {
  return (
    <section className="min-w-0">
      <h3 className="mb-1 border-b border-neutral-300 pb-1 text-[9px] font-bold uppercase tracking-wide">{title}</h3>
      <dl className="grid gap-0.5 text-[8px] leading-3">
        {getAddressRows(address).filter(([, value]) => value.trim()).map(([label, value]) => (
          <div key={label} className="grid grid-cols-[52px_minmax(0,1fr)] gap-1">
            <dt className="font-semibold">{label}</dt>
            <dd className="min-w-0 whitespace-pre-wrap break-words">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function InvoicePreview({ invoice }: { invoice: CalculatedInvoice }) {
  const details = invoice.details;
  return (
    <article id="commercial-invoice-preview" className="invoice-document mx-auto w-full max-w-[1120px] overflow-hidden bg-white p-6 text-neutral-950 shadow-sm print:max-w-none print:shadow-none sm:p-8" aria-label="Commercial invoice preview">
      <header className="flex items-start justify-between gap-4 border-b-2 border-neutral-900 pb-3">
        <h2 className="text-xl font-bold tracking-tight">Commercial Invoice</h2>
        <div className="text-right text-[9px] leading-4">
          <p><span className="font-semibold">Invoice No / Reference:</span> {details.reference}</p>
          <p><span className="font-semibold">Date:</span> {details.date}</p>
        </div>
      </header>

      <section className="mt-4 grid grid-cols-2 gap-6">
        <AddressBlock title="Sender" address={invoice.sender} />
        <AddressBlock title="Receiver" address={invoice.receiver} />
      </section>

      <dl className="mt-4 grid grid-cols-4 gap-x-4 gap-y-1 border-y border-neutral-300 py-2 text-[8px] leading-3">
        {[
          ["Ship Date", details.shipDate], ["Tracking", details.tracking],
          ["Box Count", details.boxCount], ["Weight", details.weight],
          ["Currency", details.currency], ["Print Location", details.printLocation],
          ["Duties Payable By", details.dutiesPayableBy],
        ].map(([label, value]) => <div key={label}><dt className="font-semibold">{label}</dt><dd className="break-words">{value || "—"}</dd></div>)}
      </dl>

      <div className="mt-4 overflow-hidden">
        <table className="w-full table-fixed border-collapse text-left text-[7px] leading-3">
          <thead className="bg-neutral-900 text-white">
            <tr>{["Product", "Design Name", "Type", "Description", "Cost", "Qty", "Total", "Commodity Code", "Country of Origin"].map((label) => <th key={label} className="px-1.5 py-1 font-semibold first:w-[11%]">{label}</th>)}</tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((item) => (
              <tr key={item.id} className="break-inside-avoid border-b border-neutral-200 align-top">
                {[item.product, item.designName, item.type, item.description, formatMoney(item.costValue, details.currency), item.quantityValue.toLocaleString("en-GB"), formatMoney(item.total, details.currency), item.commodityCode, item.countryOfOrigin].map((value, index) => <td key={index} className="break-words px-1.5 py-1.5">{value || "—"}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="ml-auto mt-4 w-56 text-[9px]">
        <div className="flex justify-between border-b border-neutral-300 py-1"><span>Total Quantity</span><strong>{invoice.totals.totalQuantity.toLocaleString("en-GB")}</strong></div>
        <div className="flex justify-between py-1.5 text-[11px]"><span>Final Invoice Total</span><strong>{formatMoney(invoice.totals.grandTotal, details.currency)}</strong></div>
      </section>

      <section className="mt-6 break-inside-avoid border-t border-neutral-300 pt-3 text-[8px] leading-4">
        <h3 className="font-bold">Declaration</h3>
        <p>Print Location: {details.printLocation || "—"}</p>
        <p>I declare that the information on this commercial invoice is true and correct and that the goods were printed in {details.printLocation || "________________"}.</p>
        <div className="mt-5 grid grid-cols-3 gap-8"><p>Name: ____________________</p><p>Signature: ____________________</p><p>Date: ______________</p></div>
      </section>
    </article>
  );
}
