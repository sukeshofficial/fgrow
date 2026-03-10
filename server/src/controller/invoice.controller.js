import * as service from "../services/invoice.service.js";

export const listInvoices = async (req, res, next) => {
  try {
    const result = await service.listInvoices(req.user, req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const createInvoice = async (req, res, next) => {
  try {
    const invoice = await service.createInvoice(req.user, req.body);
    res.status(201).json(invoice);
  } catch (err) {
    next(err);
  }
};

export const getInvoiceById = async (req, res, next) => {
  try {
    const inv = await service.getInvoiceById(req.user, req.params.id);
    if (!inv) return res.status(404).json({ message: "Invoice not found" });
    res.json(inv);
  } catch (err) {
    next(err);
  }
};

export const updateInvoice = async (req, res, next) => {
  try {
    const updated = await service.updateInvoice(
      req.user,
      req.params.id,
      req.body,
    );
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

export const deleteInvoice = async (req, res, next) => {
  try {
    const force = req.query.force === "true";
    await service.deleteInvoice(req.user, req.params.id, force);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

// Items
export const addItems = async (req, res, next) => {
  try {
    const items = await service.addItems(
      req.user,
      req.params.id,
      req.body.items,
    );
    res.status(201).json(items);
  } catch (err) {
    next(err);
  }
};

export const updateItem = async (req, res, next) => {
  try {
    const item = await service.updateItem(
      req.user,
      req.params.id,
      req.params.itemId,
      req.body,
    );
    res.json(item);
  } catch (err) {
    next(err);
  }
};

export const deleteItem = async (req, res, next) => {
  try {
    await service.deleteItem(req.user, req.params.id, req.params.itemId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

export const getUnbilledTasks = async (req, res, next) => {
  try {
    const tasks = await service.getUnbilledTasks(req.user, req.params.id);
    res.json(tasks);
  } catch (err) {
    next(err);
  }
};

// Payments
export const addPayment = async (req, res, next) => {
  try {
    const payment = await service.addPayment(req.user, req.params.id, req.body);
    res.status(201).json(payment);
  } catch (err) {
    next(err);
  }
};

export const listPayments = async (req, res, next) => {
  try {
    const payments = await service.listPayments(req.user, req.params.id);
    res.json(payments);
  } catch (err) {
    next(err);
  }
};

export const markPaid = async (req, res, next) => {
  try {
    const inv = await service.markPaid(req.user, req.params.id);
    res.json(inv);
  } catch (err) {
    next(err);
  }
};

// Preview / PDF / send
export const previewInvoice = async (req, res, next) => {
  try {
    const preview = await service.previewInvoice(req.user, req.params.id);
    res.json(preview);
  } catch (err) {
    next(err);
  }
};

export const sendInvoice = async (req, res, next) => {
  try {
    const result = await service.sendInvoice(req.user, req.params.id, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getPdf = async (req, res, next) => {
  try {
    const pdfStream = await service.getPdf(req.user, req.params.id);
    res.setHeader("Content-Type", "application/pdf");
    pdfStream.pipe(res);
  } catch (err) {
    next(err);
  }
};

export const exportInvoices = async (req, res, next) => {
  try {
    const file = await service.exportInvoices(req.user, req.query);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${file.filename}"`,
    );
    res.setHeader("Content-Type", file.mimetype);
    res.send(file.content);
  } catch (err) {
    next(err);
  }
};

// Bulk & reverse
export const bulkOperations = async (req, res, next) => {
  try {
    const out = await service.bulkOperations(req.user, req.body);
    res.json(out);
  } catch (err) {
    next(err);
  }
};

export const reverseInvoice = async (req, res, next) => {
  try {
    await service.reverseInvoice(req.user, req.params.id);
    res.status(200).json({ message: "Invoice reversed" });
  } catch (err) {
    next(err);
  }
};
