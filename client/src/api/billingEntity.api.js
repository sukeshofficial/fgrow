import { api } from "./api";

export const listBillingEntities = async () => {
    return await api.get("/billing-entities");
};

export const createBillingEntity = async (data) => {
    return await api.post("/billing-entities", data);
};
