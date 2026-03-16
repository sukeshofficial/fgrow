// controllers/collectionRequest.controller.js
import {
  createCollectionRequestService,
  listCollectionRequestsService,
  getCollectionRequestService,
  updateCollectionRequestService,
  deleteCollectionRequestService,
  changeCollectionRequestStatusService,
  attachDocumentsToRequestService,
  removeDocumentFromRequestService,
} from "../services/documentCollectionRequest.service.js";

/* Create */
export const createCollectionRequestController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const user_id = req.user._id;
    const payload = req.body;
    const created = await createCollectionRequestService({
      tenant_id,
      user_id,
      payload,
    });
    return res.status(201).json({ success: true, data: created });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
};

/* List */
export const listCollectionRequestsController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const { page = 1, limit = 20, search, ...filters } = req.query;
    const result = await listCollectionRequestsService({
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

/* Get single */
export const getCollectionRequestController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const id = req.params.id;
    const item = await getCollectionRequestService({
      tenant_id,
      request_id: id,
    });
    return res.json({ success: true, data: item });
  } catch (e) {
    return res.status(404).json({ success: false, message: e.message });
  }
};

/* Update */
export const updateCollectionRequestController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const user_id = req.user._id;
    const id = req.params.id;
    const payload = req.body;
    const updated = await updateCollectionRequestService({
      tenant_id,
      user_id,
      request_id: id,
      payload,
    });
    return res.json({ success: true, data: updated });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
};

/* Delete (soft) */
export const deleteCollectionRequestController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const id = req.params.id;
    await deleteCollectionRequestService({ tenant_id, request_id: id });
    return res.json({ success: true, message: "Collection request deleted" });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
};

/* Change status */
export const changeCollectionRequestStatusController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const user_id = req.user._id;
    const id = req.params.id;
    const { status } = req.body;
    const updated = await changeCollectionRequestStatusService({
      tenant_id,
      user_id,
      request_id: id,
      newStatus: status,
    });
    return res.json({ success: true, data: updated });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
};

/* Attach documents (expecting req.filesProcessed or middleware-provided files array) */
export const attachDocumentsController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const user_id = req.user._id;

    const result = await attachDocumentsToRequestService({
      tenant_id,
      user_id,
      request_id: req.params.id,
      files: req.files,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* Remove a document from request */
export const removeDocumentFromRequestController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const user_id = req.user._id;

    const file_id = decodeURI(req.params.fileId);

    const result = await removeDocumentFromRequestService({
      tenant_id,
      user_id,
      request_id: req.params.id,
      file_identifier: file_id,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
