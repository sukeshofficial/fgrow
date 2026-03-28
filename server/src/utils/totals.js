export const computeInvoiceTotals = (items = []) => {
  let subtotal = 0; // This will be the GROSS subtotal (Qty * Price)
  let total_gst = 0;
  let discount_total = 0;

  for (const it of items) {
    const qty = Number(it.quantity || 0);
    const unit = Number(it.unit_price || 0);
    const discount = Number(it.discount || 0);
    const gst_rate = Number(it.gst_rate || 0);

    const lineNet = qty * unit;
    const lineAfterDiscount = Math.max(0, lineNet - discount);
    const gstAmount = (lineAfterDiscount * gst_rate) / 100;
    const totalLine = lineAfterDiscount + gstAmount;

    // Update the item object in-place for persistence
    it.gst_amount = gstAmount;
    it.total_amount = totalLine;

    subtotal += lineNet; // Gross!
    total_gst += gstAmount;
    discount_total += discount;
  }

  // Final Total = (Gross Subtotal - Total Discount) + Total GST
  const net_base = subtotal - discount_total;
  const raw_total = net_base + total_gst;
  
  const total_amount = Math.round((raw_total + Number.EPSILON) * 100) / 100;
  const round_off = Math.round((total_amount - raw_total) * 100) / 100;

  return { subtotal, total_gst, discount_total, total_amount, round_off };
};
