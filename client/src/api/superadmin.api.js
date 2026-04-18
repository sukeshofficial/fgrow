import { api } from "./api"; // existing axios instance

export const getAllUsersAdmin = async () => {
  return await api.get("/superadmin/users");
};

export const deleteUserAdmin = async (userId) => {
  return await api.delete(`/superadmin/users/${userId}`);
};

export const forceLogoutUserAdmin = async (userId) => {
  return await api.patch(`/superadmin/users/${userId}/logout`);
};
