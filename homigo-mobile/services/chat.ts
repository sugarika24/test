import { apiGet, apiPost, apiPut } from "./api";

export async function getChatList() {
  return await apiGet("/chat/list");
}
export async function getBookingMessages(bookingId: string | number) {
  return await apiGet(`/chat/${bookingId}/messages`);
}

export async function sendBookingMessage(
  bookingId: string | number,
  message: string
) {
  return await apiPost(`/chat/${bookingId}/messages`, { message });
}

export async function markBookingMessagesRead(bookingId: string | number) {
  return await apiPut(`/chat/${bookingId}/read`);
}