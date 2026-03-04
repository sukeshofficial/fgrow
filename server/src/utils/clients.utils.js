// utils/client.utils.js

// PAN regex: 5 letters + 4 digits + 1 letter (e.g. ABCDE1234F)
export function validatePAN(pan) {
    if (!pan || typeof pan !== "string") return false;
    return /^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(pan.trim());
}

// GSTIN regex: 15 chars - 2 digits (state) + 10 PAN + 1 entity + 1 checksum
export function validateGSTIN(gstin) {
    if (!gstin || typeof gstin !== "string") return false;
    return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(gstin.trim());
}

/**
 * sanitize Mongo document for returning to API consumers
 * picks only fields you want to expose; tweak as required.
 */
export function sanitizeClientObject(doc) {
    if (!doc) return null;
    const c = (doc.toObject) ? doc.toObject() : doc;

    // pick fields to return (example)
    const allowed = {
        id: c._id,
        file_no: c.file_no,
        name: c.name,
        photo: c.photo,
        type: c.type,
        group: c.group,
        tags: c.tags,
        pan: c.pan,
        gstin: c.gstin,
        billing_profile: c.billing_profile,
        opening_balance: c.opening_balance,
        contacts: c.contacts,
        primary_contact_name: c.primary_contact_name,
        primary_contact_mobile: c.primary_contact_mobile,
        primary_contact_email: c.primary_contact_email,
        address: c.address,
        recurring_services: c.recurring_services,
        packages: c.packages,
        is_active: c.is_active,
        is_non_recurring: c.is_non_recurring,
        custom_fields: c.custom_fields,
        created_by: c.created_by,
        updated_by: c.updated_by,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
    };

    return allowed;
}