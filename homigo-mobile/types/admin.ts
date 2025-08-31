export interface AdminHelperItem {
  id: number;
  user_id: number;
  bio?: string | null;
  hourly_rate?: number | string | null;
  category_id?: number | null;
  is_available?: boolean;
  experience_years?: number;
  avg_rating?: number | string;
  rating_count?: number;
  completed_jobs_count?: number;
  verification_status?: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  is_verified?: boolean;
  verified_by?: number | null;
  verified_at?: string | null;
  rejection_reason?: string | null;
  created_at?: string;

  full_name: string;
  email: string;
  phone_number?: string | null;
  profile_photo_url?: string | null;
  address?: string | null;
  is_active?: boolean;

  document_type?: string | null;
  document_number?: string | null;
  document_url?: string | null;
}

export interface AdminCompletedBooking {
  id: number;
  booking_number: string;
  user_id: number;
  helper_id: number;
  category_id: number | null;
  subcategory_id: number | null;
  service_name: string;
  booking_date: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number;
  service_address: string;
  pricing_type: string;
  hourly_rate: string;
  fixed_rate: string;
  estimated_amount: string;
  final_amount: string;
  status: string;
  payment_status: string;
  commission_percent: string;
  commission_amount: string;
  helper_earning: string;
  payout_status: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  helper_name: string;
  helper_email: string;
  helper_phone: string;
  helper_profile_id: number | null;
  helper_bio: string | null;
  helper_profile_hourly_rate: string | null;
  is_available: boolean | null;
  experience_years: number | null;
  verification_status: string | null;
  is_verified: boolean | null;
  category_name: string | null;
  subcategory_name: string | null;
}

export interface AdminUserItem {
  id: number;
  full_name: string;
  email: string;
  phone_number?: string | null;
  role: "USER" | "HELPER" | "ADMIN";
  profile_photo_url?: string | null;
  address?: string | null;
  is_active: boolean;
  created_at?: string;
}