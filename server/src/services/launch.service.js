import { LaunchSubscriber } from "../models/launch/LaunchSubscriber.model.js";
import sendEmail from "../utils/sendEmail.js";
import logger from "../utils/logger.js";

/**
 * Executes the launch announcement email dispatch to all unnotified subscribers.
 */
export const runLaunchAnnouncement = async () => {
    try {
        logger.info("Service: Running Launch Announcement dispatch...");

        const subscribers = await LaunchSubscriber.find({ notified: false });

        if (!subscribers.length) {
            logger.info("Service: No unnotified subscribers found.");
            return { success: true, count: 0, message: "No unnotified subscribers found." };
        }

        logger.info(`Service: Found ${subscribers.length} subscribers to notify.`);

        const subject = "FGROW is Officially LIVE! 🚀";
        const text = "The wait is over. FGrow – the ultimate hub for clients, tasks, and invoices – is live. Access now: https://fgrow.forgegrid.in";
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Poppins', sans-serif !important; }
                </style>
            </head>
            <body style="margin: 0; padding: 0; background-color: #ffffff; font-family: 'Poppins', sans-serif;">
                <div style="max-width: 600px; margin: 40px auto; background: #ffffff; color: #1e293b; padding: 48px 40px; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                    
                    <div style="text-align: center; margin-bottom: 32px;">
                        <img src="https://ph-files.imgix.net/b8edb0a9-627e-4829-86e3-5390905c583c.png?auto=format&fit=crop&w=128&h=128" alt="FGrow" style="width: 80px; height: 80px; border-radius: 16px; margin-bottom: 16px;">
                        <h1 style="color: #2563eb; font-size: 32px; margin: 0; letter-spacing: -0.02em; font-weight: 700;">FGROW is LIVE!</h1>
                        <p style="color: #64748b; font-size: 14px; margin-top: 8px;">Version 1.0.0 · Production-Ready</p>
                    </div>

                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-bottom: 32px;">
                        <p style="font-size: 14px; line-height: 1.7; color: #334155; margin: 0; text-align: justify;">
                            The wait is officially over. <br><br>
                            We're thrilled to announce that <strong>FGrow</strong> - the ultimate self-hosted hub for CA, CS, and compliance teams - is now live and ready for your production environment. 
                            From client onboarding to automated invoicing, manage everything in one secure place.
                        </p>
                    </div>

                    <div style="text-align: center; margin: 40px 0;">
                        <a href="https://fgrow.forgegrid.in" style="background: linear-gradient(135deg, #2563eb, #7c3aed); color: #ffffff !important; text-decoration: none; padding: 18px 36px; border-radius: 12px; font-weight: 700; font-size: 18px; display: inline-block; box-shadow: 0 10px 20px rgba(37, 99, 235, 0.2);">
                            Launch FGrow App →
                        </a>
                    </div>

                    <div style="margin: 40px 0; border-top: 1px solid #e2e8f0; padding-top: 40px;">
                        <p style="font-size: 13px; color: #94a3b8; margin-bottom: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; text-align: center;">Support our launch</p>
                        
                        <!-- Product Hunt Embed (Light Mode) -->
                        <div style="margin: 0 auto; max-width: 500px; text-align: left;">
                            <div style="font-family: inherit; border: 1px solid #e0e0e0; border-radius: 12px; padding: 20px; background: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                                    <img alt="FGrow" src="https://ph-files.imgix.net/b8edb0a9-627e-4829-86e3-5390905c583c.png?auto=format&fit=crop&w=80&h=80" style="width: 64px; height: 64px; border-radius: 8px; object-fit: cover; flex-shrink: 0;">
                                    <div style="flex: 1 1 0%; min-width: 0px; margin-left: 12px;">
                                        <h3 style="margin: 0px; font-size: 18px; font-weight: 600; color: #1a1a1a; line-height: 1.3;">FGrow</h3>
                                        <p style="margin: 4px 0px 0px; font-size: 14px; color: #666666; line-height: 1.4;">One secure hub for clients, tasks, and invoices.</p>
                                    </div>
                                </div>
                                <div style="margin-top: 12px;">
                                    <a href="https://www.producthunt.com/products/fgrow?embed=true&utm_source=embed&utm_medium=post_embed" target="_blank" rel="noopener" style="display: inline-block; padding: 10px 20px; background: #ff6154; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600;">Check it out on Product Hunt →</a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style="text-align: center; margin-top: 48px; border-top: 1px solid #f1f5f9; padding-top: 24px;">
                        <p style="font-size: 13px; color: #94a3b8; margin: 0;">
                            Thank you for being part of our early journey.<br>
                            <strong>The ForgeGrid Team</strong>
                        </p>
                        <div style="margin-top: 16px;">
                            <a href="https://fgrow.forgegrid.in" style="color: #64748b; text-decoration: none; font-size: 12px; margin: 0 8px;">Website</a>
                            <span style="color: #e2e8f0;">•</span>
                            <a href="https://mail.google.com/mail/?view=cm&fs=1&to=sukesh.official.2006@gmail.com&su=FGrow%20Feedback"
                            target="_blank"
                            style="color: #64748b; text-decoration: none; font-size: 12px; margin: 0 8px;">
                            Feedback
                            </a>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        let successCount = 0;
        let failCount = 0;

        for (const sub of subscribers) {
            try {
                await sendEmail({
                    to: sub.email,
                    subject,
                    text,
                    html
                });

                sub.notified = true;
                await sub.save();
                successCount++;
            } catch (err) {
                logger.error(`Service: Failed to send launch email to ${sub.email}:`, err);
                failCount++;
            }
        }

        logger.info(`Service: Launch Announcement dispatch completed. Success: ${successCount}, Failed: ${failCount}`);

        return {
            success: true,
            count: successCount,
            failed: failCount,
            message: `Dispatch completed. Successfully notified ${successCount} subscribers.${failCount > 0 ? ` Failed to notify ${failCount}.` : ""}`
        };
    } catch (error) {
        logger.error("Service: Error in runLaunchAnnouncement:", error);
        throw error;
    }
};
