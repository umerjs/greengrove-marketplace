import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api/v1";

export const api = axios.create({ baseURL: API_URL, withCredentials: true });

let accessToken = null;
export const setAccessToken = (token) => {
  accessToken = token;
};

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    if (status === 401 && !original?._retry && !original?.url?.includes("/auth/refresh")) {
      original._retry = true;
      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
        setAccessToken(data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        setAccessToken(null);
      }
    }
    return Promise.reject(error);
  },
);

export const apiMessage = (error) =>
  error?.response?.data?.message ?? error?.message ?? "Something went wrong";
