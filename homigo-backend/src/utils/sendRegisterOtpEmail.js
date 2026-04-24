import { sendEmail } from "./sendEmail.js";

export async function sendRegisterOtpEmail(email, otp, fullName = "User") {
  const subject = "Homigo Email Verification OTP";

  const text = `Hello ${fullName},

Your Homigo email verification OTP is: ${otp}

This OTP will expire in 10 minutes.

If you did not request this, please ignore this email.

Homigo Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
      <h2>Homigo Email Verification</h2>
      <p>Hello ${fullName},</p>
      <p>Your email verification OTP is:</p>
      <h1 style="letter-spacing: 4px;">${otp}</h1>
      <p>This OTP will expire in <b>10 minutes</b>.</p>
      <p>If you did not request this, please ignore this email.</p>
      <br />
      <p>Homigo Team</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject,
    text,
    html,
  });
}