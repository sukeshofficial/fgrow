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
  connectionTimeout: 5000, // 5 seconds
  greetingTimeout: 5000, // 5 seconds
});

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
