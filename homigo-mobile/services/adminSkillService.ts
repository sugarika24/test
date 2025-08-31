import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "./api";

export async function getAdminSkills() {
  return await apiGet("/admin/skills");
}

export async function getAdminSkillById(id: string | number) {
  return await apiGet(`/admin/skills/${id}`);
}

export async function createAdminSkill(data: any) {
  return await apiPost("/admin/skills", data);
}

export async function updateAdminSkill(id: string | number, data: any) {
  return await apiPut(`/admin/skills/${id}`, data);
}

export async function toggleAdminSkillStatus(id: string | number) {
  return await apiPatch(`/admin/skills/${id}/toggle-status`, {});
}

export async function deleteAdminSkill(id: string | number) {
  return await apiDelete(`/admin/skills/${id}`);
}