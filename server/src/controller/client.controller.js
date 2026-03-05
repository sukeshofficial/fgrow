import {
  createClientService,
  listClientsService,
  updateClientService,
  deleteClientService,
} from "../services/client.service.js";


export const createClientController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const user_id = req.user._id;

    const payload = req.body;

    const client = await createClientService({
      tenant_id,
      user_id,
      payload,
    });

    return res.status(201).json({
      success: true,
      message: "Client created successfully",
      data: client,
    });
  } catch (error) {
    if (error.message.includes("already exists")) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const listClientsController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;

    const { page = 1, limit = 10, search, ...filters } = req.query;

    const result = await listClientsService({
      tenant_id,
      page: Number(page),
      limit: Number(limit),
      search,
      filters,
    });

    return res.status(200).json({
      success: true,
      data: result.clients,
      pagination: result.pagination,
    });
  } catch (error) {
    if (error.message.includes("Invalid")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getClientByIdController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const { id } = req.params;

    const client = await getClientByIdService({
      tenant_id,
      client_id: id,
    });

    return res.status(200).json({
      success: true,
      data: client,
    });
  } catch (error) {
    if (
      error.message === "Invalid client id" ||
      error.message === "Client not found"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateClientController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const user_id = req.user._id;
    const client_id = req.params.id;
    const payload = req.body;

    const updated = await updateClientService({
      tenant_id,
      user_id,
      client_id,
      payload,
    });

    return res.status(200).json({
      success: true,
      message: "Client updated successfully",
      data: updated,
    });
  } catch (error) {
    // duplicate PAN -> 409
    if (error.message.includes("PAN already exists") || error.code === "DUP_PAN" || error.message.includes("already exists")) {
      return res.status(409).json({ success: false, message: error.message });
    }

    if (error.message.includes("Invalid client id") || error.message.includes("Invalid")) {
      return res.status(400).json({ success: false, message: error.message });
    }

    if (error.message.includes("Client not found")) {
      return res.status(404).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteClientController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const user_id = req.user._id;
    const client_id = req.params.id;
    // optional ?force=true for hard delete
    const force = req.query.force === "true";

    const result = await deleteClientService({
      tenant_id,
      user_id,
      client_id,
      force,
    });

    if (result.hard) {
      return res.status(200).json({ success: true, message: "Client permanently deleted" });
    }

    return res.status(200).json({ success: true, message: "Client archived successfully", data: result.archived });
  } catch (error) {
    if (error.message.includes("Invalid client id") || error.message.includes("Invalid")) {
      return res.status(400).json({ success: false, message: error.message });
    }

    if (error.message.includes("Client not found")) {
      return res.status(404).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: error.message });
  }
};
