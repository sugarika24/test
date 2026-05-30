import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS.replace(/\s/g, ""),
  },
  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000,
});

transporter.verify((error) => {
  if (error) {
    console.log("SMTP VERIFY ERROR:", error);
  } else {
    console.log("SMTP READY");
  }
});

export async function sendEmail({ to, subject, html, text }) {
  const mailOptions = {
    from: `"Homigo" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  };

  return transporter.sendMail(mailOptions);
}