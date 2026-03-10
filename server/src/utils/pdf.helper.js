import PDFDocument from "pdfkit";

export const generatePdfBuffer = (invoice) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();

    const buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));

    // PDF content
    doc
      .fontSize(20)
      .text(`Invoice: ${invoice.invoice_no}`, { align: "center" });

    doc.moveDown();
    doc.fontSize(14).text(`Client: ${invoice.client?.name || "-"}`);
    doc.text(`Total Amount: ${invoice.total_amount}`);
    doc.text(`Status: ${invoice.status}`);
    doc.text(`Date: ${new Date(invoice.date).toDateString()}`);

    doc.end();
  });
};
