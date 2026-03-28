import PDFDocument from "pdfkit";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REGULAR_FONT = path.join(__dirname, "../assets/fonts/SpaceMono-Regular.ttf");
const BOLD_FONT = path.join(__dirname, "../assets/fonts/SpaceMono-Bold.ttf");
const LOGO_PATH = path.join(__dirname, "../assets/logo.png");


/**
 * Generates a high-fidelity PDF buffer for an Invoice.
 */
export const generatePdfBuffer = (invoice) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: "A4" });

      const buffers = [];
      doc.on("data", (data) => buffers.push(data));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      // Register Space Mono Fonts
      doc.registerFont("SpaceMono", REGULAR_FONT);
      doc.registerFont("SpaceMono-Bold", BOLD_FONT);


      const seller = invoice.billing_entity || {};
      const sellerAddress = seller.companyAddress || {};
      const client = invoice.client || {};
      const clientAddress = client.address || {};

      // 1. BRANDING & TITLE
      const logoSize = 30;
      let textX = 50;

      try {
        doc.save()
          .circle(50 + logoSize / 2, 55 + logoSize / 2, logoSize / 2)
          .clip()
          .image(LOGO_PATH, 50, 55, { width: logoSize, height: logoSize })
          .restore();
        textX = 50 + logoSize + 12; // Offset text if logo is present
      } catch (e) {
        // Fallback or skip logo
      }

      // Always show seller name in black
      doc.fontSize(18)
        .fillColor("#1e293b")
        .font("SpaceMono-Bold")
        .text(seller.name || "", textX, 55);

      doc.fillColor("#1e293b").fontSize(34).fillColor("#7c3aed").font("SpaceMono-Bold").text("TAX INVOICE", 300, 45, { align: "right" });

      // Divider below header
      doc.moveTo(50, 110).lineTo(545, 110).strokeColor("#f1f5f9").lineWidth(1).stroke();

      // 2. BILLING GRID (Bill From / Bill To)
      const topOfGrid = 135;
      const leftColX = 50;
      const rightColX = 300;

      // Bill From
      doc.fontSize(9).fillColor("#94a3b8").font("SpaceMono-Bold").text("BILL FROM", leftColX, topOfGrid);
      doc.fontSize(11).fillColor("#1e293b").font("SpaceMono-Bold").text(seller.name || "-", leftColX, topOfGrid + 15);

      const formatAddr = (addr) => {
        if (!addr) return "";
        if (typeof addr === 'string') return addr;
        const parts = [addr.street, addr.city, addr.state, addr.postalCode, addr.country].filter(Boolean);
        return parts.join(", ");
      };

      doc.fontSize(10).fillColor("#64748b").font("SpaceMono").text(formatAddr(sellerAddress), leftColX, doc.y + 4, { width: 220, lineGap: 2 });
      if (seller.companyPhone) doc.fontSize(9).text(`M: ${seller.companyPhone}`, leftColX, doc.y + 3);
      if (seller.companyEmail) doc.fontSize(9).text(`E: ${seller.companyEmail}`, leftColX, doc.y + 2);
      if (seller.gstNumber) doc.fontSize(9).fillColor("#1e293b").font("SpaceMono-Bold").text(`GSTIN: ${seller.gstNumber}`, leftColX, doc.y + 3);

      // Bill To
      doc.fontSize(9).fillColor("#94a3b8").font("SpaceMono-Bold").text("BILL TO", rightColX, topOfGrid);
      doc.fontSize(11).fillColor("#1e293b").font("SpaceMono-Bold").text(client.name || "-", rightColX, topOfGrid + 15);
      doc.fontSize(10).fillColor("#64748b").font("SpaceMono").text(formatAddr(clientAddress), rightColX, doc.y + 4, { width: 245, lineGap: 2 });
      if (client.primary_contact_mobile) doc.fontSize(9).text(`M: ${client.primary_contact_mobile}`, rightColX, doc.y + 3);
      if (client.primary_contact_email) doc.fontSize(9).text(`E: ${client.primary_contact_email}`, rightColX, doc.y + 2);
      if (client.gstin) doc.fontSize(9).fillColor("#1e293b").font("SpaceMono-Bold").text(`GSTIN: ${client.gstin}`, rightColX, doc.y + 3);

      // 3. INVOICE META
      const metaY = topOfGrid + 140;
      doc.moveTo(50, metaY - 10).lineTo(545, metaY - 10).strokeColor("#f8fafc").stroke();

      doc.fontSize(9).fillColor("#94a3b8").font("SpaceMono-Bold").text("INVOICE NO", 50, metaY);
      doc.fontSize(10).fillColor("#1e293b").font("SpaceMono-Bold").text(invoice.invoice_no, 50, metaY + 12);

      doc.fontSize(9).fillColor("#94a3b8").font("SpaceMono-Bold").text("DATE", 180, metaY);
      doc.fontSize(10).fillColor("#1e293b").font("SpaceMono-Bold").text(new Date(invoice.date).toLocaleDateString('en-IN'), 180, metaY + 12);

      doc.fontSize(9).fillColor("#94a3b8").font("SpaceMono-Bold").text("DUE DATE", 310, metaY);
      doc.fontSize(10).fillColor("#1e293b").font("SpaceMono-Bold").text(invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-IN') : "-", 310, metaY + 12);

      doc.fontSize(9).fillColor("#94a3b8").font("SpaceMono-Bold").text("BALANCE DUE", 440, metaY, { align: "right", width: 105 });
      doc.fontSize(11).fillColor("#7c3aed").font("SpaceMono-Bold").text(`₹${(invoice.balance_due || 0).toLocaleString('en-IN')}`, 440, metaY + 12, { align: "right", width: 105 });

      // 4. ITEMS TABLE
      const tableTop = metaY + 60;

      const drawTableHeader = (y) => {
        doc.roundedRect(50, y, 495, 28, 6).fill("#f8fafc");
        doc.fillColor("#475569").fontSize(8).font("SpaceMono-Bold");
        doc.text("DESCRIPTION", 65, y + 10);
        doc.text("PRICE", 300, y + 10, { width: 60, align: "right" });
        doc.text("QTY", 370, y + 10, { width: 30, align: "center" });
        doc.text("GST %", 410, y + 10, { width: 40, align: "center" });
        doc.text("AMOUNT", 460, y + 10, { width: 75, align: "right" });
        return y + 28;
      };

      let currentY = drawTableHeader(tableTop);

      (invoice.items || []).forEach((item, idx) => {
        const subDesc = item.meta?.long_description || "";
        const itemHeight = 35 + (subDesc ? 15 : 0);

        if (currentY + itemHeight > 740) {
          doc.addPage();
          currentY = drawTableHeader(50);
        }

        const itemY = currentY + 10;
        const mainDesc = item.description || "-";

        doc.fillColor("#1e293b").fontSize(10).font("SpaceMono-Bold").text(mainDesc, 65, itemY, { width: 230 });
        if (subDesc) {
          doc.fillColor("#64748b").fontSize(8).font("SpaceMono").text(subDesc, 65, doc.y + 2, { width: 230 });
        }

        const rowEndHeight = doc.y;

        const unitPrice = item.unit_price || 0;
        const qty = item.quantity || 1;
        const gstRate = item.gst_rate || 0;
        const totalLineAmount = item.total_amount || (unitPrice * qty);

        doc.fillColor("#1e293b").fontSize(10).font("SpaceMono");
        doc.text(`₹${unitPrice.toLocaleString('en-IN')}`, 300, itemY, { width: 60, align: "right" });
        doc.text(qty.toString(), 370, itemY, { width: 30, align: "center" });
        doc.text(`${gstRate}%`, 410, itemY, { width: 40, align: "center" });
        doc.text(`₹${totalLineAmount.toLocaleString('en-IN')}`, 460, itemY, { width: 75, align: "right" });

        currentY = Math.max(rowEndHeight + 10, itemY + 25);
        doc.moveTo(50, currentY).lineTo(545, currentY).strokeColor("#f1f5f9").lineWidth(0.5).stroke();
      });

      // 5. SUMMARY & TOTALS
      const summaryHeight = (invoice.discount_total > 0 ? 110 : 90) + (invoice.round_off !== 0 ? 20 : 0);
      if (currentY + summaryHeight > 700) {
        doc.addPage();
        currentY = 50;
      }
      const summaryY = currentY + 30;

      // Totals Card on the right
      doc.roundedRect(340, summaryY, 205, summaryHeight, 10).fill("#f8fafc");

      // Remarks on the left (integrated with summary)
      if (invoice.remark) {
        doc.fontSize(9).fillColor("#94a3b8").font("SpaceMono-Bold").text("REMARKS / NOTES", 50, summaryY + 10);
        doc.fontSize(9).fillColor("#64748b").font("SpaceMono").text(invoice.remark, 50, summaryY + 25, { width: 280, lineGap: 2 });
      }

      const drawTotalRow = (label, value, y, isBold = false, isFinal = false) => {
        doc.fontSize(isBold ? 11 : 9).fillColor(isFinal ? "#7c3aed" : "#64748b").font(isBold ? "SpaceMono-Bold" : "SpaceMono");
        doc.text(label, 355, y);
        doc.text(`₹${(value || 0).toLocaleString('en-IN')}`, 465, y, { width: 70, align: "right" });
      };

      let finalY = summaryY + 15;
      drawTotalRow("Subtotal", invoice.subtotal || 0, finalY);
      finalY += 18;
      drawTotalRow("Tax Total (GST)", invoice.total_gst || 0, finalY);
      if (invoice.discount_total > 0) {
        finalY += 18;
        drawTotalRow("Discount", invoice.discount_total || 0, finalY);
      }
      if (invoice.round_off !== 0) {
        finalY += 18;
        drawTotalRow("Round Off", invoice.round_off || 0, finalY);
      }

      finalY += 22;
      doc.moveTo(355, finalY - 8).lineTo(530, finalY - 8).strokeColor("#e2e8f0").lineWidth(1).dash(2, { space: 2 }).stroke().undash();
      doc.fontSize(12).fillColor("#7c3aed").font("SpaceMono-Bold");
      doc.text("TOTAL", 355, finalY);
      doc.text(`₹${(invoice.total_amount || 0).toLocaleString('en-IN')}`, 465, finalY, { width: 70, align: "right" });

      // 6. FOOTER

      const footerY = 780;
      doc.moveTo(50, footerY - 10).lineTo(545, footerY - 10).strokeColor("#f1f5f9").stroke();
      doc.fontSize(8).fillColor("#94a3b8").text("This is a computer generated invoice and does not require a physical signature.", 50, footerY, { align: "center", width: 495 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

export const generateReceiptPdfBuffer = (receipt) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40 });
      const buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      // Register Space Mono Fonts
      doc.registerFont("SpaceMono", REGULAR_FONT);
      doc.registerFont("SpaceMono-Bold", BOLD_FONT);


      const seller = receipt.billing_entity || {};
      const sellerAddress = seller.companyAddress || {};
      const client = receipt.client || {};
      const clientAddress = client.address || {};

      const logoSize = 30;
      try {
        doc.save()
          .circle(40 + logoSize / 2, 40 + logoSize / 2, logoSize / 2)
          .clip()
          .image(LOGO_PATH, 40, 40, { width: logoSize, height: logoSize })
          .restore();
      } catch (err) { }

      doc.fontSize(18).font("SpaceMono-Bold").text("RECEIPT", { align: "right" });
      doc.moveDown(1.2);

      doc.fontSize(10).text(seller.name || "-", 40, doc.y);
      if (sellerAddress.street) doc.text(sellerAddress.street);
      doc.text(`${sellerAddress.city || ""} ${sellerAddress.state || ""} ${sellerAddress.postalCode || ""}`);
      if (seller.companyPhone) doc.text(`Phone: ${seller.companyPhone}`);
      if (seller.companyEmail) doc.text(`Email: ${seller.companyEmail}`);
      if (seller.gstNumber) doc.text(`GSTIN: ${seller.gstNumber}`);
      doc.moveDown();

      const leftX = 40;
      const rightX = 320;
      const top = doc.y;

      doc.fontSize(10).text("Received From:", leftX, top);
      doc.fontSize(12).text(client.name || "-", leftX, doc.y);
      if (clientAddress.street) doc.text(clientAddress.street, leftX);
      if (client.primary_contact_mobile) doc.text(`Mobile: ${client.primary_contact_mobile}`, leftX);

      doc.fontSize(10).text(`Receipt No:`, rightX, top);
      doc.fontSize(12).text(receipt.receipt_no || "-", rightX, doc.y - 12);
      doc.fontSize(10).text(`Date:`, rightX, doc.y + 4);
      doc.fontSize(12).text(receipt.date ? new Date(receipt.date).toLocaleDateString() : "", rightX, doc.y - 12);

      doc.moveDown(2);
      const tableTop = doc.y;
      doc.fontSize(10).text("Payment Mode", 40, tableTop);
      doc.text("Reference", 260, tableTop);
      doc.text("Date", 360, tableTop);
      doc.text("Amount", 460, tableTop, { width: 90, align: "right" });

      let y = tableTop + 20;
      (receipt.payments || []).forEach((p) => {
        doc.fontSize(10).text(p.payment_mode || "-", 40, y);
        doc.text(p.reference || "-", 260, y);
        doc.text(p.date ? new Date(p.date).toLocaleDateString() : "", 360, y);
        doc.text(Number(p.amount || 0).toFixed(2), 460, y, { width: 90, align: "right" });
        y += 18;
      });

      y += 10;
      doc.fontSize(12).text("Total Available:", 360, y);
      doc.fontSize(12).text(`₹ ${Number(receipt.total_amount || 0).toFixed(2)}`, 520, y, { width: 90, align: "right" });

      doc.end();
    } catch (err) { reject(err); }
  });
};

