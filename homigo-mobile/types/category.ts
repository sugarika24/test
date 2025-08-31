export interface Category {
  id: number;
  name: string;
  slug?: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  display_order?: number;
  is_active?: boolean;
  is_featured?: boolean;
  created_at?: string;
  helper_count?: number | string;
}

export interface Subcategory {
  id: number;
  category_id: number;
  name: string;
  slug?: string;
  description?: string | null;
  price_model?: "FIXED" | "HOURLY" | string;
  base_price?: number | string | null;
  min_price?: number | string | null;
  max_price?: number | string | null;
  minimum_hours?: number | null;
  estimated_duration_min?: number | null;
  estimated_duration_max?: number | null;
  skill_level?: string | null;
  requires_verification?: boolean;
  icon?: string | null;
  popular?: boolean;
  display_order?: number;
  helper_count?: number ;
  category_name?: string;
  category_slug?: string;
}