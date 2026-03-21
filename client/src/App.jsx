import { useEffect } from "react";
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

/* Pages */
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import AdminDashboard from "./pages/admin/AdminDashboard";
import TenantDetailView from "./pages/admin/TenantDetailView";
import Users from "./pages/Users";
import CreateClientWizard from "./pages/clients/CreateClientWizard";
import EditClientWizard from "./pages/clients/EditClientWizard";
import ClientList from "./pages/clients/ClientList";
import Services from "./pages/services/Services";
import CreateServiceWizard from "./pages/services/CreateServiceWizard";
import EditServiceWizard from "./pages/services/EditServiceWizard";
import CreateTaskWizard from "./pages/tasks/CreateTaskWizard";
import EditTaskWizard from "./pages/tasks/EditTaskWizard";
import TaskDetails from "./pages/tasks/TaskDetails";
import TodoDashboard from "./pages/todos/TodoDashboard";

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

const App = () => {
  const { dispatch } = useAuth();
  const { setError } = useError();

  useEffect(() => {
    // 1. Setup global axios error handling
    setupInterceptors(setError);
    
    // 2. Check authenticated session
    checkAuth(dispatch);
  }, [dispatch, setError]);

  return (
    <Routes>

      {/* Default */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

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
            <Route path="/finance" element={<Tasks />} />
            <Route path="/documents" element={<Tasks />} />
            <Route path="/reports" element={<Tasks />} />
            <Route path="/users" element={<Users />} />
            <Route path="/notifications" element={<Tasks />} />
            <Route path="/settings" element={<Tasks />} />

          </Route>

        </Route>

      </Route>

    </Routes>
  );
};

export default App;
