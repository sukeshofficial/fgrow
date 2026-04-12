import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";

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
import billingEntityRoutes from "./routes/billingEntity.routes.js";
import reportRoutes from "./routes/report.routes.js";
import billingRoutes from "./routes/billing.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import leadRoutes from "./routes/lead.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import launchRoutes from "./routes/launch.routes.js";

import { errorMiddleware } from "./middleware/error.middleware.js";

const app = express();

app.use(compression());
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(cookieParser());

// ─── CORS ─────────────────────────────────────────────────────────────────
// All origins are configured via environment variables — no hardcoded URLs.
// Set FRONTEND_URL on Vercel dashboard to your deployed frontend origin.
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
  "https://fgrow.vercel.app",
  "https://fg-crm-super-admin.vercel.app",
  "https://fgrow.forgegrid.in",
  "http://localhost:5173",
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);

    // Clean the origin (remove trailing slash)
    const cleanOrigin = origin.endsWith("/") ? origin.slice(0, -1) : origin;
    const cleanAllowed = allowedOrigins.map((o) => (o.endsWith("/") ? o.slice(0, -1) : o));

    if (cleanAllowed.includes(cleanOrigin)) return callback(null, true);
    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// Handle OPTIONS preflight explicitly (required for Vercel serverless)
// Note: Express 5 requires explicit wildcard syntax — bare * is not valid.
app.options("/{*path}", cors(corsOptions));
app.use(cors(corsOptions));

app.use(express.urlencoded({ extended: true }));
// Note: /uploads static route removed — all files are served from Cloudinary.

app.use("/api/v0/auth", authRoutes);
app.use("/api/v0/tenant", tenantRoutes);
app.use("/api/v0/invitation", invitationRoutes);
app.use("/api/v0/clients", clientRoutes);
app.use("/api/v0/tags", tagRoutes);
app.use("/api/v0/client-groups", clientGroupRoutes);
app.use("/api/v0/services", serviceRoutes);
app.use("/api/v0/tasks", taskRoutes);
app.use("/api/v0/todos", todoRoutes);
app.use("/api/v0/invoices", invoiceRoutes);
app.use("/api/v0/receipts", receiptRoutes);
app.use("/api/v0/quotations", quotationRoutes);
app.use("/api/v0/expenses", expenseRoutes);
app.use("/api/v0/document-types", documentTypeRoutes);
app.use("/api/v0/documents", documentRoutes);
app.use("/api/v0/dsc", dscRoutes);
app.use("/api/v0/collection-requests", documentCollectionRequestRoutes);
app.use("/api/v0/billing-entities", billingEntityRoutes);
app.use("/api/v0/reports", reportRoutes);
app.use("/api/v0/billing", billingRoutes);
app.use("/api/v0/profile", profileRoutes);
app.use("/api/v0/leads", leadRoutes);
app.use("/api/v0/notifications", notificationRoutes);
app.use("/api/v0/launch", launchRoutes);



app.get("/api/v0/health", (req, res) => {
  res.json({ status: "OK" });
});

// Error handling middleware (must be last)
app.use(errorMiddleware);

export default app;
