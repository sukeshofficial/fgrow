import nodemailer from "nodemailer";
import dotenv from "dotenv";
import logger from "./logger.js";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 5000,
  greetingTimeout: 5000,
});

// Debug log for production initialization
if (process.env.NODE_ENV === "production") {
  const maskedUser = process.env.EMAIL_USER ? `${process.env.EMAIL_USER.slice(0, 3)}***${process.env.EMAIL_USER.slice(-3)}` : "MISSING";
  const passStatus = process.env.EMAIL_PASS ? "PRESENT" : "MISSING";
  logger.info(`📧 Email initialization: User: ${maskedUser}, Password: ${passStatus}`);
}


export default async function sendEmail(mail) {
  try {
    logger.info(`📧 Sending email to: ${mail.to}...`);
    const result = await transporter.sendMail(mail);
    logger.info("✅ Email sent successfully");
    return result;
  } catch (err) {
    logger.error("❌ Error sending email:", err);
    throw err;
  }
}
