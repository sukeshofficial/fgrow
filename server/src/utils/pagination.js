export const buildPagination = (page, per_page) => {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const pp = Math.max(1, parseInt(per_page, 10) || 20);
  const skip = (p - 1) * pp;
  return { skip, limit: pp };
};
