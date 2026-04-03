import Razorpay from "razorpay";
import crypto from "crypto";
import logger from "../utils/logger.js";

const getRazorpayInstance = () => {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
        logger.error("Razorpay Key ID or Secret missing in environment variables");
        throw new Error("Razorpay configuration missing");
    }

    return new Razorpay({
        key_id,
        key_secret,
    });
};

/**
 * Create a new Razorpay order
 * @param {number} amount - Amount in smallest currency unit (e.g., paise for INR)
 * @param {string} currency - Currency code (e.g., "INR")
 * @param {string} receipt - Unique receipt ID for reference
 * @returns {Promise<Object>} - Razorpay order object
 */
export const createOrder = async (amount, currency, receipt) => {
    try {
        const razorpay = getRazorpayInstance();
        const options = {
            amount: Math.round(amount * 100), // Convert to paise
            currency,
            receipt,
        };

        const order = await razorpay.orders.create(options);
        return order;
    } catch (error) {
        logger.error("Error creating Razorpay order:", error);
        throw error;
    }
};

/**
 * Verify Razorpay payment signature
 * @param {string} orderId - Razorpay Order ID
 * @param {string} paymentId - Razorpay Payment ID
 * @param {string} signature - Razorpay Signature
 * @returns {boolean} - True if signature is valid
 */
export const verifySignature = (orderId, paymentId, signature) => {
    try {
        const key_secret = process.env.RAZORPAY_KEY_SECRET;
        const body = orderId + "|" + paymentId;

        const expectedSignature = crypto
            .createHmac("sha256", key_secret)
            .update(body.toString())
            .digest("hex");

        return expectedSignature === signature;
    } catch (error) {
        logger.error("Error verifying Razorpay signature:", error);
        return false;
    }
};

/**
 * Verify Razorpay webhook signature
 * @param {Buffer|string} rawBody - Raw request body
 * @param {string} signature - X-Razorpay-Signature header
 * @returns {boolean} - True if signature is valid
 */
export const verifyWebhookSignature = (rawBody, signature) => {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const expectedSignature = crypto
            .createHmac("sha256", webhookSecret)
            .update(rawBody)
            .digest("hex");

        return expectedSignature === signature;
    } catch (error) {
        logger.error("Error verifying Razorpay webhook signature:", error);
        return false;
    }
};
