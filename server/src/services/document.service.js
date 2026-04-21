import mongoose from "mongoose";
import ExcelJS from "exceljs";
import Document from "../models/document/document.model.js";

const { Types } = mongoose;

export const createDocumentService = async ({ tenant_id, user_id, payload }) => {

  if (!payload.date) throw new Error("Date required");
  if (!payload.category) throw new Error("Category required");
  if (!payload.document_type) throw new Error("Document type required");
  if (!payload.client) throw new Error("Client required");

  const doc = new Document({
    tenant_id,
    date: new Date(payload.date),
    category: payload.category,
    document_type: payload.document_type,
    client: payload.client,
    location: payload.location || "",
    is_returnable: payload.is_returnable || false,
    notes: payload.notes || "",
    created_by: user_id,
    updated_by: user_id
  });

  await doc.save();

  return doc.toObject();
};

export const listDocumentsService = async ({
  tenant_id,
  page = 1,
  limit = 20,
  search,
  category
}) => {
  const skip = (page - 1) * limit;
  const pipeline = [
    { $match: { tenant_id: new Types.ObjectId(tenant_id), archived: false } }
  ];

  if (category && category !== "all") {
    pipeline.push({ $match: { category } });
  }

  // Joins
  pipeline.push(
    {
      $lookup: {
        from: "clients",
        localField: "client",
        foreignField: "_id",
        as: "client"
      }
    },
    { $unwind: "$client" },
    {
      $lookup: {
        from: "documenttypes",
        localField: "document_type",
        foreignField: "_id",
        as: "document_type"
      }
    },
    { $unwind: "$document_type" }
  );

  // Search
  if (search) {
    const searchRegex = new RegExp(search, "i");
    pipeline.push({
      $match: {
        $or: [
          { "client.name": searchRegex },
          { "document_type.name": searchRegex },
          { location: searchRegex },
          { notes: searchRegex }
        ]
      }
    });
  }

  pipeline.push({ $sort: { date: -1 } });

  const facetPipeline = [
    {
      $facet: {
        items: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: "count" }]
      }
    }
  ];

  const [result] = await Document.aggregate([...pipeline, ...facetPipeline]);
  const total = result.totalCount[0]?.count || 0;

  return {
    items: result.items,
    pagination: {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit)
    }
  };
};

export const getDocumentService = async ({ tenant_id, document_id }) => {

  if (!Types.ObjectId.isValid(document_id))
    throw new Error("Invalid document id");

  const doc = await Document.findOne({
    _id: document_id,
    tenant_id
  })
    .populate("document_type", "name")
    .populate("client", "name")
    .lean();

  if (!doc) throw new Error("Document not found");

  return doc;
};

export const updateDocumentService = async ({ tenant_id, user_id, document_id, payload }) => {

  const doc = await Document.findOne({
    _id: document_id,
    tenant_id
  });

  if (!doc) throw new Error("Document not found");

  if (payload.date !== undefined) doc.date = new Date(payload.date);
  if (payload.category !== undefined) doc.category = payload.category;
  if (payload.document_type !== undefined) doc.document_type = payload.document_type;
  if (payload.client !== undefined) doc.client = payload.client;
  if (payload.location !== undefined) doc.location = payload.location;
  if (payload.is_returnable !== undefined) doc.is_returnable = payload.is_returnable;
  if (payload.notes !== undefined) doc.notes = payload.notes;

  doc.updated_by = user_id;

  await doc.save();

  return doc.toObject();
};

export const deleteDocumentService = async ({ tenant_id, document_id }) => {

  const doc = await Document.findOne({
    _id: document_id,
    tenant_id
  });

  if (!doc) throw new Error("Document not found");

  doc.archived = true;
  doc.archived_at = new Date();

  await doc.save();

  return true;
};

export const returnDocumentService = async ({ tenant_id, document_id, returned_on }) => {

  const doc = await Document.findOne({
    _id: document_id,
    tenant_id
  });

  if (!doc) throw new Error("Document not found");

  if (!doc.is_returnable)
    throw new Error("Document is not returnable");

  doc.returned = true;
  doc.returned_on = new Date(returned_on);

  await doc.save();

  return doc.toObject();
};

export const exportDocumentsService = async ({ tenant_id }) => {

  const documents = await Document.find({ tenant_id, archived: false })
    .populate("document_type", "name")
    .populate("client", "name")
    .sort({ date: -1 })
    .lean();

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Documents");

  sheet.columns = [
    { header: "Date", key: "date", width: 15 },
    { header: "Document Type", key: "document_type", width: 25 },
    { header: "Category", key: "category", width: 15 },
    { header: "Client", key: "client", width: 30 },
    { header: "Location", key: "location", width: 25 },
    { header: "Returnable", key: "returnable", width: 15 },
    { header: "Returned", key: "returned", width: 15 },
    { header: "Notes", key: "notes", width: 40 }
  ];

  documents.forEach(doc => {
    sheet.addRow({
      date: doc.date?.toISOString().split("T")[0],
      document_type: doc.document_type?.name,
      category: doc.category,
      client: doc.client?.name,
      location: doc.location,
      returnable: doc.is_returnable ? "Yes" : "No",
      returned: doc.returned ? "Yes" : "No",
      notes: doc.notes
    });
  });

  return workbook;
};
