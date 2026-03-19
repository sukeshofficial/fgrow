import { api } from "./api";

/**
 * Create a new client
 * POST /clients
 */
export const createClient = (payload) => {
  return api.post("/clients", payload);
};

/**
 * List clients with pagination and filters
 * GET /clients
 */
export const listClients = (params) => {
  return api.get("/clients", { params });
};

/**
 * Get client details by ID
 * GET /clients/:id
 */
export const getClientById = (id) => {
  return api.get(`/clients/${id}`);
};

/**
 * Update client details
 * PATCH /clients/:id
 */
export const updateClient = (id, payload) => {
  return api.patch(`/clients/${id}`, payload);
};

/**
 * Delete / Archive client
 * DELETE /clients/:id
 */
export const deleteClient = (id, force = false) => {
  return api.delete(`/clients/${id}`, { params: { force } });
};
/**
 * List client groups
 * GET /client-groups
 */
export const listClientGroups = () => {
  return api.get("/client-groups");
};

/**
 * Create a new client group
 * POST /client-groups
 */
export const createClientGroup = (payload) => {
  return api.post("/client-groups", payload);
};

/**
 * List tags
 * GET /tags
 */
export const listTags = () => {
  return api.get("/tags");
};

/**
 * Create a new tag
 * POST /tags
 */
export const createTag = (payload) => {
  return api.post("/tags", payload);
};
/**
 * Upload client photo
 * POST /clients/upload-photo
 */
export const uploadClientPhoto = (file) => {
  const formData = new FormData();
  formData.append("photo", file);
  return api.post("/clients/upload-photo", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
