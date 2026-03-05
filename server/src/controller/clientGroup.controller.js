import {
    createClientGroupService,
    listClientGroupsService,
    getClientGroupService,
    updateClientGroupService,
    deleteClientGroupService
} from "../services/clientGroup.service.js";


export const createClientGroupController = async (req, res) => {
    try {

        const tenant_id = req.user.tenant_id;
        const user_id = req.user._id;

        const group = await createClientGroupService({
            tenant_id,
            user_id,
            payload: req.body
        });

        res.status(201).json({
            success: true,
            data: group
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


export const listClientGroupsController = async (req, res) => {
    try {

        const tenant_id = req.user.tenant_id;

        const groups = await listClientGroupsService({ tenant_id });

        res.json({
            success: true,
            data: groups
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};


export const getClientGroupController = async (req, res) => {
    try {

        const tenant_id = req.user.tenant_id;

        const group = await getClientGroupService({
            tenant_id,
            group_id: req.params.id
        });

        res.json({
            success: true,
            data: group
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });

    }
};


export const updateClientGroupController = async (req, res) => {
    try {

        const tenant_id = req.user.tenant_id;
        const user_id = req.user._id;

        const group = await updateClientGroupService({
            tenant_id,
            user_id,
            group_id: req.params.id,
            payload: req.body
        });

        res.json({
            success: true,
            data: group
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


export const deleteClientGroupController = async (req, res) => {
    try {

        const tenant_id = req.user.tenant_id;

        await deleteClientGroupService({
            tenant_id,
            group_id: req.params.id
        });

        res.json({
            success: true,
            message: "Group deleted successfully"
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};