import DocumentCollectionRequestCounter from "../models/documentCollectionRequest/schemas/documentCollectionRequestCounter.model.js";

export const generateCollectionRequestNumber = async (tenant_id) => {

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // Jan = 1

  let startYear;
  let endYear;

  // Financial year calculation
  if (month >= 4) {
    startYear = year;
    endYear = year + 1;
  } else {
    startYear = year - 1;
    endYear = year;
  }

  const fyYear = startYear; // used for counter

  const counter = await DocumentCollectionRequestCounter.findOneAndUpdate(
    { tenant_id, year: fyYear },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const seq = counter.seq.toString().padStart(3, "0");

  const startYY = startYear.toString().slice(-2);
  const endYY = endYear.toString().slice(-2);

  return `DCR/${startYY}-${endYY}/${seq}`;
};