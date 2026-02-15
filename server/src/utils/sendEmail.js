import nodemailer from "nodemailer"
import dotenv from "dotenv"
dotenv.config();

export default async function sendEmail(mail) {
    let mailTransporter =
        nodemailer.createTransport(
            {
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            }
        );

    mailTransporter
        .sendMail(mail,
            function (err, data) {
                if (err) {
                    console.log('Error Occurs');
                } else {
                    console.log('Email sent successfully');
                }
            });
}
