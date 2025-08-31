export interface HelperSkill {
  id: number;
  helper_id: number;
  subcategory_id: number;
  experience_years?: number;
  hourly_rate?: number | string | null;
  fixed_rate?: number | string | null;
  available?: boolean;
  verification_status?: string;
  created_at?: string;

  subcategory_name?: string;
  category_name?: string;
}

export interface AddHelperSkillPayload {
  subcategory_id: number | string;
  experience_years?: number;
  hourly_rate?: number | null;
  fixed_rate?: number | null;
  available?: boolean;
}

export interface UpdateHelperSkillPayload {
  experience_years?: number;
  hourly_rate?: number | null;
  fixed_rate?: number | null;
  available?: boolean;
}