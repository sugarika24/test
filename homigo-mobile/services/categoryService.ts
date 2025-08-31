import { apiGet, apiRequest } from "./api";

export async function getAllCategories(search?: string, featured?: boolean) {
  const params = new URLSearchParams();

  if (search) params.append("search", search);
  if (featured) params.append("featured", "true");

  const query = params.toString() ? `?${params.toString()}` : "";

  return apiRequest(`/categories${query}`, {
    method: "GET",
  });
}

export async function getCategoryById(id: number | string) {
  return apiRequest(`/categories/${id}`, {
    method: "GET",
  });
}

export async function getSubcategoriesByCategory(
  categoryId: number | string,
  sort?: string
) {
  const query = sort ? `?sort=${encodeURIComponent(sort)}` : "";

  return apiRequest(`/categories/${categoryId}/subcategories${query}`, {
    method: "GET",
  });
}

export async function getCategories() {
  return await apiGet("/categories");
}
