import { axiosWrapper } from "./axiosWrapper";

// ---- Auth & staff ----
export const getSetupStatus = () => axiosWrapper.get("/api/user/setup-status");
export const login = (data) => axiosWrapper.post("/api/user/login", data);
export const register = (data) => axiosWrapper.post("/api/user/register", data);
export const getUserData = () => axiosWrapper.get("/api/user");
export const logout = () => axiosWrapper.post("/api/user/logout");
export const getStaff = () => axiosWrapper.get("/api/user/staff");
export const updateStaff = ({ id, ...data }) => axiosWrapper.put(`/api/user/staff/${id}`, data);
export const deleteStaff = (id) => axiosWrapper.delete(`/api/user/staff/${id}`);

// ---- Categories ----
export const getCategories = () => axiosWrapper.get("/api/category");
export const addCategory = (data) => axiosWrapper.post("/api/category", data);
export const updateCategory = ({ id, ...data }) => axiosWrapper.put(`/api/category/${id}`, data);
export const deleteCategory = (id) => axiosWrapper.delete(`/api/category/${id}`);

// ---- Dishes ----
export const getDishes = (params) => axiosWrapper.get("/api/dish", { params });
export const addDish = (data) => axiosWrapper.post("/api/dish", data);
export const updateDish = ({ id, ...data }) => axiosWrapper.put(`/api/dish/${id}`, data);
export const deleteDish = (id) => axiosWrapper.delete(`/api/dish/${id}`);

// ---- Orders / bills ----
export const addOrder = (data) => axiosWrapper.post("/api/order", data);
export const getOrders = (params) => axiosWrapper.get("/api/order", { params });
export const getOrderById = (id) => axiosWrapper.get(`/api/order/${id}`);
export const voidOrder = ({ id, reason }) => axiosWrapper.put(`/api/order/${id}/void`, { reason });

// ---- Reports ----
export const getOverview = () => axiosWrapper.get("/api/report/overview");
export const getSalesReport = (params) => axiosWrapper.get("/api/report/sales", { params });

// ---- Settings ----
export const getSettings = () => axiosWrapper.get("/api/settings");
export const updateSettings = (data) => axiosWrapper.put("/api/settings", data);
