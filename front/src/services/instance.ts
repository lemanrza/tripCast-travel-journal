import axios from "axios";
import { API_BASE_URL } from "./api";

const instance = axios.create({
  baseURL: API_BASE_URL || "http://localhost:5000",
  timeout: 10_000,
});


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

// Response interceptor to handle token expiration
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 403 && 
        (error.response?.data?.message === "Invalid or expired token" || 
         error.response?.data?.message === "Access token required")) {
      // Token is expired or invalid
      localStorage.removeItem("token");
      // Redirect to login page
      window.location.href = "/";
      return Promise.reject(new Error("Session expired. Please log in again."));
    }
    return Promise.reject(error);
  }
);

export default instance;
