import type { Coach } from "@/types/coach";
import { toQueryString } from "./helper";

export interface CoachesQuery {
  page?: number;
  limit?: number;
  search?: string;
  coachFirstName?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

const API_URL = import.meta.env.VITE_APP_API_URL;

async function getCoaches(params?: CoachesQuery) {
  try {
    const url = `${API_URL}/coach?${toQueryString(params || {})}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.data && Array.isArray(data.data)) {
      return data.data;
    }
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Error fetching coaches:", err);
    throw err;
  }
}

async function getCoachById(id: number) {
  try {
    const url = `${API_URL}/coach/${id}`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error fetching coach:", err);
    throw err;
  }
}

async function createCoach(payload: Omit<Coach, "coachId" | "createdAt" | "updatedAt">) {
  try {
    const url = `${API_URL}/coach`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error creating coach:", err);
    throw err;
  }
}

async function updateCoach(id: number, payload: Partial<Coach>) {
  try {
    const url = `${API_URL}/coach/${id}`;
    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error updating coach:", err);
    throw err;
  }
}

async function deleteCoach(id: number) {
  try {
    const url = `${API_URL}/coach/${id}`;
    const response = await fetch(url, { method: "DELETE" });
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error deleting coach:", err);
    throw err;
  }
}

export { getCoaches, getCoachById, createCoach, updateCoach, deleteCoach };
