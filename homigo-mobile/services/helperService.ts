import { apiRequest } from "./api";

export async function getHelpers(params?: {
  subcategory_id?: number | string;
  category_id?: number | string;
  search?: string;
}) {
  const searchParams = new URLSearchParams();

  if (params?.subcategory_id)
    searchParams.append("subcategory_id", String(params.subcategory_id));
  if (params?.category_id)
    searchParams.append("category_id", String(params.category_id));
  if (params?.search) searchParams.append("search", params.search);

  const query = searchParams.toString() ? `?${searchParams.toString()}` : "";

  return apiRequest(`/helpers${query}`, {
    method: "GET",
  });
}

export async function getHelperById(helperId: number | string) {
  return apiRequest(`/helpers/${helperId}`, {
    method: "GET",
  });
}