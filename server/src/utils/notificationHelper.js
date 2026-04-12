import Notification from "../models/notification/notification.model.js";
import sendEmail from "./sendEmail.js";
import logger from "./logger.js";

/**
 * Send a notification to a specific user
 * @param {Object} params
 * @param {String} params.tenant_id
 * @param {String} params.recipientId
 * @param {String} params.senderId
 * @param {String} params.type
 * @param {String} params.title
 * @param {String} params.message
 * @param {String} params.link
 * @param {Object} params.metadata
 * @param {Boolean} params.sendEmailFlag
 */
export const notify = async ({
    tenant_id,
    recipientId,
    recipientEmail,
    senderId = null,
    type,
    title,
    message,
    link = null,
    metadata = {},
    sendEmailFlag = true
}) => {
    try {
        // 1. Create In-App Notification
        await Notification.create({
            tenant_id,
            recipient: recipientId,
            sender: senderId,
            type,
            title,
            message,
            link,
            metadata
        });

        // 2. Send Email if requested and email is available
        if (sendEmailFlag && recipientEmail) {
            try {
                await sendEmail({
                    to: recipientEmail,
                    subject: `${title} - FGROW`,
                    text: message,
                    html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #333;">${title}</h2>
              <p style="color: #555; font-size: 16px;">${message}</p>
              ${link ? `<a href="${process.env.FRONTEND_URL || 'https://fgrow.forgegrid.in'}${link}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">View Details</a>` : ''}
            </div>
          `
                });
            } catch (emailErr) {
                logger.error(`Failed to send notification email to ${recipientEmail}:`, emailErr);
            }
        }
    } catch (err) {
        logger.error("Error creating notification:", err);
    }
};
