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
                            <p><strong>Reported By User ID:</strong> ${req.user.id}</p>
                            <p><strong>Tenant ID:</strong> ${req.user.tenant_id}</p>
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

        res.status(201).json({ success: true, message: "Report submitted successfully", data: report });
    } catch (error) {
        logger.error("Create report err:", error);
        res.status(500).json({ message: "Error submitting report" });
    }
};

export const getReports = async (req, res, next) => {
    try {
        // Only Super Admins should be able to get these
        if (req.user.platformRole !== "super_admin") {
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
        if (req.user.platformRole !== "super_admin") {
            return res.status(403).json({ message: "Forbidden: Super Admin only" });
        }

        const { id } = req.params;
        const { status } = req.body;

        const report = await Report.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!report) {
            return res.status(404).json({ message: "Report not found" });
        }

        res.status(200).json({ success: true, message: "Report status updated", data: report });
    } catch (error) {
        logger.error("Update report status err:", error);
        res.status(500).json({ message: "Error updating report" });
    }
};
