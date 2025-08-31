export interface ReviewItem {
  id: number;
  booking_id: number;
  user_id: number;
  helper_user_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at?: string;
  user_name?: string;
  user_profile_photo_url?: string | null;
}