export interface HelperListSkill {
  helper_skill_id: number;
  subcategory_id: number;
  subcategory_name?: string;
  category_id?: number;
  category_name?: string;
  experience_years?: number;
  hourly_rate?: number | string | null;
  fixed_rate?: number | string | null;
}

export interface HelperListItem {
  id: number;
  user_id: number;
  email?: string;
  full_name: string;
  phone_number?: string;
  profile_photo_url?: string | null;
  address?: string | null;
  bio?: string | null;
  helper_available?: boolean;
  avg_rating?: number | string;
  rating_count?: number;
  completed_jobs_count?: number;
  skills?: HelperListSkill[];
}

export interface HelperDetail {
  id: number;
  full_name: string;
  email?: string;
  phone_number?: string;
  profile_photo_url?: string | null;
  address?: string | null;
  created_at?: string;
  bio?: string | null;
  is_available?: boolean;
  avg_rating?: number | string;
  rating_count?: number;
  completed_jobs_count?: number;
  experience_years?: number;
  verification_status?: string;
  is_verified?: boolean;
}

export interface HelperSkillDetail {
  id: number;
  subcategory_id: number;
  experience_years?: number;
  hourly_rate?: number | string | null;
  fixed_rate?: number | string | null;
  available?: boolean;
  total_jobs_completed?: number;
  average_rating?: number | string;
  verification_status?: string;
  subcategory_name?: string;
  subcategory_slug?: string;
  subcategory_description?: string | null;
  price_model?: string;
  category_id?: number;
  category_name?: string;
  category_slug?: string;
}