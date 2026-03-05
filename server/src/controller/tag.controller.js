import {
    createTagService,
    listTagsService,
    getTagService,
    updateTagService,
    deleteTagService,
} from "../services/tag.service.js";

/* CREATE */
export const createTagController = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;

        const tag = await createTagService({
            tenant_id,
            payload: req.body,
        });

        res.status(201).json({
            success: true,
            data: tag,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

/* LIST */
export const listTagsController = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;

        const tags = await listTagsService({ tenant_id });

        res.json({
            success: true,
            data: tags,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/* GET ONE */
export const getTagController = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;

        const tag = await getTagService({
            tenant_id,
            tag_id: req.params.id,
        });

        res.json({
            success: true,
            data: tag,
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message,
        });
    }
};

/* UPDATE */
export const updateTagController = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;

        const tag = await updateTagService({
            tenant_id,
            tag_id: req.params.id,
            payload: req.body,
        });

        res.json({
            success: true,
            data: tag,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

/* DELETE */
export const deleteTagController = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;

        await deleteTagService({
            tenant_id,
            tag_id: req.params.id,
        });

        res.json({
            success: true,
            message: "Tag deleted successfully",
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};