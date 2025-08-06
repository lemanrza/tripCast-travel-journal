import axios from "axios";
import { API_BASE_URL } from "./api";

console.log("API_BASE_URL:", API_BASE_URL);
console.log("VITE_SERVER_URL:", import.meta.env.VITE_SERVER_URL);

const instance = axios.create({
  baseURL: API_BASE_URL || "http://localhost:5000",
  timeout: 10_000,
});

console.log("Axios instance baseURL:", instance.defaults.baseURL);

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default instance;
