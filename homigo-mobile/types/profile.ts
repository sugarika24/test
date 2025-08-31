export interface Profile {
  id: number;
  full_name: string;
  email: string;
  role: "USER" | "HELPER" | "ADMIN";
  phone_number?: string | null;
  profile_photo_url?: string | null;
  address?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface HelperProfile extends Profile {
  bio?: string | null;
  hourly_rate?: string | number | null;
  category_id?: number | null;
  category_name?: string | null;
  is_available?: boolean;
  avg_rating?: string | number;
  rating_count?: number;
  completed_jobs_count?: number;
  experience_years?: number;
  verification_status?: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  is_verified?: boolean;
  verified_at?: string | null;
  rejection_reason?: string | null;
}

export interface UpdateProfilePayload {
  full_name?: string;
  phone_number?: string;
  profile_photo_url?: string;
  address?: string;
}

export interface UpdateHelperProfilePayload {
  bio?: string;
  hourly_rate?: number | string;
  category_id?: number | null;
  is_available?: boolean;
  experience_years?: number;
}