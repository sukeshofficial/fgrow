import { Report } from '../models/report/report.model.js';
import sendEmail from '../utils/sendEmail.js';
import { uploadBugScreenshots } from '../utils/cloudinary.js';
import logger from '../utils/logger.js';

export const createReport = async (req, res, next) => {
    try {
        const { type, title, description } = req.body;

        if (!title || !description) {
            return res.status(400).json({ message: "Title and description are required" });
        }

        // Handle screenshot uploads
        let screenshotUrls = [];
        if (req.files && req.files.length > 0) {
            screenshotUrls = await uploadBugScreenshots(req.files);
        }

        const report = await Report.create({
            type: type || "bug",
            title,
            description,
            reportedBy: req.user.id,
            tenantId: req.user.tenant_id,
            screenshots: screenshotUrls
        });

        // Populate names for the admin email
        await report.populate([
            { path: 'reportedBy', select: 'name' },
            { path: 'tenantId', select: 'name' }
        ]);

        // Send email to super admin
        const superAdminEmailsStr = process.env.SUPER_ADMIN_EMAILS || "";
        const emails = superAdminEmailsStr.split(",").map(e => e.trim()).filter(Boolean);

        if (emails.length > 0) {
            const mailOptions = {
                to: emails.join(","),
                subject: `[New ${report.type.toUpperCase()}] ${title}`,
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
                        <h2 style="color: #4f46e5;">New System Report Submitted</h2>
                        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                            <p><strong>Type:</strong> <span style="text-transform: capitalize;">${report.type.replace('_', ' ')}</span></p>
                            <p><strong>Title:</strong> ${title}</p>
                            <p><strong>Reported By:</strong> ${report.reportedBy?.name || 'Unknown'} (${req.user.id})</p>
                            <p><strong>Tenant:</strong> ${report.tenantId?.name || 'Unknown'} (${req.user.tenant_id})</p>
                            ${report.screenshots?.length > 0 ? `<p><strong>Screenshots Attached:</strong> ${report.screenshots.length}</p>` : ''}
                        </div>
                        <h3>Description:</h3>
                        <div style="background: #ffffff; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px;">
                            ${description.replace(/\n/g, '<br>')}
                        </div>
                        ${report.screenshots?.length > 0 ? `
                        <h3>Screenshots:</h3>
                        <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                            ${report.screenshots.map(url => `
                                <a href="${url}" target="_blank">
                                    <img src="${url}" style="width: 150px; height: 100px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd;">
                                </a>
                            `).join('')}
                        </div>
                        ` : ''}
                    </div>
                `
            };

            // Fire and forget email
            sendEmail(mailOptions).catch(err => {
                logger.error("Failed to send email for report", err);
            });
        }

        // Send email to reporter (Confirmation)
        if (req.user.data?.email) {
            const reporterMailOptions = {
                to: req.user.data.email,
                subject: `Report Received: ${title} [#${report._id.toString().slice(-6).toUpperCase()}]`,
                html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
                        * { font-family: 'Poppins', Arial, sans-serif !important; }
                    </style>
                </head>
                <body style="margin: 0; padding: 0; background-color: #ffffff; font-family: 'Poppins', Arial, sans-serif;">
                    <div style="max-width: 600px; margin: 40px auto; background: #ffffff; color: #1e293b; padding: 48px 40px; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); font-family: 'Poppins', Arial, sans-serif;">
                        <div style="text-align: center; margin-bottom: 32px;">
                            <img src="https://res.cloudinary.com/dbaeuihz7/image/upload/v1775310579/tenants/a7tvcuo0moqztzeoevaz.png" alt="FGrow" style="width: 60px; height: 60px; border-radius: 12px; margin-bottom: 16px;">
                            <h2 style="color: #2563eb; margin: 0; font-weight: 700;">Report Received</h2>
                            <p style="color: #64748b; font-size: 14px; margin-top: 8px;">Hi ${req.user.data.name || 'there'}, we've received your ${report.type.replace('_', ' ')}.</p>
                        </div>
                        
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 16px; margin-bottom: 24px;">
                            <p style="margin: 0; font-weight: 600; color: #1e293b;">${title}</p>
                            <p style="margin: 8px 0 0; font-size: 14px; color: #64748b; line-height: 1.6;">${description}</p>
                        </div>

                        <p style="font-size: 14px; line-height: 1.6; color: #475569;">Our team has been notified and we'll look into this as soon as possible. You'll receive another email once the status changes.</p>
                        
                        <div style="text-align: center; margin-top: 48px; border-top: 1px solid #f1f5f9; padding-top: 24px;">
                            <p style="font-size: 13px; color: #94a3b8; margin: 0;">
                                Thank you for your feedback.<br>
                                <strong>The ForgeGrid Team</strong>
                            </p>
                        </div>
                    </div>
                </body>
                </html>
                `
            };
            sendEmail(reporterMailOptions).catch(err => logger.error("Failed to send confirmation email", err));
        }

        res.status(201).json({ success: true, message: "Report submitted successfully", data: report });
    } catch (error) {
        logger.error("Create report err:", error);
        res.status(500).json({ message: "Error submitting report" });
    }
};

export const getReports = async (req, res, next) => {
    try {
        // Only Super Admins should be able to get these
        if (req.user.platform_role !== "super_admin") {
            return res.status(403).json({ message: "Forbidden: Super Admin only" });
        }

        const reports = await Report.find({})
            .populate('reportedBy', 'name email profile_avatar')
            .populate('tenantId', 'name companyEmail logoUrl')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, message: "Reports fetched successfully", data: reports });
    } catch (error) {
        logger.error("Get reports err:", error);
        res.status(500).json({ message: "Error fetching reports" });
    }
};

export const updateReportStatus = async (req, res, next) => {
    try {
        if (req.user.platform_role !== "super_admin") {
            return res.status(403).json({ message: "Forbidden: Super Admin only" });
        }

        const { id } = req.params;
        const { status, resolutionTitle, resolutionDescription } = req.body;

        // Handle resolution screenshots if any
        let resolutionScreenshotUrls = [];
        if (req.files && req.files.length > 0) {
            resolutionScreenshotUrls = await uploadBugScreenshots(req.files);
        }

        const updateData = { status };
        if (status === "resolved") {
            updateData.resolution = {
                title: resolutionTitle,
                description: resolutionDescription,
                screenshots: resolutionScreenshotUrls,
                resolvedAt: new Date()
            };
        }

        const report = await Report.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        ).populate('reportedBy', 'name email');

        if (!report) {
            return res.status(404).json({ message: "Report not found" });
        }

        // Send email to reporter if status is resolved
        if (status === "resolved" && report.reportedBy?.email) {
            const isFeature = report.type === "feature_request";
            const actionWord = isFeature ? "Implemented" : "Resolved";
            const subjectPrefix = isFeature ? "Feature Implemented" : "Issue Fixed";
            const greetingNote = isFeature ? "the feature you requested has been implemented" : "the issue you reported earlier has been fixed";

            const resolutionMailOptions = {
                to: report.reportedBy.email,
                subject: `${subjectPrefix}: ${report.title}`,
                html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
                        * { font-family: 'Poppins', Arial, sans-serif !important; }
                    </style>
                </head>
                <body style="margin: 0; padding: 0; background-color: #ffffff; font-family: 'Poppins', Arial, sans-serif;">
                    <div style="max-width: 600px; margin: 40px auto; background: #ffffff; color: #1e293b; padding: 48px 40px; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); font-family: 'Poppins', Arial, sans-serif;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                          <tr>
                            <td align="center" style="padding: 0 0 24px 0;">
                              <div style="width: 50px; height: 50px; line-height: 50px; background-color: #dcfce7; color: #22c55e; border-radius: 25px; text-align: center; font-size: 24px; font-weight: bold; display: inline-block;">
                                ✓
                              </div>
                            </td>
                          </tr>
                        </table>
                        
                        <div style="text-align: center; margin-bottom: 32px;">
                            <h2 style="color: #059669; margin: 0; font-weight: 700;">${isFeature ? 'Feature Live!' : 'Issue Resolved!'}</h2>
                            <p style="color: #64748b; font-size: 14px; margin-top: 8px;">Hi ${report.reportedBy.name || 'there'}, ${greetingNote}.</p>
                        </div>
                        
                        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 16px; margin-bottom: 24px;">
                            <p style="margin: 0; font-weight: 600; color: #166534;">${report.title}</p>
                            <p style="margin: 8px 0 0; font-size: 14px; color: #15803d;">Status updated to: <strong>Resolved</strong></p>
                        </div>

                        ${report.resolution?.title ? `
                        <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 20px; border-radius: 16px; margin-bottom: 24px;">
                            <h3 style="color: #2563eb; margin-top: 0; font-size: 16px;">Resolution Details</h3>
                            <p style="font-size: 14px; margin: 12px 0;"><strong>Summary:</strong> ${report.resolution.title}</p>
                            <p style="font-size: 14px; margin: 12px 0;"><strong>Description:</strong></p>
                            <div style="color: #475569; font-size: 13px; line-height: 1.6; background: #f8fafc; padding: 12px; border-radius: 8px;">${report.resolution.description.replace(/\n/g, '<br>')}</div>
                            
                            ${report.resolution.screenshots?.length > 0 ? `
                            <p style="margin-top: 16px; font-size: 14px;"><strong>Proof of Fix:</strong></p>
                            <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 8px;">
                                ${report.resolution.screenshots.map(url => `
                                    <a href="${url}" target="_blank" style="text-decoration: none;">
                                        <img src="${url}" style="width: 120px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0;">
                                    </a>
                                `).join('')}
                            </div>
                            ` : ''}
                        </div>
                        ` : ''}

                        <div style="text-align: center; margin-top: 48px; border-top: 1px solid #f1f5f9; padding-top: 24px;">
                            <p style="font-size: 13px; color: #94a3b8; margin: 0;">
                                Thank you for helping us improve.<br>
                                <strong>The ForgeGrid Team</strong>
                            </p>
                        </div>
                    </div>
                </body>
                </html>
                `
            };
            sendEmail(resolutionMailOptions).catch(err => logger.error("Failed to send resolution email", err));
        }

        res.status(200).json({ success: true, message: "Report status updated", data: report });
    } catch (error) {
        logger.error("Update report status err:", error);
        res.status(500).json({ message: "Error updating report" });
    }
};
