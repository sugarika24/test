import { apiRequest } from "./api";
import {
  AddHelperSkillPayload,
  UpdateHelperSkillPayload,
} from "../types/helperSkill";

export async function getMyHelperSkills(token: string) {
  return apiRequest("/helper/skills", { method: "GET" }, token);
}

export async function addHelperSkill(
  payload: AddHelperSkillPayload,
  token: string
) {
  return apiRequest(
    "/helper/skills",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function updateHelperSkill(
  id: number | string,
  payload: UpdateHelperSkillPayload,
  token: string
) {
  return apiRequest(
    `/helper/skills/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function deleteHelperSkill(id: number | string, token: string) {
  return apiRequest(
    `/helper/skills/${id}`,
    {
      method: "DELETE",
    },
    token
  );
}