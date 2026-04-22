import logger from "../utils/logger.js";
import { validateGSTIN } from "../utils/helper.js";

/**
 * Maps gstincheck.co.in response fields to a clean normalized shape.
 *
 * gstincheck wraps data under a `data` key using GST portal short field names:
 *   lgnm     → legal name
 *   tradeNam → trade name
 *   sts      → status (Active / Cancelled)
 *   ctb      → constitution of business
 *   dty      → taxpayer type
 *   rgdt     → registration date
 *   stj      → state jurisdiction
 *   ctj      → center jurisdiction
 *   pradr    → principal address object
 *   nba      → nature of business activities []
 *   adhrVFlag→ aadhaar authenticated
 *   ekycVFlag→ ekyc verified
 */
const normalizeGstinCheckResponse = (gstin, data) => {
    const addr = data?.pradr?.addr || {};

    const addressParts = [
        addr.flno,
        addr.bno,
        addr.bnm,
        addr.st,
        addr.loc,
        addr.dst,
        addr.stcd,
        addr.pncd,
    ].filter(Boolean);

    return {
        gstin:                      gstin.toUpperCase(),
        legalName:                  data.lgnm      || "",
        tradeName:                  data.tradeNam  || "",
        registrationDate:           data.rgdt      || "",
        cancellationDate:           data.cxdt      || null,
        status:                     data.sts       || "",
        constitution:               data.ctb       || "",
        taxpayerType:               data.dty       || "",
        aadhaarAuthenticated:       data.adhrVFlag || "N/A",
        ekycVerified:               data.ekycVFlag || "N/A",
        pan:                        gstin.substring(2, 12),
        address:                    data.pradr?.adr || addressParts.join(", "),
        stateJurisdiction:          data.stj       || "",
        centerJurisdiction:         data.ctj       || "",
        natureOfBusinessActivities: data.nba       || [],
        lastUpdated:                data.lstupdt   || "",
    };
};

export const verifyGSTIN = async (req, res) => {
    try {
        const { gstin } = req.params;

        if (!gstin) {
            return res.status(400).json({ success: false, message: "GSTIN is required" });
        }

        const normalizedGstin = gstin.trim().toUpperCase();

        // Step 1: Local format + checksum validation before hitting the API
        if (!validateGSTIN(normalizedGstin)) {
            return res.status(400).json({
                success: false,
                message: "Invalid GSTIN format or checksum",
            });
        }

        logger.info(`GSTIN verification requested: ${normalizedGstin}`);

        // Step 2: Ensure API key is configured
        const apiKey = process.env.GST_API_KEY_GSTINCHECK;
        if (!apiKey) {
            logger.error("GST_API_KEY_GSTINCHECK is not set in environment variables");
            return res.status(500).json({
                success: false,
                message: "GSTIN verification service is not configured",
            });
        }

        // Step 3: Call gstincheck.co.in — API key is part of the URL path
        const url = `https://sheet.gstincheck.co.in/check/${apiKey}/${normalizedGstin}`;

        const response = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
            logger.error(`gstincheck API error: HTTP ${response.status}`);
            return res.status(502).json({
                success: false,
                message: "GSTIN verification service is unavailable. Please try again.",
            });
        }

        const json = await response.json();

        // Step 4: gstincheck returns { flag: false, message: "..." } on failure
        if (!json?.flag) {
            logger.warn(`gstincheck rejected GSTIN ${normalizedGstin}: ${json?.message}`);
            return res.status(404).json({
                success: false,
                message: json?.message || "GSTIN not found or not registered under GST",
            });
        }

        // Step 5: Validate we actually got data
        if (!json?.data) {
            logger.error("Unexpected gstincheck response shape:", json);
            return res.status(502).json({
                success: false,
                message: "Received an unexpected response from the verification service",
            });
        }

        // Step 6: Guard against mismatched GSTIN in response (silent fallback protection)
        const returnedGstin = json.data?.gstin?.toUpperCase();
        if (returnedGstin && returnedGstin !== normalizedGstin) {
            logger.warn(
                `gstincheck GSTIN mismatch — requested: ${normalizedGstin}, got: ${returnedGstin}`
            );
            return res.status(404).json({
                success: false,
                message: "GSTIN not found or details unavailable for the provided GSTIN",
            });
        }

        // Step 7: Normalize and respond
        const data = normalizeGstinCheckResponse(normalizedGstin, json.data);

        logger.info(`GSTIN verified successfully: ${normalizedGstin} — ${data.legalName}`);

        return res.status(200).json({
            success: true,
            data: {
                organizationName: data.tradeName || data.legalName,
                address:          data.address,
                details:          data,
            },
        });

    } catch (err) {
        if (err.name === "TimeoutError" || err.name === "AbortError") {
            logger.error(`GSTIN verification timed out for: ${req.params.gstin}`);
            return res.status(504).json({
                success: false,
                message: "GSTIN verification timed out. Please try again.",
            });
        }

        logger.error("GSTIN Verification Error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to verify GSTIN. Internal server error.",
            ...(process.env.NODE_ENV === "development" && { error: err.message }),
        });
    }
};