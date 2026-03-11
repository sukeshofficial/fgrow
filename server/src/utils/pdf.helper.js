import PDFDocument from "pdfkit";

export const generatePdfBuffer = (invoice) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40 });

    const buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));

    // HEADER
    doc.fontSize(20).text("TAX INVOICE", { align: "right" });

    doc.moveDown();

    // Seller info
    const seller = invoice.billing_entity || {};
    const sellerAddress = seller.companyAddress || {};

    const client = invoice.client || {};
    const clientAddress = client.address || {};

    // LOGO
    if (seller.logoUrl) {
      try {
        doc.image(seller.logoUrl, 40, 40, { width: 60 });
      } catch (err) {}
    }

    // HEADER
    doc.fontSize(20).text("TAX INVOICE", { align: "right" });

    doc.moveDown();

    // SELLER DETAILS
    doc
      .fontSize(12)
      .text(seller.name || "-")
      .text(sellerAddress.street || "")
      .text(
        `${sellerAddress.city || ""}, ${sellerAddress.state || ""} ${
          sellerAddress.postalCode || ""
        }`,
      )
      .text(sellerAddress.country || "")
      .text(`Mobile: ${seller.companyPhone || "-"}`)
      .text(`Email: ${seller.companyEmail || "-"}`)
      .text(`GSTIN: ${seller.gstNumber || "-"}`)
      .text(`Registration No: ${seller.registrationNumber || "-"}`);

    doc.moveDown();

    // Client Info
    doc.fontSize(12).text("To:");
    doc.text(invoice.client?.name || "-");
    doc.text(invoice.client?.address?.street || "");
    doc.text(invoice.client?.address?.city || "");
    doc.text(invoice.client?.primary_contact_mobile || "");
    doc.text(invoice.client?.primary_contact_email || "");

    doc.moveDown();

    // Invoice Details
    doc.text(`Invoice No: ${invoice.invoice_no}`);
    doc.text(`Invoice Date: ${new Date(invoice.date).toDateString()}`);
    doc.text(`Due Date: ${new Date(invoice.due_date).toDateString()}`);

    doc.moveDown();

    // TABLE HEADER
    const tableTop = doc.y;

    const col1 = 50;
    const col2 = 300;
    const col3 = 380;
    const col4 = 440;
    const col5 = 500;

    doc
      .fontSize(12)
      .text("Description", col1, tableTop)
      .text("Price", col2, tableTop)
      .text("GST %", col3, tableTop)
      .text("GST", col4, tableTop)
      .text("Amount", col5, tableTop);

    doc.moveDown();

    let y = tableTop + 25;

    invoice.items.forEach((item) => {
      const price = item.quantity * item.unit_price;
      const gst = (price * item.gst_rate) / 100;
      const amount = price + gst;

      doc
        .fontSize(10)
        .text(item.description, col1, y)
        .text(price.toFixed(2), col2, y)
        .text(item.gst_rate + "%", col3, y)
        .text(gst.toFixed(2), col4, y)
        .text(amount.toFixed(2), col5, y);

      y += 20;
    });

    doc.moveDown(2);

    // TOTALS
    doc.text(`Subtotal: ₹${invoice.subtotal}`, { align: "right" });
    doc.text(`GST: ₹${invoice.total_gst}`, { align: "right" });
    doc.text(`Round off: ₹${invoice.round_off}`, { align: "right" });

    doc
      .fontSize(14)
      .text(`Total: ₹${invoice.total_amount}`, { align: "right" });

    doc.moveDown();

    doc.fontSize(10).text(`Received: ₹${invoice.amount_received}`, {
      align: "right",
    });

    doc.text(`Balance: ₹${invoice.balance_due}`, { align: "right" });

    doc.end();
  });
};
