import { ClipboardList, FilePlus2, LayoutDashboard, Package } from 'lucide-react';

const NAVIGATION = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Create bill", icon: FilePlus2 },
  { label: "Bill history", icon: ClipboardList },
  { label: "Products", icon: Package },
];

const COMPANY_EMAIL = "bikedoctorrahu@gamail.com";

const EMPTY_DATA = {
  summary: null,
  invoices: [],
  customers: [],
  products: [],
};

function formatMoney(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value, withTime = false) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

function formatTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function toLocalDateInputValue(value) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function amountInWords(value) {
  const ones = [
    "zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
    "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
    "sixteen", "seventeen", "eighteen", "nineteen",
  ];
  const tens = [
    "", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy",
    "eighty", "ninety",
  ];
  const wordsForNumber = (number) => {
    if (number < 20) return ones[number];
    if (number < 100) {
      return `${tens[Math.floor(number / 10)]}${number % 10 ? ` ${ones[number % 10]}` : ""}`;
    }
    if (number < 1000) {
      return `${ones[Math.floor(number / 100)]} hundred${number % 100 ? ` ${wordsForNumber(number % 100)}` : ""}`;
    }
    const units = [
      [10000000, "crore"],
      [100000, "lakh"],
      [1000, "thousand"],
    ];
    const [divisor, unit] = units.find(([size]) => number >= size);
    return `${wordsForNumber(Math.floor(number / divisor))} ${unit}${number % divisor ? ` ${wordsForNumber(number % divisor)}` : ""}`;
  };
  const amount = Math.round(Number(value || 0) * 100);
  const rupees = Math.floor(amount / 100);
  const paise = amount % 100;
  const rupeeWords = `${wordsForNumber(rupees)} ${rupees === 1 ? "rupee" : "rupees"}`;
  const paiseWords = paise
    ? ` and ${wordsForNumber(paise)} paise`
    : "";
  return `${rupeeWords}${paiseWords} only`;
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load image: ${source}`));
    image.src = source;
  });
}

async function loadImageDataUrl(source) {
  const image = await loadImage(source);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not prepare the bill image.");
  context.drawImage(image, 0, 0);
  return canvas.toDataURL("image/png");
}

async function loadCroppedImageDataUrl(source) {
  const image = await loadImage(source);
  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = image.naturalWidth;
  sourceCanvas.height = image.naturalHeight;
  const sourceContext = sourceCanvas.getContext("2d", {
    willReadFrequently: true,
  });
  if (!sourceContext) throw new Error("Could not prepare the signature image.");
  sourceContext.drawImage(image, 0, 0);

  const { data } = sourceContext.getImageData(
    0,
    0,
    sourceCanvas.width,
    sourceCanvas.height,
  );
  let left = sourceCanvas.width;
  let top = sourceCanvas.height;
  let right = 0;
  let bottom = 0;
  for (let y = 0; y < sourceCanvas.height; y += 1) {
    for (let x = 0; x < sourceCanvas.width; x += 1) {
      if (data[(y * sourceCanvas.width + x) * 4 + 3] > 16) {
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    }
  }
  if (right < left || bottom < top) {
    throw new Error("The signature image is empty.");
  }

  const padding = 8;
  left = Math.max(0, left - padding);
  top = Math.max(0, top - padding);
  right = Math.min(sourceCanvas.width - 1, right + padding);
  bottom = Math.min(sourceCanvas.height - 1, bottom + padding);
  const canvas = document.createElement("canvas");
  canvas.width = right - left + 1;
  canvas.height = bottom - top + 1;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not crop the signature image.");
  context.drawImage(
    sourceCanvas,
    left,
    top,
    canvas.width,
    canvas.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return canvas.toDataURL("image/png");
}

async function downloadBillPdf(bill) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const left = 15;
  const right = pageWidth - 15;
  const ink = [17, 17, 17];
  const muted = [105, 105, 105];
  const gold = [242, 196, 0];
  const headerBackground = [255, 253, 245];
  const headerRule = [233, 224, 185];
  const money = (value) =>
    `INR ${Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  const tableAmount = (value) =>
    Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const signatureImage = await loadCroppedImageDataUrl("/e-sign.png");
  const logoImage = await loadImageDataUrl("/bdps-logo.png");
  const paymentQrImage = await loadImageDataUrl("/Payment-QR.png");

  function drawContactIcons() {
    doc.setDrawColor(131, 105, 0);
    doc.setLineWidth(0.35);
    doc.roundedRect(49, 29.4, 2.2, 3.4, 0.5, 0.5, "S");
    doc.line(49.6, 30, 50.6, 30);
    doc.line(49.6, 32.3, 50.6, 32.3);
    doc.rect(49, 35.8, 2.7, 1.9, "S");
    doc.line(49, 35.8, 50.35, 36.9);
    doc.line(51.7, 35.8, 50.35, 36.9);
  }

  function drawHeader(continued = false) {
    doc.setFillColor(...(continued ? ink : headerBackground));
    doc.rect(0, 0, pageWidth, continued ? 23 : 45, "F");
    doc.setDrawColor(...(continued ? gold : headerRule));
    doc.setLineWidth(continued ? 0.6 : 0.3);
    doc.line(left, continued ? 23 : 45, right, continued ? 23 : 45);
    if (continued) {
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("BIKE DOCTOR PIT STOP", left, 16);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(`Bill ${bill.invoice_number} - continued`, right, 16, {
        align: "right",
      });
      return;
    }

    doc.addImage(logoImage, "PNG", left, 8, 30, 30);

    doc.setTextColor(...ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("BIKE DOCTOR PIT STOP", 49, 15);
    doc.setTextColor(...muted);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("SERVICE  •  SPARES  •  CARE", 49, 21);
    doc.setTextColor(...ink);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    drawContactIcons();
    doc.text("9514231779", 53, 32);
    doc.text(COMPANY_EMAIL, 53, 38);

    const locationX = 124;
    doc.setDrawColor(...headerRule);
    doc.line(115, 8, 115, 40);
    doc.setTextColor(...muted);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.text("MAIN BRANCH", locationX, 13);
    doc.text("SERVICE CENTER", locationX + 34, 13);
    doc.setTextColor(...ink);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.text(["Anna Colony, 1st Street,", "opp to New ST Courier, Sivakasi"], locationX, 18);
    doc.text(["Anna Colony, 1st Street,", "opp to New ST Courier, Sivakasi"], locationX + 34, 18);
  }

  drawHeader();
  let y = 54;
  doc.setFillColor(251, 250, 246);
  doc.setDrawColor(233, 229, 216);
  doc.roundedRect(left, y, right - left, 36, 1.5, 1.5, "FD");
  doc.setDrawColor(...gold);
  doc.setLineWidth(1);
  doc.line(left, y + 1, left, y + 9);
  doc.setTextColor(...gold);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("BILL NO.", left + 4, y + 6);
  doc.setTextColor(...ink);
  doc.setFontSize(11);
  doc.text(String(bill.invoice_number || ""), left + 4, y + 12);
  doc.setTextColor(...muted);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("BILL TO", left + 4, y + 19);
  doc.setTextColor(...ink);
  doc.setFontSize(11);
  doc.text(String(bill.customer?.customer_name || "Customer"), left + 4, y + 25);
  doc.setTextColor(...muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(String(bill.customer?.contact_number || "—"), left + 4, y + 31);
  doc.text(`BIKE NUMBER  ${bill.bike?.bike_number || "—"}`, left + 58, y + 25);
  doc.text(`BIKE MODEL  ${bill.bike?.bike_model || "—"}`, left + 58, y + 31);
  doc.text(
    `KILOMETER  ${Number(bill.kilometer || 0).toLocaleString("en-IN")} KM`,
    left + 117,
    y + 25,
  );
  const invoiceMetaX = right - 4;
  doc.setTextColor(...muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const invoiceDate = bill.service_datetime || bill.created_at;
  doc.text(formatDate(invoiceDate), invoiceMetaX, y + 10, { align: "right" });
  doc.text(formatTime(invoiceDate), invoiceMetaX, y + 17, { align: "right" });
  doc.setDrawColor(226, 224, 218);
  doc.line(left, y + 34, right, y + 34);
  y += 43;

  const columns = {
    number: left + 1,
    item: left + 9,
    quantity: left + 78,
    unit: left + 101,
    total: left + 128,
    discount: left + 153,
    amount: right,
  };
  const drawSummaryHeader = () => {
    doc.setTextColor(...muted);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.text("ITEM NO.", columns.number, y + 5);
    doc.text("PRODUCT / SERVICE", columns.item, y + 5);
    doc.text("QTY", columns.quantity, y + 5, { align: "center" });
    doc.text("PRICE / UNIT", columns.unit, y + 5, { align: "right" });
    doc.text("TOTAL", columns.total, y + 5, { align: "right" });
    doc.text("DISCOUNT", columns.discount, y + 5, { align: "right" });
    doc.text("FINAL AMOUNT", columns.amount, y + 5, { align: "right" });
    y += 8;
    doc.setDrawColor(207, 202, 192);
    doc.line(left, y, right, y);
    y += 2;
  };

  doc.setTextColor(...ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("SUMMARY", left, y);
  y += 5;
  drawSummaryHeader();

  const billItems = [...(bill.items || [])].sort(
    (first, second) =>
      Number(first.item_number ?? 0) - Number(second.item_number ?? 0),
  );
  for (const [index, item] of billItems.entries()) {
    const labelLines = doc.splitTextToSize(
      String(item.item_name || "Service item"),
      63,
    );
    const rowHeight = Math.max(14, labelLines.length * 4 + 8);
    if (y + rowHeight > pageHeight - 28) {
      doc.addPage();
      drawHeader(true);
      y = 32;
      drawSummaryHeader();
    }

    const quantity = Number(item.quantity || 0);
    const totalPrice = Number(
      item.total_price ?? Number(item.unit_price || 0) * quantity,
    );
    const discountAmount = Number(
      item.discount_amount ??
        totalPrice * Number(item.discount_percentage || 0) / 100,
    );
    const amount = Number(item.amount ?? totalPrice - discountAmount);
    doc.setTextColor(...ink);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(String(index + 1), columns.number, y + 4);
    doc.text(labelLines, columns.item, y + 4);
    doc.setTextColor(...muted);
    doc.setFontSize(7);
    doc.text(String(quantity), columns.quantity, y + 4, { align: "center" });
    doc.text(tableAmount(item.unit_price), columns.unit, y + 4, { align: "right" });
    doc.setTextColor(...ink);
    doc.text(tableAmount(totalPrice), columns.total, y + 4, { align: "right" });
    doc.setTextColor(...muted);
    doc.setFontSize(6.5);
    doc.text(
      `${Number(item.discount_percentage || 0)}% (${tableAmount(discountAmount)})`,
      columns.discount,
      y + 4,
      { align: "right" },
    );
    doc.setTextColor(...ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text(tableAmount(amount), columns.amount, y + 4, { align: "right" });
    y += rowHeight;
    doc.setDrawColor(232, 230, 224);
    doc.line(left, y, right, y);
    y += 2;
  }

  if (y > pageHeight - 110) {
    doc.addPage();
    drawHeader(true);
    y = 35;
  }

  const discountTotal = billItems.reduce(
    (sum, item) =>
      sum +
      Number(
        item.discount_amount ??
          Number(item.total_price ?? Number(item.unit_price || 0) * Number(item.quantity || 0)) *
            Number(item.discount_percentage || 0) /
            100,
      ),
    0,
  );
  const subtotal = Number(bill.sub_total || 0);
  const total = Number(bill.total || 0);
  const summaryX = right - 72;
  const leftPanelWidth = summaryX - left - 12;

  doc.setTextColor(...muted);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("AMOUNT IN WORDS", left, y + 5);
  doc.setTextColor(...ink);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    doc.splitTextToSize(amountInWords(total), leftPanelWidth),
    left,
    y + 12,
  );

  const summaryRows = [
    ["Subtotal", money(subtotal)],
    ["Discount (Overall)", money(discountTotal)],
    ["GRAND TOTAL", money(total)],
    ["Amount Received", money(bill.paid_amount)],
    ["Balance", money(bill.balance_amount)],
  ];
  summaryRows.forEach(([label, value], index) => {
    const rowY = y + 5 + index * 7;
    if (index === 2) {
      doc.setFillColor(251, 246, 217);
      doc.roundedRect(summaryX - 2, rowY - 5, right - summaryX + 2, 8, 1, 1, "F");
      doc.setDrawColor(...gold);
      doc.line(summaryX - 2, rowY - 5, summaryX - 2, rowY + 3);
      doc.setTextColor(...ink);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
    } else {
      doc.setTextColor(...muted);
      doc.setFont("helvetica", index === 4 ? "bold" : "normal");
      doc.setFontSize(index === 4 ? 9 : 8);
    }
    doc.text(label, summaryX, rowY);
    doc.setFont("helvetica", index === 2 || index === 4 ? "bold" : "normal");
    doc.text(value, right - (index === 2 ? 2 : 0), rowY, { align: "right" });
  });

  const extrasY = y + 47;
  doc.setDrawColor(190, 190, 184);
  doc.setTextColor(...muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.addImage(paymentQrImage, "PNG", left, extrasY, 62, 62);
  doc.setTextColor(...muted);
  doc.setFont("helvetica", "bold");
  doc.text("SCAN TO PAY", left + 36, extrasY + 18);
  doc.addImage(signatureImage, "PNG", right - 52, extrasY + 1, 44, 18);
  doc.setDrawColor(160, 160, 154);
  doc.line(right - 54, extrasY + 22, right - 3, extrasY + 22);
  doc.setTextColor(...muted);
  doc.setFontSize(8);
  doc.text("OWNER SIGNATURE", right - 28, extrasY + 27, {
    align: "center",
  });
  y = Math.max(extrasY + 41, y + 88);
  doc.setFillColor(252, 248, 230);
  doc.roundedRect(left, pageHeight - 27, right - left, 19, 1.5, 1.5, "F");
  doc.setTextColor(...ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Thank You!", left + 6, pageHeight - 16);
  doc.setTextColor(...muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(
    ["Thanks for taking the service.", "Ride safe and see you again at BDPS!"],
    right - 6,
    pageHeight - 19,
    { align: "right" },
  );

  const safeBillNumber = String(bill.invoice_number || "bill").replace(
    /[<>:"/\\|?*]/g,
    "-",
  );
  doc.save(`${safeBillNumber}.pdf`);
}

export { NAVIGATION, COMPANY_EMAIL, EMPTY_DATA, formatMoney, formatDate, formatTime, toLocalDateInputValue, amountInWords, loadImage, loadImageDataUrl, loadCroppedImageDataUrl, downloadBillPdf };
