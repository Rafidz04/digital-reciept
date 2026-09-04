import axios from "axios";

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
export const API_URL = (configuredApiUrl || `${window.location.protocol}//${window.location.hostname}:8080`).replace(/\/$/, "");

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000,
});

export const apiErrorMessage = (error, fallback = "Tidak dapat terhubung ke server.") =>
  error?.response?.data?.message ||
  (error?.code === "ECONNABORTED" ? "Server terlalu lama merespons." : null) ||
  (error?.request ? `${fallback} Pastikan backend aktif di ${API_URL}.` : error?.message) ||
  fallback;

export const imageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_URL}${path}`;
};

export const rupiah = (value = 0) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
