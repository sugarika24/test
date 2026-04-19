import crypto from "crypto";

export function generateEsewaSignature({
  total_amount,
  transaction_uuid,
  product_code,
  secret,
}) {
  const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;

  return crypto
    .createHmac("sha256", secret)
    .update(message)
    .digest("base64");
}