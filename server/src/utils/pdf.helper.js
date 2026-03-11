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
      } catch (err) { }
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
        `${sellerAddress.city || ""}, ${sellerAddress.state || ""} ${sellerAddress.postalCode || ""
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

export const generateReceiptPdfBuffer = (receipt) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40 });

      const buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      // HEADER & LOGO
      const seller = receipt.billing_entity || {};
      const sellerAddress = seller.companyAddress || {};
      const client = receipt.client || {};
      const clientAddress = client.address || {};

      // Logo (if url/path accessible to server)
      if (seller.logoUrl) {
        try {
          doc.image(seller.logoUrl, 40, 40, { width: 60 });
        } catch (err) {
          // ignore if not loadable
        }
      }

      // Title (right side)
      doc.fontSize(18).text("RECEIPT", { align: "right" });
      doc.moveDown(1.2);

      // Seller
      doc.fontSize(10).text(seller.name || "-", 40, doc.y);
      if (sellerAddress.street) doc.text(sellerAddress.street);
      doc.text(`${sellerAddress.city || ""} ${sellerAddress.state || ""} ${sellerAddress.postalCode || ""}`);
      if (sellerAddress.country) doc.text(sellerAddress.country);
      if (seller.companyPhone) doc.text(`Phone: ${seller.companyPhone}`);
      if (seller.companyEmail) doc.text(`Email: ${seller.companyEmail}`);
      if (seller.gstNumber) doc.text(`GSTIN: ${seller.gstNumber}`);
      doc.moveDown();

      // Receipt & Client block (two columns)
      const leftX = 40;
      const rightX = 320;
      const top = doc.y;

      // Left: Client
      doc.fontSize(10).text("Received From:", leftX, top);
      doc.fontSize(12).text(client.name || "-", leftX, doc.y);
      if (clientAddress.street) doc.text(clientAddress.street, leftX);
      const cityLine = `${clientAddress.city || ""} ${clientAddress.state || ""} ${clientAddress.postalCode || ""}`;
      if (cityLine.trim()) doc.text(cityLine, leftX);
      if (client.primary_contact_mobile) doc.text(`Mobile: ${client.primary_contact_mobile}`, leftX);
      if (client.primary_contact_email) doc.text(`Email: ${client.primary_contact_email}`, leftX);

      // Right: Receipt meta
      const metaTop = top;
      doc.fontSize(10).text(`Receipt No:`, rightX, metaTop);
      doc.fontSize(12).text(receipt.receipt_no || "-", rightX, doc.y - 12);

      doc.fontSize(10).text(`Date:`, rightX, doc.y + 4);
      const dateStr = receipt.date ? new Date(receipt.date).toLocaleDateString() : "";
      doc.fontSize(12).text(dateStr, rightX, doc.y - 12);

      doc.moveDown(2);

      // Payments table header
      const tableTop = doc.y;
      const col1 = 40;
      const col2 = 260;
      const col3 = 360;
      const col4 = 460;

      doc.fontSize(10).text("Payment Mode", col1, tableTop);
      doc.text("Reference", col2, tableTop);
      doc.text("Date", col3, tableTop);
      doc.text("Amount", col4, tableTop, { width: 90, align: "right" });

      doc.moveDown(0.6);
      let y = tableTop + 20;

      // list payments
      (receipt.payments || []).forEach((p) => {
        const dateStr = p.date ? new Date(p.date).toLocaleDateString() : "";
        doc.fontSize(10).text(p.payment_mode || "-", col1, y);
        doc.text(p.reference || "-", col2, y);
        doc.text(dateStr, col3, y);
        doc.text(Number(p.amount || 0).toFixed(2), col4, y, { width: 90, align: "right" });
        y += 18;
      });

      // totals block
      y += 10;
      const rightEdge = 520;
      const labelX = 360;
      const valueX = rightEdge;

      const received = Number(receipt.received_amount || 0);
      const tds = Number(receipt.tds_amount || 0);
      const discount = Number(receipt.discount || 0);
      const roundOff = Number(receipt.round_off || 0);
      const total = Number(receipt.total_amount || 0);

      doc.fontSize(10).text("Received Amount:", labelX, y);
      doc.text(received.toFixed(2), valueX, y, { width: 90, align: "right" });
      y += 16;
      doc.text("TDS:", labelX, y);
      doc.text(tds.toFixed(2), valueX, y, { width: 90, align: "right" });
      y += 16;
      doc.text("Discount:", labelX, y);
      doc.text(discount.toFixed(2), valueX, y, { width: 90, align: "right" });
      y += 16;
      doc.text("Round Off:", labelX, y);
      doc.text(roundOff.toFixed(2), valueX, y, { width: 90, align: "right" });
      y += 16;

      doc.fontSize(12).text("Total Available:", labelX, y);
      doc.fontSize(12).text(`₹ ${total.toFixed(2)}`, valueX, y, { width: 90, align: "right" });
      y += 22;

      // applied invoices (if any)
      if ((receipt.applied_invoices || []).length > 0) {
        doc.moveTo(40, y).lineTo(560, y).strokeOpacity(0.1).stroke();
        y += 6;
        doc.fontSize(11).text("Applied To Invoices:", 40, y);
        y += 18;

        const aCol1 = 40;
        const aCol2 = 220;
        const aCol3 = 380;
        const aCol4 = 480;

        doc.fontSize(10).text("Invoice No", aCol1, y);
        doc.text("Invoice Date", aCol2, y);
        doc.text("Invoice Amount", aCol3, y);
        doc.text("Amount Applied", aCol4, y, { width: 90, align: "right" });
        y += 18;

        (receipt.applied_invoices || []).forEach((ai) => {
          const invDate = ai.invoice_date ? new Date(ai.invoice_date).toLocaleDateString() : "-";
          doc.fontSize(10).text(ai.invoice_no || ai.invoice || "-", aCol1, y);
          doc.text(invDate, aCol2, y);
          doc.text(Number(ai.invoice_amount || 0).toFixed(2), aCol3, y, { width: 90, align: "right" });
          doc.text(Number(ai.amount_applied || 0).toFixed(2), aCol4, y, { width: 90, align: "right" });
          y += 16;
        });
      }

      doc.moveDown(2);

      // remark
      if (receipt.remark) {
        doc.fontSize(10).text("Remark:");
        doc.fontSize(10).text(receipt.remark);
        doc.moveDown();
      }

      // footer / signature area
      doc.moveDown(2);
      doc.fontSize(10).text("For " + (seller.name || ""), { align: "right" });
      doc.moveDown(3);
      doc.fontSize(10).text("Authorised Signatory", { align: "right" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};