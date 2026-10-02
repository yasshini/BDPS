import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Download,
  Printer,
  Receipt,
  Share2,
  X,
} from "lucide-react";
import { InvoiceDocument } from "../../components/invoice/InvoiceDocument";
import {
  downloadInvoicePreviewPdf,
  shareInvoicePreviewPdf,
} from "../../utils/invoicePreviewPdf";
import {
  formatDate,
  formatMoney,
  loadCroppedImageDataUrl,
} from "../../utils/shared";

export function PageHeading({ eyebrow, title, action }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
      </div>
      {action && <div className="page-heading-action">{action}</div>}
    </div>
  );
}

function getInvoicePaymentStatus(invoice) {
  const total = Number(invoice.total ?? 0);
  const paid = Number(invoice.paid_amount ?? 0);
  const balance = Number(
    invoice.balance_amount ?? Math.max(total - paid, 0),
  );
  const isPending = balance > 0 || paid < total;

  return {
    isPending,
    label: isPending ? "Pending" : "Paid",
    balance,
  };
}

export function InvoiceTable({
  invoices,
  onSelectBill,
  emptyTitle,
  emptyMessage,
  compact = false,
}) {
  if (!invoices.length) {
    return <EmptyState icon={Receipt} title={emptyTitle} message={emptyMessage} />;
  }

  return (
    <div className="table-scroll invoice-table-scroll">
      <table className={`data-table${compact ? " compact" : ""}`}>
        <colgroup>
          <col style={{ width: "18%" }} />
          <col style={{ width: "24%" }} />
          <col style={{ width: "18%" }} />
          <col style={{ width: "18%" }} />
          <col style={{ width: "16%" }} />
          <col style={{ width: "6%" }} />
        </colgroup>
        <thead>
          <tr>
            <th>Bill No</th>
            <th>Customer / bike</th>
            <th>Date</th>
            <th className="align-right">Total Amount</th>
            <th className="align-right">Status</th>
            <th aria-label="Bill actions" />
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => {
            const paymentStatus = getInvoicePaymentStatus(invoice);

            return (
              <tr key={invoice.id}>
                <td data-label="Bill">
                  <strong className="table-primary">
                    {invoice.invoice_number}
                  </strong>
                </td>
                <td data-label="Customer / bike">
                  <span className="table-primary">
                    {invoice.customer?.customer_name || "Customer"}
                  </span>
                  <small className="table-secondary">
                    {invoice.bike?.bike_number || "Bike"}
                  </small>
                </td>
                <td data-label="Date">
                  {formatDate(invoice.service_datetime || invoice.created_at)}
                </td>
                <td className="align-right total-amount-column" data-label="Total">
                  <strong>{formatMoney(invoice.total)}</strong>
                </td>
                <td className="align-right" data-label="Status">
                  <div className="status-cell">
                    <span
                      className={`status-badge ${paymentStatus.isPending ? "pending" : "paid"}`}
                    >
                      {paymentStatus.label}
                    </span>
                    {paymentStatus.isPending && paymentStatus.balance > 0 && (
                      <small className="table-secondary">
                        {formatMoney(paymentStatus.balance)} left
                      </small>
                    )}
                  </div>
                </td>
                <td className="table-action" data-label="Open">
                  <button
                    aria-label={`View bill ${invoice.invoice_number}`}
                    className="icon-button"
                    onClick={() => onSelectBill(invoice)}
                    title="View bill"
                    type="button"
                  >
                    <ArrowRight size={16} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="invoice-mobile-list">
        {invoices.map((invoice) => {
          const paymentStatus = getInvoicePaymentStatus(invoice);

          return (
            <article className="invoice-mobile-card" key={invoice.id}>
              <div className="invoice-mobile-card-head">
                <div className="invoice-mobile-number">
                  <small>Bill</small>
                  <strong>{invoice.invoice_number}</strong>
                </div>
                <div className="invoice-mobile-total">
                  <small>Total</small>
                  <strong>{formatMoney(invoice.total)}</strong>
                </div>
                <button
                  aria-label={`View bill ${invoice.invoice_number}`}
                  className="icon-button"
                  onClick={() => onSelectBill(invoice)}
                  title="View bill"
                  type="button"
                >
                  <ArrowRight size={16} />
                </button>
              </div>
              <div className="invoice-mobile-card-meta">
                <div className="invoice-mobile-identity">
                  <strong>{invoice.customer?.customer_name || "Customer"}</strong>
                  <span>{invoice.bike?.bike_number || "Bike"}</span>
                </div>
                <div className="invoice-mobile-status">
                  <span
                    className={`status-badge ${paymentStatus.isPending ? "pending" : "paid"}`}
                  >
                    {paymentStatus.label}
                  </span>
                  {paymentStatus.isPending && paymentStatus.balance > 0 && (
                    <small>{formatMoney(paymentStatus.balance)} left</small>
                  )}
                </div>
              </div>
              <time>{formatDate(invoice.service_datetime || invoice.created_at)}</time>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export function BillHistoryPage({
  invoices,
  notify,
  onSelectBill,
  onEditInvoice,
  selectedBill,
  isAdmin,
  onRequireAdmin,
}) {
  return (
    <>
      <PageHeading
        eyebrow="BILLING"
        title="Bill history"
        // description="A complete record of your workshop's service bills."
        // action={
        //   <span className="result-count">
        //     {invoices.length} {invoices.length === 1 ? "bill" : "bills"}
        //   </span>
        // }
      />
      <section className="surface-card bill-history-card">
        <InvoiceTable
          invoices={invoices}
          onSelectBill={onSelectBill}
          emptyTitle="No bills yet"
          emptyMessage="Saved bills will appear here."
        />
      </section>
      {selectedBill && (
        <InvoiceDetail
          invoice={selectedBill}
          notify={notify}
          onEdit={() => {
            if (!isAdmin) {
              onRequireAdmin?.();
              return;
            }
            onEditInvoice(selectedBill);
          }}
          isAdmin={isAdmin}
          onClose={() => onSelectBill(null)}
        />
      )}
    </>
  );
}

export function InvoiceDetail({ invoice, notify, onClose, onEdit, isAdmin }) {
  const [previewScale, setPreviewScale] = useState(1);
  const [signatureSrc, setSignatureSrc] = useState("/e-sign.png");
  const invoiceElementRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    loadCroppedImageDataUrl("/e-sign.png")
      .then((source) => {
        if (!cancelled) setSignatureSrc(source);
      })
      .catch((error) => {
        if (!cancelled) {
          notify("error", `Could not load the owner's signature: ${error.message}`);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [notify]);

  async function handleDownload() {
    try {
      await downloadInvoicePreviewPdf(invoice, invoiceElementRef.current);
    } catch (error) {
      notify("error", `Could not download this bill: ${error.message}`);
    }
  }

  async function handleShare() {
    try {
      await shareInvoicePreviewPdf(invoice, invoiceElementRef.current);
    } catch (error) {
      notify("error", `Could not share this bill: ${error.message}`);
    }
  }

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  useEffect(() => {
    function updatePreviewScale() {
      const availableWidth =
        document.querySelector(".invoice-detail")?.clientWidth ||
        window.innerWidth;
      setPreviewScale(Math.min(1, Math.max(0.3, (availableWidth - 16) / 793.7)));
    }

    updatePreviewScale();
    window.addEventListener("resize", updatePreviewScale);
    return () => window.removeEventListener("resize", updatePreviewScale);
  }, []);

  return (
    <div
      className="invoice-modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby="bill-modal-title"
        aria-modal="true"
        className="invoice-detail"
        role="dialog"
      >
        <div className="invoice-toolbar no-print">
          <div>
            <h2 id="bill-modal-title">{invoice.invoice_number}</h2>
          </div>
          <div>
            <button
              aria-disabled={!isAdmin}
              className={`button button-subtle${isAdmin ? "" : " action-locked"}`}
              onClick={onEdit}
              type="button"
            >
              Edit bill
            </button>
            {/* <button
              className="button button-subtle"
              onClick={() => window.print()}
              type="button"
            >
              <Printer size={16} />
              Print
            </button> */}
            <button
              className="icon-button"
              onClick={() => window.print()}
              title="Print"
              type="button"
              aria-label="Print invoice"
            >
              <Printer size={18} />
            </button>
            <button
              className="icon-button"
              onClick={handleShare}
              title="Share PDF"
              type="button"
              aria-label="Share invoice PDF"
            >
              <Share2 size={18} />
            </button>
            <button
              className="icon-button"
              onClick={handleDownload}
              title="Download PDF"
              type="button"
              aria-label="Download invoice PDF"
            >
              <Download size={18} />
            </button>
            <button
              aria-label="Close bill details"
              className="icon-button"
              onClick={onClose}
              type="button"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div style={{ zoom: previewScale }}>
          <InvoiceDocument
            invoice={invoice}
            ref={invoiceElementRef}
            signatureSrc={signatureSrc}
          />
        </div>
      </section>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, message }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon size={21} />
      </span>
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  );
}
