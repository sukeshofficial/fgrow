import mongoose from "mongoose";
import ClientGroup from "../models/client/schemas/clientGroup.schema.js";

const { Types } = mongoose;

/* CREATE */
export const createClientGroupService = async ({ tenant_id, user_id, payload }) => {

    const existing = await ClientGroup.findOne({
        tenant_id,
        name: payload.name
    });

    if (existing) {
        throw new Error("Group already exists");
    }

    const group = new ClientGroup({
        ...payload,
        tenant_id,
        created_by: user_id,
        updated_by: user_id
    });

    return await group.save();
};


/* LIST */
export const listClientGroupsService = async ({ tenant_id }) => {

    const groups = await ClientGroup.find({
        tenant_id
    })
        .sort({ createdAt: -1 })
        .lean();

    return groups;
};


/* GET BY ID */
export const getClientGroupService = async ({ tenant_id, group_id }) => {

    if (!Types.ObjectId.isValid(group_id)) {
        throw new Error("Invalid group id");
    }

    const group = await ClientGroup.findOne({
        _id: group_id,
        tenant_id
    }).lean();

    if (!group) {
        throw new Error("Group not found");
    }

    return group;
};


/* UPDATE */
export const updateClientGroupService = async ({ tenant_id, group_id, user_id, payload }) => {

    if (!Types.ObjectId.isValid(group_id)) {
        throw new Error("Invalid group id");
    }

    const group = await ClientGroup.findOneAndUpdate(
        {
            _id: group_id,
            tenant_id
        },
        {
            ...payload,
            updated_by: user_id
        },
        { new: true }
    );

    if (!group) {
        throw new Error("Group not found");
    }

    return group;
};


/* DELETE */
export const deleteClientGroupService = async ({ tenant_id, group_id }) => {

    if (!Types.ObjectId.isValid(group_id)) {
        throw new Error("Invalid group id");
    }

    const group = await ClientGroup.findOneAndDelete({
        _id: group_id,
        tenant_id
    });

    if (!group) {
        throw new Error("Group not found");
    }

    return group;
};