export const generateQuotationPdfBuffer = (quotation) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40 });
      const buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      // Register Space Mono Fonts
      doc.registerFont("SpaceMono", REGULAR_FONT);
      doc.registerFont("SpaceMono-Bold", BOLD_FONT);


      doc.fontSize(18).font("SpaceMono-Bold").text("QUOTATION", { align: "right" });
      const seller = quotation.billing_entity || {};
      const sellerAddr = seller.companyAddress || {};
      const logoSize = 50;
      try {
        doc.save()
          .circle(40 + logoSize / 2, 40 + logoSize / 2, logoSize / 2)
          .clip()
          .image(LOGO_PATH, 40, 40, { width: logoSize, height: logoSize })
          .restore();
      } catch (e) { }

      doc.fontSize(11).text(seller.name || "-", 40, doc.y);
      if (sellerAddr.street) doc.text(sellerAddr.street);
      if (seller.companyPhone) doc.text(`Phone: ${seller.companyPhone}`);
      if (seller.companyEmail) doc.text(`Email: ${seller.companyEmail}`);
      if (seller.gstNumber) doc.text(`GSTIN: ${seller.gstNumber}`);
      doc.moveDown();

      const client = quotation.client || {};
      doc.fontSize(11).text("To:", 40, doc.y);
      doc.fontSize(12).text(client.name || "-", 40, doc.y);
      if (client.address?.street) doc.text(client.address.street);
      if (client.primary_contact_mobile) doc.text(`Mobile: ${client.primary_contact_mobile}`);
      doc.moveDown();

      const tableTop = doc.y;
      doc.fontSize(11).text("Description", 40, tableTop);
      doc.text("Qty", 330, tableTop);
      doc.text("Unit", 380, tableTop);
      doc.text("Amount", 500, tableTop, { width: 80, align: "right" });

      let y = tableTop + 22;
      (quotation.items || []).forEach((it) => {
        doc.fontSize(10).text(it.description || "-", 40, y, { width: 270 });
        doc.text(it.quantity || "1", 330, y);
        doc.text((it.unit_price || 0).toFixed(2), 380, y);
        doc.text((it.total_amount || 0).toFixed(2), 500, y, { width: 80, align: "right" });
        y += 18;
      });

      y += 20;
      doc.fontSize(13).text("Total:", 360, y);
      doc.fontSize(13).text((quotation.total_amount || 0).toFixed(2), 520, y, { width: 80, align: "right" });

      doc.end();
    } catch (err) { reject(err); }
  });
};
