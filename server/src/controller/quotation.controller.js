// controller/quotation.controller.js
import {
  createQuotationService,
  listQuotationsService,
  getQuotationByIdService,
  updateQuotationService,
  deleteQuotationService,
  changeQuotationStatusService,
  convertQuotationToInvoiceService,
} from "../services/quotation.service.js";
import { generateQuotationPdfBuffer } from "../utils/pdf.helper.js";
import sendEmail from "../utils/sendEmail.js";
import logger from "../utils/logger.js";

export const createQuotationController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const user_id = req.user._id;
    const payload = req.body;
    const q = await createQuotationService({ tenant_id, user_id, payload });
    return res.status(201).json({ success: true, data: q });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
};

export const listQuotationsController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const { page = 1, limit = 20, search, ...filters } = req.query;
    const result = await listQuotationsService({
      tenant_id,
      page: Number(page),
      limit: Number(limit),
      filters,
      search,
    });
    return res.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

export const getQuotationController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const qid = req.params.id;
    const q = await getQuotationByIdService({ tenant_id, quotation_id: qid });
    return res.json({ success: true, data: q });
  } catch (e) {
    return res.status(404).json({ success: false, message: e.message });
  }
};

export const updateQuotationController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const user_id = req.user._id;
    const qid = req.params.id;
    const payload = req.body;
    const updated = await updateQuotationService({
      tenant_id,
      user_id,
      quotation_id: qid,
      payload,
    });
    return res.json({ success: true, data: updated });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
};

export const deleteQuotationController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const user_id = req.user._id;
    const qid = req.params.id;
    const force = req.query.force === "true";
    const result = await deleteQuotationService({
      tenant_id,
      user_id,
      quotation_id: qid,
      force,
    });
    return res.json({
      success: true,
      message: result.hard ? "Quotation deleted" : "Quotation archived",
    });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
};

export const changeQuotationStatusController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const user_id = req.user._id;
    const qid = req.params.id;
    const { status } = req.body; // expected: accepted|rejected|pending|cancelled
    const updated = await changeQuotationStatusService({
      tenant_id,
      user_id,
      quotation_id: qid,
      newStatus: status,
    });
    return res.json({ success: true, data: updated });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
};

export const convertQuotationToInvoiceController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const user_id = req.user._id;
    const qid = req.params.id;
    const payload = req.body || {};
    const result = await convertQuotationToInvoiceService({
      tenant_id,
      user_id,
      quotation_id: qid,
      payload,
    });
    return res.json({ success: true, data: result });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
};

export const previewQuotationController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const qid = req.params.id;
    const q = await getQuotationByIdService({ tenant_id, quotation_id: qid });

    const buffer = await generateQuotationPdfBuffer(q);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Length": buffer.length,
      "Content-Disposition": `inline; filename="quotation-${q.quotation_no || qid}.pdf"`,
    });
    return res.send(buffer);
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
};

export const sendQuotationController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const quotationId = req.params.id;
    // Accept recipients and optional subject/message in body
    const { to, cc, subject, message } = req.body;

    if (!to || (Array.isArray(to) && to.length === 0)) {
      return res
        .status(400)
        .json({ success: false, message: "Recipient 'to' is required" });
    }

    // fetch quotation (should populate client/billing_entity etc.)
    const quotation = await getQuotationByIdService({
      tenant_id,
      quotation_id: quotationId,
    });
    if (!quotation)
      return res
        .status(404)
        .json({ success: false, message: "Quotation not found" });

    // generate PDF buffer (make sure this function exists / exported in pdf.helper.js).
    const pdfBuffer = await generateQuotationPdfBuffer(quotation);

    // compose email
    const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    const mail = {
      from: fromAddress,
      to, // string or array
      cc, // optional
      subject: subject || `Quotation ${quotation.quotation_no || quotationId}`,
      text:
        message ||
        `Please find attached the quotation ${quotation.quotation_no || quotationId}.`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; padding: 20px;">
          <!-- Circular Image -->
          <div style="text-align: center; margin-bottom: 20px;">
            <img 
              src="https://res.cloudinary.com/dbaeuihz7/image/upload/v1774225986/users/tqg7thoai2g8yqhsvpr6.png" 
              alt="Profile"
              style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid #e0e0e0;"
            />
          </div>
          <p>${(message || "Please find attached the quotation details.").replace(/\\n/g, '<br/>')}</p>
        </div>
      `,
      attachments: [
        {
          filename: `quotation-${quotation.quotation_no || quotationId}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    };

    const info = await sendEmail(mail);

    // OPTIONAL: update DB to record that it was sent / who it was sent to (not implemented here)
    return res.json({ success: true, message: "Quotation sent", info });
  } catch (err) {
    logger.error("sendQuotationController error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to send quotation",
    });
  }
};
