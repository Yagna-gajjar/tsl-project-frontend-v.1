import type { Area } from "@/types/area";
import { toQueryString } from "./helper";

export interface AreasQuery {
  page?: number;
  limit?: number;
  search?: string;
  areaName?: string;
  facilityId?: number;
  areaSQFT?: number;
  portion?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

const API_URL = import.meta.env.VITE_APP_API_URL;

async function getAreas(params?: AreasQuery) {
  try {
    const url = `${API_URL}/area?${toQueryString(params || {})}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.data && Array.isArray(data.data)) {
      return data.data;
    }
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Error fetching areas:", err);
    throw err;
  }
}

async function getAreaById(id: number) {
  try {
    const url = `${API_URL}/area/${id}`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error fetching area:", err);
    throw err;
  }
}

async function createArea(payload: Omit<Area, "areaId" | "createdAt" | "updatedAt">) {
  try {
    const url = `${API_URL}/area`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error creating area:", err);
    throw err;
  }
}

async function updateArea(id: number, payload: Partial<Area>) {
  try {
    const url = `${API_URL}/area/${id}`;
    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error updating area:", err);
    throw err;
  }
}

async function deleteArea(id: number) {
  try {
    const url = `${API_URL}/area/${id}`;
    const response = await fetch(url, {
      method: "DELETE",
    });
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error deleting area:", err);
    throw err;
  }
}

export { getAreas, getAreaById, createArea, updateArea, deleteArea };
