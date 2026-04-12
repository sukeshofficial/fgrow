import { useEffect, lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

/* Global styles */
import "./App.css";
import "./styles/spinner.css";
import "./styles/auth.css"
import "./styles/auth-base.css"
import "./styles/auth-layout.css"
import "./styles/login-form.css"
import "./styles/register-form.css"
import "./styles/dashboard.css";
import "./styles/avatar-upload.css";
import "./styles/otp-modal.css";
import "./styles/password-meter.css";
import "./styles/navbar.css"
import "./styles/sidebar.css";
import "./styles/welcome.css";

/* Pages - Lazy Loaded */
const Register = lazy(() => import("./pages/auth/Register"));
const Login = lazy(() => import("./pages/auth/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Tasks = lazy(() => import("./pages/Tasks"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const TenantDetailView = lazy(() => import("./pages/admin/TenantDetailView"));
const Users = lazy(() => import("./pages/Users"));
const CreateClientWizard = lazy(() => import("./pages/clients/CreateClientWizard"));
const EditClientWizard = lazy(() => import("./pages/clients/EditClientWizard"));
const ClientList = lazy(() => import("./pages/clients/ClientList"));
const Services = lazy(() => import("./pages/services/Services"));
const CreateServiceWizard = lazy(() => import("./pages/services/CreateServiceWizard"));
const EditServiceWizard = lazy(() => import("./pages/services/EditServiceWizard"));
const CreateTaskWizard = lazy(() => import("./pages/tasks/CreateTaskWizard"));
const EditTaskWizard = lazy(() => import("./pages/tasks/EditTaskWizard"));
const TaskDetails = lazy(() => import("./pages/tasks/TaskDetails"));
const TodoDashboard = lazy(() => import("./pages/todos/TodoDashboard"));
const InvoiceList = lazy(() => import("./pages/invoices/InvoiceList"));
const CreateInvoiceWizard = lazy(() => import("./pages/invoices/CreateInvoiceWizard"));
const EditInvoiceWizard = lazy(() => import("./pages/invoices/EditInvoiceWizard"));
const InvoiceDetail = lazy(() => import("./pages/invoices/InvoiceDetail"));
const ReceiptList = lazy(() => import("./pages/receipts/ReceiptList"));
const CreateReceiptWizard = lazy(() => import("./pages/receipts/CreateReceiptWizard"));
const ReceiptDetail = lazy(() => import("./pages/receipts/ReceiptDetail"));
const EditReceiptWizard = lazy(() => import("./pages/receipts/EditReceiptWizard"));
const QuotationList = lazy(() => import("./pages/quotations/QuotationList"));
const QuotationDetail = lazy(() => import("./pages/quotations/QuotationDetail"));
const QuotationForm = lazy(() => import("./pages/quotations/QuotationForm"));
const Subscription = lazy(() => import("./pages/Subscription"));
const Settings = lazy(() => import("./pages/Settings"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const NotificationPage = lazy(() => import("./pages/Notifications/NotificationPage"));
const LaunchTimer = lazy(() => import("./pages/LaunchTimer"));



import { Spinner } from "./components/ui/Spinner";

/* Loading Spinner for Suspense */
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Spinner />
  </div>
);

/* Routing */
import ProtectedRoute from "./routes/ProtectedRoute";
import SuperAdminRoute from "./routes/SuperAdminRoute";
import TenantRoutes from "./routes/TenantRoute";
import StaffRoutes from "./routes/StaffRoute";

/* Auth */
import { useAuth } from "./hooks/useAuth";
import { checkAuth } from "./features/auth/auth.actions";
import { useError } from "./context/ErrorContext";
import { setupInterceptors } from "./api/api";
import GlobalModal from "./components/ui/GlobalModal";
import ReportIssueModal from "./components/ui/ReportIssueModal";
import { useModal } from "./context/ModalContext";

const App = () => {
  const { user, dispatch, isLoading } = useAuth();
  const { setError } = useError();

  const launchDate = new Date("2026-04-13T18:00:00+05:30");
  const isLaunched = new Date() >= launchDate;
  const isSuperAdmin = user?.platform_role === "super_admin" || user?.role === "superadmin";

  useEffect(() => {
    // 1. Setup global axios error handling
    setupInterceptors(setError);

    // 2. Check authenticated session
    checkAuth(dispatch);
  }, [dispatch, setError]);

  const { isReportModalOpen, closeReportModal } = useModal();

  // 1. Show loader while checking auth
  if (isLoading) {
    return <PageLoader />;
  }

  // 2. Launch Gate
  const isLoginPage = window.location.pathname === "/login";
  if (!isLaunched && !isSuperAdmin && !isLoginPage) {
    return (
      <Suspense fallback={<PageLoader />}>
        <LaunchTimer />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <GlobalModal />
      <ReportIssueModal isOpen={isReportModalOpen} onClose={closeReportModal} />
      <Routes>

        {/* Default */}
        <Route path="/" element={<LandingPage />} />


        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ---------------- ADMIN PORTAL ---------------- */}
        <Route element={<ProtectedRoute />}>
          <Route element={<SuperAdminRoute />}>

            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/tenants/:tenantId" element={<TenantDetailView />} />

          </Route>
        </Route>


        {/* ---------------- TENANT APP ---------------- */}
        <Route element={<ProtectedRoute />}>

          <Route element={<TenantRoutes />}>

            <Route element={<StaffRoutes />}>

              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/tasks/create" element={<CreateTaskWizard />} />
              <Route path="/tasks/:id" element={<TaskDetails />} />
              <Route path="/tasks/edit/:id" element={<EditTaskWizard />} />
              <Route path="/todo" element={<TodoDashboard />} />
              <Route path="/clients/create" element={<CreateClientWizard />} />
              <Route path="/clients/:id" element={<EditClientWizard />} />
              <Route path="/clients" element={<ClientList />} />
              <Route path="/services" element={<Services />} />
              <Route path="/services/create" element={<CreateServiceWizard />} />
              <Route path="/services/edit/:id" element={<EditServiceWizard />} />
              <Route path="/finance/invoices" element={<InvoiceList />} />
              <Route path="/finance/invoices/create" element={<CreateInvoiceWizard />} />
              <Route path="/finance/invoices/edit/:id" element={<EditInvoiceWizard />} />
              <Route path="/finance/invoices/:id" element={<InvoiceDetail />} />
              <Route path="/finance/receipts" element={<ReceiptList />} />
              <Route path="/finance/receipts/create" element={<CreateReceiptWizard />} />
              <Route path="/finance/receipts/edit/:id" element={<EditReceiptWizard />} />
              <Route path="/finance/receipts/:id" element={<ReceiptDetail />} />
              <Route path="/finance" element={<Navigate to="/finance/invoices" replace />} />
              <Route path="/documents" element={<Tasks />} />
              <Route path="/reports" element={<Tasks />} />
              <Route path="/users" element={<Users />} />
              <Route path="/notifications" element={<NotificationPage />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/subscription" element={<Subscription />} />
              <Route path="/finance/quotations" element={<QuotationList />} />
              <Route path="/finance/quotations/create" element={<QuotationForm />} />
              <Route path="/finance/quotations/edit/:id" element={<QuotationForm />} />
              <Route path="/finance/quotations/:id" element={<QuotationDetail />} />

            </Route>

          </Route>

        </Route>

      </Routes>
    </Suspense>
  );
};

export default App;
