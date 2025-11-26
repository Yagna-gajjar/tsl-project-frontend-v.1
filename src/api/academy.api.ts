import type { Academy } from "@/types/academy";
import { toQueryString } from "./helper";

export interface AcademyQuery {
  page?: number;
  limit?: number;
  search?: string;
  academyName?: string;
  academyType?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

const API_URL = import.meta.env.VITE_APP_API_URL;

async function getAcademies(params?: AcademyQuery) {
  try {
    const url = `${API_URL}/academy?${toQueryString(params || {})}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.data && Array.isArray(data.data)) {
      return data.data;
    }
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Error fetching academies:", err);
    throw err;
  }
}

async function getAcademyById(id: number) {
  try {
    const url = `${API_URL}/academy/${id}`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error fetching academy:", err);
    throw err;
  }
}

async function createAcademy(payload: Omit<Academy, "academyId" | "createdAt" | "updatedAt">) {
  try {
    const url = `${API_URL}/academy`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error creating academy:", err);
    throw err;
  }
}

async function updateAcademy(id: number, payload: Partial<Academy>) {
  try {
    const url = `${API_URL}/academy/${id}`;
    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error updating academy:", err);
    throw err;
  }
}

async function deleteAcademy(id: number) {
  try {
    const url = `${API_URL}/academy/${id}`;
    const response = await fetch(url, {
      method: "DELETE",
    });
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error deleting academy:", err);
    throw err;
  }
}

export { getAcademies, getAcademyById, createAcademy, updateAcademy, deleteAcademy };
