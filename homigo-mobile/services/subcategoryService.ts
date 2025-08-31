import { apiRequest } from "./api";

export async function getSubcategoryById(id: number | string) {
  return apiRequest(`/subcategories/${id}`, {
    method: "GET",
  });
}

export async function searchSubcategories(q: string) {
  return apiRequest(`/subcategories/search?q=${encodeURIComponent(q)}`, {
    method: "GET",
  });
}

export async function getPopularSubcategories() {
  return apiRequest(`/subcategories/popular`, {
    method: "GET",
  });
}