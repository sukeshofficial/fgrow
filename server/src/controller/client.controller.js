import {
  createClientService,
  listClientsService,
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
