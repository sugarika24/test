export type BookingStatus =
  | "PENDING"
  | "ACCEPTED"
  | "ON_THE_WAY"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED"
  | "RESCHEDULED";

export interface Booking {
  id: number;
  booking_number: string;
  user_id: number;
  helper_id: number;
  category_id?: number | null;
  subcategory_id?: number | null;
  helper_skill_id?: number | null;
  service_name?: string;
  booking_date: string;
  start_time: string;
  end_time?: string | null;
  duration_minutes?: number | null;
  service_address: string;
  latitude?: number | null;
  longitude?: number | null;
  special_instructions?: string | null;
  pricing_type?: string;
  hourly_rate?: number | string | null;
  fixed_rate?: number | string | null;
  estimated_amount?: number | string | null;
  final_amount?: number | string | null;
  commission_percent?: number | string | null;
  commission_amount?: number | string | null;
  helper_earning?: number | string | null;

  payment_status?: "UNPAID" | "INITIATED" | "PAID" | "FAILED" | "REFUNDED" | null;
  payment_method?: "COD" | "ONLINE" | null;
  transaction_id?: string | null;
  paid_at?: string | null;

  payout_status?: string;
  status: BookingStatus;
  created_at?: string;
  accepted_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;

  helper_name?: string;
  helper_photo?: string | null;
  helper_phone?: string | null;

  user_name?: string;
  user_photo?: string | null;
  user_phone?: string | null;
}

export interface CreateBookingPayload {
  helper_id: number | string;
  subcategory_id: number | string;
  booking_date: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  service_address: string;
  latitude?: number;
  longitude?: number;
  special_instructions?: string;
}