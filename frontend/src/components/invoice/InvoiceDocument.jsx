import { forwardRef } from "react";
import {
  COMPANY_EMAIL,
  amountInWords,
  formatDate,
  formatMoney,
  formatTime,
} from "../../utils/shared";
import "./InvoiceDocument.css";

function lineTotal(item) {
  return Number(
    item.total_price ??
      Number(item.unit_price || 0) * Number(item.quantity || 0),
  );
}

function lineDiscount(item) {
  return Number(
    item.discount_amount ??
      lineTotal(item) * (Number(item.discount_percentage || 0) / 100),
  );
}

function lineFinalAmount(item) {
  return Number(item.amount ?? lineTotal(item) - lineDiscount(item));
}

export const InvoiceDocument = forwardRef(function InvoiceDocument(
  { invoice, signatureSrc = "/e-sign.png" },
  ref,
) {
  const items = [...(invoice.items || [])].sort(
    (first, second) =>
      Number(first.item_number ?? 0) - Number(second.item_number ?? 0),
  );
  const discountTotal = items.reduce((sum, item) => sum + lineDiscount(item), 0);
  const invoiceDate = invoice.service_datetime || invoice.created_at;

  return (
    <article
      aria-label={`Invoice ${invoice.invoice_number}`}
      className="bdps-invoice-document"
      ref={ref}
    >
      <header className="bdps-invoice-header">
        <div className="bdps-invoice-brand">
          <img src="/bdps-logo.png" alt="BDPS logo" />
          <div>
            <h1>BIKE DOCTOR PIT STOP</h1>
            <p className="bdps-invoice-tagline">Your bikes only choice</p>
            <div className="bdps-invoice-contact">
              <a href="tel:9514231779">
                <span aria-hidden="true" className="bdps-contact-icon">
                  ☎
                </span>
                9514231779
              </a>
              <a href={`mailto:${COMPANY_EMAIL}`}>
                <span aria-hidden="true" className="bdps-contact-icon">
                  ✉
                </span>
                {COMPANY_EMAIL}
              </a>
            </div>
          </div>
        </div>
        <div className="bdps-invoice-locations">
          <section>
            <h2>MAIN BRANCH</h2>
            <p>Anna Colony, 1st Street,</p>
            <p>opp to New ST Courier, Sivakasi</p>
          </section>
          <section>
            <h2>SECOND BRANCH</h2>
            <p>Anna Vegetable Market,</p>
            <p>Opp to Jancy Market, Sivakasi</p>
          </section>
        </div>
      </header>

      <section className="bdps-invoice-parties">
        <div className="bdps-invoice-customer-column">
          <div className="bdps-invoice-number">
            <span>Bill No</span>
            <strong>{invoice.invoice_number}</strong>
          </div>
          <div className="bdps-invoice-customer">
            <h2 className="bdps-invoice-section-label">BILL TO</h2>
            <dl>
              <div>
                <dt>Name</dt>
                <dd>{invoice.customer?.customer_name || "—"}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{invoice.customer?.contact_number || "—"}</dd>
              </div>
              <div>
                <dt>Bike Number</dt>
                <dd>{invoice.bike?.bike_number || "—"}</dd>
              </div>
              <div>
                <dt>Bike Model</dt>
                <dd>{invoice.bike?.bike_model || "—"}</dd>
              </div>
              <div>
                <dt>Kilometer</dt>
                <dd>
                  {invoice.kilometer === null || invoice.kilometer === undefined
                    ? "—"
                    : `${Number(invoice.kilometer).toLocaleString("en-IN")} KM`}
                </dd>
              </div>
            </dl>
          </div>
        </div>
        <div className="bdps-invoice-meta">
          <div className="bdps-invoice-date-time">
            <strong>{formatDate(invoiceDate)}</strong>
            <strong>{formatTime(invoiceDate)}</strong>
          </div>
        </div>
      </section>

      <section className="bdps-invoice-summary">
        <h2 className="bdps-invoice-section-heading">SUMMARY</h2>
        <table>
          <colgroup>
            <col className="bdps-col-number" />
            <col className="bdps-col-description" />
            <col className="bdps-col-quantity" />
            <col className="bdps-col-unit-price" />
            <col className="bdps-col-total" />
            <col className="bdps-col-discount" />
            <col className="bdps-col-final" />
          </colgroup>
          <thead>
            <tr>
              <th>Item No.</th>
              <th>Product / Service</th>
              <th className="bdps-align-center">Quantity</th>
              <th className="bdps-align-right">Price per Unit</th>
              <th className="bdps-align-right">Total Amount</th>
              <th className="bdps-align-right">Discount</th>
              <th className="bdps-align-right">Final Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id ?? `${item.item_name}-${index}`}>
                <td>{item.item_number ?? index + 1}</td>
                <td className="bdps-item-name">{item.item_name}</td>
                <td className="bdps-align-center">{item.quantity}</td>
                <td className="bdps-align-right">{formatMoney(item.unit_price)}</td>
                <td className="bdps-align-right">{formatMoney(lineTotal(item))}</td>
                <td className="bdps-align-right bdps-item-discount">
                  {Number(item.discount_percentage || 0)}% (
                  {formatMoney(lineDiscount(item))})
                </td>
                <td className="bdps-align-right bdps-item-final">
                  {formatMoney(lineFinalAmount(item))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="bdps-invoice-totals">
        <div className="bdps-invoice-words">
          <h2>Amount in Words</h2>
          <p>{amountInWords(invoice.total)}</p>
        </div>
        <div className="bdps-invoice-amounts">
          <div>
            <span>Subtotal</span>
            <strong>{formatMoney(invoice.sub_total)}</strong>
          </div>
          <div>
            <span>Discount (Overall)</span>
            <strong>{formatMoney(discountTotal)}</strong>
          </div>
          <div className="bdps-invoice-grand-total">
            <span>GRAND TOTAL</span>
            <strong>{formatMoney(invoice.total)}</strong>
          </div>
          <div>
            <span>Amount Received</span>
            <strong>{formatMoney(invoice.paid_amount)}</strong>
          </div>
          <div>
            <span>Balance</span>
            <strong>{formatMoney(invoice.balance_amount)}</strong>
          </div>
        </div>
      </section>

      <section className="bdps-invoice-signoff">
        <div className="bdps-invoice-qr">
          <img src="/Payment-QR.png" alt="Payment QR code" />
          <span>Scan to Pay</span>
        </div>
        <div className="bdps-invoice-signature">
          <img src={signatureSrc} alt="" />
          <span>Owner Signature</span>
        </div>
      </section>

      <footer className="bdps-invoice-footer">
        <strong>Thank You!</strong>
        <div>
          <p>Thanks for visiting!</p>
          <p>Ride safe and see you again at BDPS!</p>
          <span>SERVICE • SPARES • CARE</span>
        </div>
      </footer>
    </article>
  );
});
