import {
  getAdminRefundRequests,
  updateRefundStatus,
} from "./paymentService";

export async function fetchRefundRequests() {
  return getAdminRefundRequests();
}

export async function approveRefund(
  bookingId: number,
  note = "Refund approved by admin"
) {
  return updateRefundStatus(
    bookingId,
    "REFUND_APPROVED",
    note
  );
}

export async function rejectRefund(
  bookingId: number,
  note = "Refund rejected by admin"
) {
  return updateRefundStatus(
    bookingId,
    "REFUND_REJECTED",
    note
  );
}

export async function markRefunded(
  bookingId: number,
  note = "Refund completed"
) {
  return updateRefundStatus(
    bookingId,
    "REFUNDED",
    note
  );
}