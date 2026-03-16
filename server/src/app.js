import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";

import authRoutes from "./routes/auth.routes.js";
import tenantRoutes from "./routes/tenant.routes.js";
import invitationRoutes from "./routes/invitation.routes.js";
import clientRoutes from "./routes/client.routes.js";
import tagRoutes from "./routes/tag.routes.js";
import clientGroupRoutes from "./routes/clientGroup.routes.js";
import serviceRoutes from "./routes/service.routes.js";
import taskRoutes from "./routes/task.routes.js";
import todoRoutes from "./routes/todo.routes.js";
import invoiceRoutes from "./routes/invoice.routes.js";
import receiptRoutes from "./routes/receipt.routes.js";
import quotationRoutes from "./routes/quotation.routes.js";
import expenseRoutes from "./routes/expense.routes.js";
import documentTypeRoutes from "./routes/documentType.routes.js";
import documentRoutes from "./routes/document.routes.js";
import dscRoutes from "./routes/dsc.routes.js";
import documentCollectionRequestRoutes from "./routes/documentCollectionRequest.routes.js";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api/v0/auth", authRoutes);
app.use("/api/v0/tenant", tenantRoutes);
app.use("/api/v0/invitation", invitationRoutes);
app.use("/api/v0/clients", clientRoutes);
app.use("/api/v0/tags", tagRoutes);
app.use("/api/v0/client-groups", clientGroupRoutes);
app.use("/api/v0/services", serviceRoutes);
app.use("/api/v0/tasks", taskRoutes);
app.use("/api/v0/todo", todoRoutes);
app.use("/api/v0/invoices", invoiceRoutes);
app.use("/api/v0/receipts", receiptRoutes);
app.use("/api/v0/quotations", quotationRoutes);
app.use("/api/v0/expenses", expenseRoutes);
app.use("/api/v0/document-types", documentTypeRoutes);
app.use("/api/v0/documents", documentRoutes);
app.use("/api/v0/dsc", dscRoutes);
app.use("/api/v0/collection-requests", documentCollectionRequestRoutes);

app.get("/api/v0/health", (req, res) => {
  res.json({ status: "OK" });
});

export default app;
