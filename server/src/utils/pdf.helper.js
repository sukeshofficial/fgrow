export const generatePdfBuffer = async (invoiceObj) => {
  const content = `Invoice PDF for ${invoiceObj.invoice_no}\nTotal: ${invoiceObj.total_amount}`;
  return Buffer.from(content, "utf-8");
};
