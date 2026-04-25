import { Feedback } from "../models/feedback/feedback.model.js";
import sendEmail from "../utils/sendEmail.js";
import logger from "../utils/logger.js";

/**
 * POST /api/v0/feedback
 * Submit feedback (any authenticated user)
 */
export const createFeedback = async (req, res, next) => {
    try {
        const { category, rating, comment, metadata } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res
                .status(400)
                .json({ message: "A rating between 1 and 5 is required." });
        }

        if (!category) {
            return res.status(400).json({ message: "Category is required." });
        }

        const feedback = await Feedback.create({
            user_id: req.user.id,
            tenant_id: req.user.tenant_id || null,
            category,
            rating: Number(rating),
            comment: comment?.trim() || "",
            metadata: metadata || {},
        });

        // Populate for the admin notification email
        await feedback.populate([
            { path: "user_id", select: "name email" },
            { path: "tenant_id", select: "name" },
        ]);

        // Notify Super Admins
        const superAdminEmailsStr = process.env.SUPER_ADMIN_EMAILS || "";
        const emails = superAdminEmailsStr
            .split(",")
            .map((e) => e.trim())
            .filter(Boolean);

        if (emails.length > 0) {
            const stars = "★".repeat(Number(rating)) + "☆".repeat(5 - Number(rating));
            const mailOptions = {
                to: emails.join(","),
                subject: `[Feedback] ${stars} — ${category} from ${feedback.user_id?.name || "Unknown"}`,
                html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
            <h2 style="color: #4f46e5;">New User Feedback Received</h2>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <p><strong>User:</strong> ${feedback.user_id?.name || "Unknown"} (${feedback.user_id?.email || "N/A"})</p>
              <p><strong>Tenant:</strong> ${feedback.tenant_id?.name || "No Tenant"}</p>
              <p><strong>Category:</strong> ${category}</p>
              <p><strong>Rating:</strong> ${stars} (${rating}/5)</p>
            </div>
            ${comment
                        ? `<h3>Comment:</h3><div style="background: #ffffff; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px;">${comment.replace(/\n/g, "<br>")}</div>`
                        : "<p><em>No comment provided.</em></p>"
                    }
          </div>
        `,
            };

            sendEmail(mailOptions).catch((err) =>
                logger.error("Failed to send feedback notification email", err)
            );
        }

        res
            .status(201)
            .json({ success: true, message: "Feedback submitted. Thank you!", data: feedback });
    } catch (error) {
        logger.error("Create feedback error:", error);
        next(error);
    }
};

/**
 * GET /api/v0/feedback/admin
 * List all feedback entries (Super Admin only)
 */
export const getFeedbacks = async (req, res, next) => {
    try {
        const { status, category, rating, page = 1, limit = 20 } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (category) filter.category = category;
        if (rating) filter.rating = Number(rating);

        const skip = (Number(page) - 1) * Number(limit);

        const [feedbacks, total] = await Promise.all([
            Feedback.find(filter)
                .populate("user_id", "name email profile_avatar")
                .populate("tenant_id", "name companyEmail logoUrl")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            Feedback.countDocuments(filter),
        ]);

        // Aggregate average rating
        const ratingAgg = await Feedback.aggregate([
            { $group: { _id: null, avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
        ]);

        const stats = ratingAgg[0] || { avgRating: 0, count: 0 };

        res.status(200).json({
            success: true,
            data: feedbacks,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit)),
            },
            stats: {
                averageRating: Math.round(stats.avgRating * 10) / 10,
                totalFeedbacks: stats.count,
            },
        });
    } catch (error) {
        logger.error("Get feedbacks error:", error);
        next(error);
    }
};

/**
 * PATCH /api/v0/feedback/admin/:id
 * Update the status of a feedback entry (Super Admin only)
 */
export const updateFeedbackStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = ["new", "reviewed", "archived"];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status." });
        }

        const feedback = await Feedback.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        )
            .populate("user_id", "name email")
            .populate("tenant_id", "name");

        if (!feedback) {
            return res.status(404).json({ message: "Feedback not found." });
        }

        res.status(200).json({
            success: true,
            message: "Feedback status updated.",
            data: feedback,
        });
    } catch (error) {
        logger.error("Update feedback status error:", error);
        next(error);
    }
};
