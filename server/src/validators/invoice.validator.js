import Joi from "joi";

const itemSchema = Joi.object({
  type: Joi.string().valid("task", "expense", "retainer", "manual").required(),
  description: Joi.string().required(),
  quantity: Joi.number().min(0).default(1),
  unit_price: Joi.number().min(0).default(0),
  discount: Joi.number().min(0).default(0),
  gst_rate: Joi.number().min(0).default(0),
  source_id: Joi.string().optional(),
  meta: Joi.object().optional(),
});

const createSchema = Joi.object({
  tenant_id: Joi.string().required(),
  // invoice_no: Joi.string().required(),
  billing_entity: Joi.string().required(),
  client: Joi.string().required(),
  date: Joi.date().optional(),
  due_date: Joi.date().optional().allow(null),
  payment_term: Joi.string().optional(),
  items: Joi.array().items(itemSchema).default([]),
  remark: Joi.string().allow("").optional(),
  status: Joi.string()
    .valid("draft", "sent", "partially_paid", "paid", "cancelled")
    .optional(),
});

const updateSchema = Joi.object({
  billing_entity: Joi.string().optional(),
  client: Joi.string().optional(),
  date: Joi.date().optional(),
  due_date: Joi.date().optional().allow(null),
  payment_term: Joi.string().optional(),
  remark: Joi.string().allow("").optional(),
  status: Joi.string()
    .valid("draft", "sent", "partially_paid", "paid", "cancelled")
    .optional(),
});

const addPaymentSchema = Joi.object({
  amount: Joi.number().positive().required(),
  date: Joi.date().optional(),
  method: Joi.string().optional(),
  reference: Joi.string().optional(),
  note: Joi.string().optional(),
});

export const validate = (type) => {
  return (req, res, next) => {
    let schema;
    if (type === "create") schema = createSchema;
    else if (type === "update") schema = updateSchema;
    else if (type === "addPayment") schema = addPaymentSchema;
    else if (type === "addItems")
      schema = Joi.object({ items: Joi.array().items(itemSchema).required() });
    else if (type === "updateItem")
      schema = Joi.object({
        description: Joi.string().optional(),
        quantity: Joi.number().min(0).optional(),
        unit_price: Joi.number().min(0).optional(),
        discount: Joi.number().min(0).optional(),
        gst_rate: Joi.number().min(0).optional(),
        meta: Joi.object().optional(),
      });
    else if (type === "list")
      schema = Joi.object({
        page: Joi.number().integer().min(1).optional(),
        per_page: Joi.number().integer().min(1).optional(),
        q: Joi.string().optional(),
        client: Joi.string().optional(),
        status: Joi.string().optional(),
        date_from: Joi.date().optional(),
        date_to: Joi.date().optional(),
      }).unknown(true);
    else if (type === "send")
      schema = Joi.object({
        to: Joi.string().email().required(),
        cc: Joi.string().optional(),
        subject: Joi.string().optional(),
        message: Joi.string().optional(),
      });

    if (!schema) return next();

    const { error, value } = schema.validate(req.body, { stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });
    req.body = value;
    next();
  };
};
