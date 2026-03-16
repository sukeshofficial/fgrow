import {
  createDscService,
  listDscService,
  getDscService,
  updateDscService,
  deleteDscService
} from "../services/dsc.service.js";

export const createDscController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const user_id = req.user._id;

    const result = await createDscService({
      tenant_id,
      user_id,
      payload: req.body
    });

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const listDscController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;

    const result = await listDscService({
      tenant_id
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getDscController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;

    const result = await getDscService({
      tenant_id,
      dsc_id: req.params.id
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

export const updateDscController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const user_id = req.user._id;

    const result = await updateDscService({
      tenant_id,
      user_id,
      dsc_id: req.params.id,
      payload: req.body
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteDscController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;

    await deleteDscService({
      tenant_id,
      dsc_id: req.params.id
    });

    res.json({
      success: true,
      message: "DSC deleted"
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};