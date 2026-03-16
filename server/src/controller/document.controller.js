import {
  createDocumentService,
  listDocumentsService,
  getDocumentService,
  updateDocumentService,
  deleteDocumentService,
  returnDocumentService,
  exportDocumentsService,
} from "../services/document.service.js";


export const createDocumentController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const user_id = req.user._id;

    const result = await createDocumentService({
      tenant_id,
      user_id,
      payload: req.body,
    });

    res.status(201).json({
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

export const listDocumentsController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;

    const result = await listDocumentsService({ tenant_id });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getDocumentController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;

    const result = await getDocumentService({
      tenant_id,
      document_id: req.params.id,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateDocumentController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const user_id = req.user._id;

    const result = await updateDocumentService({
      tenant_id,
      user_id,
      document_id: req.params.id,
      payload: req.body,
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

export const deleteDocumentController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;

    await deleteDocumentService({
      tenant_id,
      document_id: req.params.id,
    });

    res.json({
      success: true,
      message: "Document deleted",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const returnDocumentController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;

    const result = await returnDocumentService({
      tenant_id,
      document_id: req.params.id,
      returned_on: req.body.returned_on,
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

export const exportDocumentsController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const workbook = await exportDocumentsService({ tenant_id });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=documents.xlsx"
    );

    await workbook.xlsx.write(res);
    res.status(200).end();

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
