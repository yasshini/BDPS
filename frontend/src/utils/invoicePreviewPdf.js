import html2canvas from "html2canvas";

export async function createInvoicePreviewPdf(invoice, invoiceElement) {
  if (!invoiceElement) {
    throw new Error("The invoice preview is not available for PDF export.");
  }

  await document.fonts.ready;
  await Promise.all(
    Array.from(invoiceElement.querySelectorAll("img"), (image) => {
      if (image.complete && image.naturalWidth > 0) return Promise.resolve();
      return image.decode();
    }),
  );

  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const canvas = await html2canvas(invoiceElement, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
  });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const fitScale = Math.min(
    pageWidth / canvas.width,
    pageHeight / canvas.height,
  );
  const imageWidth = canvas.width * fitScale;
  const imageHeight = canvas.height * fitScale;
  const image = canvas.toDataURL("image/png");

  pdf.addImage(
    image,
    "PNG",
    (pageWidth - imageWidth) / 2,
    (pageHeight - imageHeight) / 2,
    imageWidth,
    imageHeight,
  );

  return pdf;
}

export async function downloadInvoicePreviewPdf(invoice, invoiceElement) {
  const pdf = await createInvoicePreviewPdf(invoice, invoiceElement);
  const fileName = String(invoice.invoice_number || "invoice").replace(
    /[<>:"/\\|?*]/g,
    "-",
  );

  pdf.save(`${fileName}.pdf`);
}

export async function shareInvoicePreviewPdf(invoice, invoiceElement) {
  const pdf = await createInvoicePreviewPdf(invoice, invoiceElement);
  const fileName = String(invoice.invoice_number || "invoice").replace(
    /[<>:"/\\|?*]/g,
    "-",
  );
  const pdfBlob = pdf.output("blob");
  const file = new File([pdfBlob], `${fileName}.pdf`, {
    type: "application/pdf",
  });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      title: `${fileName} invoice`,
      text: `Invoice ${fileName}`,
      files: [file],
    });
    return true;
  }

  if (typeof window !== "undefined") {
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return false;
}
