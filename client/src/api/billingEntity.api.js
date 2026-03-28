import { api } from "./api";

export const listBillingEntities = async () => {
    return await api.get("/billing-entities");
};
