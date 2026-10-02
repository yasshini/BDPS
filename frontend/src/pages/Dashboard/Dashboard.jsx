import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Boxes,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Plus,
} from "lucide-react";
import { formatDate, formatMoney, toLocalDateInputValue } from "../../utils/shared";
import { InvoiceTable, PageHeading } from "../BillHistory/BillHistory";

export function DashboardPage({ data, navigate, onSelectBill, todayDateValue }) {
  const [selectedDate, setSelectedDate] = useState(() =>
    todayDateValue,
  );
  const [selectedSalesMonth, setSelectedSalesMonth] = useState(() =>
    todayDateValue.slice(0, 7),
  );
  const [isSalesMonthPickerOpen, setSalesMonthPickerOpen] = useState(false);
  const [salesPickerYear, setSalesPickerYear] = useState(() =>
    Number(todayDateValue.slice(0, 4)),
  );
  const [isDatePickerOpen, setDatePickerOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const [year, month] = todayDateValue.split("-").map(Number);
    return new Date(year, month - 1, 1, 12);
  });
  const datePickerRef = useRef(null);
  const salesMonthPickerRef = useRef(null);
  const currentCalendarYear = calendarMonth.getFullYear();
  const currentCalendarMonth = calendarMonth.getMonth();
  const firstCalendarDate = new Date(
    currentCalendarYear,
    currentCalendarMonth,
    1,
    12,
  );
  const calendarDates = Array.from(
    { length: 42 },
    (_, index) =>
      new Date(
        currentCalendarYear,
        currentCalendarMonth,
        index - firstCalendarDate.getDay() + 1,
        12,
      ),
  );
  const calendarMonthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(calendarMonth);
  const todayMonthIndex =
    Number(todayDateValue.slice(0, 4)) * 12 +
    Number(todayDateValue.slice(5, 7)) -
    1;
  const visibleMonthIndex = currentCalendarYear * 12 + currentCalendarMonth;

  useEffect(() => {
    if (!isDatePickerOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!datePickerRef.current?.contains(event.target)) {
        setDatePickerOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setDatePickerOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isDatePickerOpen]);

  const summary = data.summary || {};
  const invoiceMonths = data.invoices
    .map((invoice) =>
      toLocalDateInputValue(invoice.service_datetime || invoice.created_at).slice(0, 7),
    )
    .filter((month) => /^\d{4}-(0[1-9]|1[0-2])$/.test(month));
  const firstSalesYear =
    invoiceMonths.length > 0
      ? Math.min(...invoiceMonths.map((month) => Number(month.slice(0, 4))))
      : Number(todayDateValue.slice(0, 4));
  const currentSalesYear = Number(todayDateValue.slice(0, 4));
  const salesYears = Array.from(
    { length: currentSalesYear - firstSalesYear + 1 },
    (_, index) => currentSalesYear - index,
  );
  const salesMonths = Array.from({ length: 12 }, (_, index) => ({
    value: String(index + 1).padStart(2, "0"),
    label: new Intl.DateTimeFormat("en-IN", { month: "long" }).format(
      new Date(2024, index, 1, 12),
    ),
  }));
  const monthlyInvoices = data.invoices.filter(
    (invoice) =>
      toLocalDateInputValue(
        invoice.service_datetime || invoice.created_at,
      ).slice(0, 7) === selectedSalesMonth,
  );
  const monthlySales = monthlyInvoices.reduce(
    (total, invoice) => total + Number(invoice.total || 0),
    0,
  );
  const monthlyCollected = monthlyInvoices.reduce(
    (total, invoice) => total + Number(invoice.paid_amount || 0),
    0,
  );
  const monthlyPending = monthlyInvoices.reduce(
    (total, invoice) =>
      total +
      Number(
        invoice.balance_amount ??
          Math.max(
            Number(invoice.total || 0) - Number(invoice.paid_amount || 0),
            0,
          ),
      ),
    0,
  );
  const selectedSalesMonthLabel = new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(
    new Date(
      Number(selectedSalesMonth.slice(0, 4)),
      Number(selectedSalesMonth.slice(5, 7)) - 1,
      1,
      12,
    ),
  );

  useEffect(() => {
    if (!isSalesMonthPickerOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!salesMonthPickerRef.current?.contains(event.target)) {
        setSalesMonthPickerOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setSalesMonthPickerOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isSalesMonthPickerOpen]);
  const selectedInvoices = data.invoices
    .filter(
      (invoice) =>
        toLocalDateInputValue(invoice.service_datetime || invoice.created_at) ===
        selectedDate,
    )
    .sort(
      (left, right) =>
        new Date(right.service_datetime || right.created_at).getTime() -
        new Date(left.service_datetime || left.created_at).getTime(),
    );
  const selectedSales = selectedInvoices.reduce(
    (total, invoice) => total + Number(invoice.total || 0),
    0,
  );
  const metrics = [
    {
      label: "Sales",
      value: formatMoney(selectedSales),
      detail: `${selectedInvoices.length} bills on ${formatDate(`${selectedDate}T12:00:00`)}`,
      icon: CircleDollarSign,
      tone: "yellow",
    },
    {
      label: "Products",
      value: summary.total_products ?? 0,
      detail: "Active items in stock",
      icon: Boxes,
      tone: "green",
    },
  ];

  return (
    <>
      <PageHeading
        eyebrow="BIKE DOCTOR PIT STOP"
        title="Dashboard"
        description={null}
        action={
          <button
            className="button button-primary"
            onClick={() => navigate("Create bill")}
            type="button"
          >
            <Plus size={18} />
            Create bill
          </button>
        }
      />

      <div className="stats-grid">
        {metrics.map(({ label, value, detail, icon: Icon, tone }) => {
          const cardContent = (
            <>
            <span className={`stat-icon ${tone}`}>
              <Icon size={21} />
            </span>
            <div className="stat-copy">
              <span>{label}</span>
              <strong>{value}</strong>
              <small>{detail}</small>
            </div>
            </>
          );

          return label === "Products" ? (
            <button
              aria-label={`View products: ${value} active items in stock`}
              className="stat-card stat-card-link"
              key={label}
              onClick={() => navigate("Products")}
              type="button"
            >
              {cardContent}
            </button>
          ) : (
            <article className="stat-card" key={label}>
              {cardContent}
            </article>
          );
        })}
      </div>

      <section
        aria-labelledby="monthly-sales-title"
        className={`surface-card monthly-sales-report${isSalesMonthPickerOpen ? " month-picker-open" : ""}`}
      >
        <div className="section-heading">
          <div>
            <h2 id="monthly-sales-title">Monthly sales report</h2>
            <p>{monthlyInvoices.length} bills in {selectedSalesMonthLabel}</p>
          </div>
          <div className="monthly-sales-picker" ref={salesMonthPickerRef}>
            <button
              aria-controls="monthly-sales-picker-options"
              aria-expanded={isSalesMonthPickerOpen}
              aria-haspopup="dialog"
              aria-label={`Selected month: ${selectedSalesMonthLabel}`}
              className="date-filter monthly-sales-month"
              onClick={() => {
                setSalesPickerYear(Number(selectedSalesMonth.slice(0, 4)));
                setSalesMonthPickerOpen((isOpen) => !isOpen);
              }}
              type="button"
            >
              <CalendarDays aria-hidden="true" size={16} />
              <span>{selectedSalesMonthLabel}</span>
              <ChevronDown
                aria-hidden="true"
                className={
                  isSalesMonthPickerOpen
                    ? "month-picker-chevron open"
                    : "month-picker-chevron"
                }
                size={15}
              />
            </button>
            {isSalesMonthPickerOpen && (
              <div
                aria-label="Choose year and month for the sales report"
                className="monthly-sales-month-options"
                id="monthly-sales-picker-options"
                role="dialog"
              >
                <div className="monthly-sales-year-picker">
                  <strong>Year</strong>
                  <div aria-label="Select year" className="monthly-sales-years">
                    {salesYears.map((year) => (
                      <button
                        aria-pressed={year === salesPickerYear}
                        className={`monthly-sales-year-option${year === salesPickerYear ? " selected" : ""}`}
                        key={year}
                        onClick={() => setSalesPickerYear(year)}
                        type="button"
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="monthly-sales-month-picker">
                  <strong>Month</strong>
                  <div aria-label="Select month" className="monthly-sales-months">
                    {salesMonths.map(({ value, label }) => {
                      const monthValue = `${salesPickerYear}-${value}`;
                      const isCurrentSelectedMonth =
                        monthValue === selectedSalesMonth;
                      const isFutureMonth = monthValue > todayDateValue.slice(0, 7);

                      return (
                        <button
                          aria-pressed={isCurrentSelectedMonth}
                          className={`monthly-sales-month-option${isCurrentSelectedMonth ? " selected" : ""}`}
                          disabled={isFutureMonth}
                          key={value}
                          onClick={() => {
                            setSelectedSalesMonth(monthValue);
                            setSalesMonthPickerOpen(false);
                          }}
                          type="button"
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="monthly-sales-metrics">
          <article className="monthly-sales-metric">
            <span>Total sales</span>
            <strong>{formatMoney(monthlySales)}</strong>
          </article>
          <article className="monthly-sales-metric">
            <span>Amount received</span>
            <strong>{formatMoney(monthlyCollected)}</strong>
          </article>
          <article className="monthly-sales-metric">
            <span>Pending Amount</span>
            <strong>{formatMoney(monthlyPending)}</strong>
          </article>
        </div>
      </section>

      <section className="surface-card dashboard-bills">
        <div className="dashboard-bill-header" ref={datePickerRef}>
          <div className="section-heading">
            <h2>Bill summary</h2>
            <div className="dashboard-bill-actions">
              <button
                aria-controls="dashboard-date-picker"
                aria-expanded={isDatePickerOpen}
                aria-label="Choose summary date"
                aria-haspopup="dialog"
                className="date-filter date-filter-trigger"
                onClick={() => setDatePickerOpen((open) => !open)}
                type="button"
              >
                <CalendarDays size={16} aria-hidden="true" />
                <span>{selectedDate.split("-").reverse().join(" - ")}</span>
              </button>
              <button
                className="text-button"
                onClick={() => navigate("Bill history")}
                type="button"
              >
                View all <ArrowRight size={15} />
              </button>
            </div>
          </div>
          {isDatePickerOpen && (
            <div
              aria-label="Choose a date for the sales summary"
              className="date-picker-popover"
              id="dashboard-date-picker"
              role="dialog"
            >
              <div className="date-picker-month">
                <strong aria-live="polite">{calendarMonthLabel}</strong>
                <div className="date-picker-navigation">
                  <button
                    aria-label="Previous month"
                    onClick={() =>
                      setCalendarMonth(
                        new Date(
                          currentCalendarYear,
                          currentCalendarMonth - 1,
                          1,
                          12,
                        ),
                      )
                    }
                    type="button"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    aria-label="Next month"
                    disabled={visibleMonthIndex >= todayMonthIndex}
                    onClick={() =>
                      setCalendarMonth(
                        new Date(
                          currentCalendarYear,
                          currentCalendarMonth + 1,
                          1,
                          12,
                        ),
                      )
                    }
                    type="button"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
              <div aria-hidden="true" className="date-picker-weekdays">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
              <div className="date-picker-days">
                {calendarDates.map((date) => {
                  const dateValue = toLocalDateInputValue(date);
                  const isSelected = dateValue === selectedDate;
                  const isCurrentMonth =
                    date.getMonth() === currentCalendarMonth;
                  const isToday = dateValue === todayDateValue;

                  return (
                    <button
                      aria-label={formatDate(`${dateValue}T12:00:00`)}
                      aria-pressed={isSelected}
                      className={[
                        "date-picker-day",
                        isSelected ? "selected" : "",
                        isCurrentMonth ? "" : "outside-month",
                        isToday ? "today" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      disabled={dateValue > todayDateValue}
                      key={dateValue}
                      onClick={() => {
                        setSelectedDate(dateValue);
                        setDatePickerOpen(false);
                      }}
                      type="button"
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <InvoiceTable
          invoices={selectedInvoices.slice(0, 10)}
          emptyTitle="No bills on this date"
          emptyMessage="Choose another date to view its bill summary."
          onSelectBill={onSelectBill}
          compact
        />
      </section>
    </>
  );
}
