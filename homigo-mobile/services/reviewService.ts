import { apiRequest } from "./api";

export async function createReview(
  payload: {
    booking_id: number;
    rating: number;
    comment?: string;
  },
  token: string
) {
  return apiRequest(
    "/reviews",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function updateReview(
  reviewId: number | string,
  payload: {
    rating: number;
    comment?: string;
  },
  token: string
) {
  return apiRequest(
    `/reviews/${reviewId}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function getHelperReviews(
  helperUserId: number | string,
  token?: string
) {
  return apiRequest(`/reviews/helper/${helperUserId}`, { method: "GET" }, token);
}

export async function getReviewByBooking(
  bookingId: number | string,
  token: string
) {
  return apiRequest(`/reviews/booking/${bookingId}`, { method: "GET" }, token);
}