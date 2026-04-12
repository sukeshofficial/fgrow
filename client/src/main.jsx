import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./features/auth/auth.context.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";
import { ErrorProvider } from "./context/ErrorContext.jsx";
import { ModalProvider } from "./context/ModalContext.jsx";
import ErrorBoundary from "./components/common/ErrorBoundary.jsx";

const rootElement = document.getElementById("root");

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <ErrorProvider>
          <AuthProvider>
            <NotificationProvider>
              <ModalProvider>
                <App />
              </ModalProvider>
            </NotificationProvider>
          </AuthProvider>
        </ErrorProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </StrictMode>,
);

