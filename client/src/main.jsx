import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";


import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./features/auth/auth.context.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";
import { ErrorProvider } from "./context/ErrorContext.jsx";
import { ModalProvider } from "./context/ModalContext.jsx";
import ErrorBoundary from "./components/common/ErrorBoundary.jsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});


const rootElement = document.getElementById("root");

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ErrorProvider>
            <AuthProvider>
              <NotificationProvider>
                <ModalProvider>
                  <App />
                </ModalProvider>
              </NotificationProvider>
            </AuthProvider>
          </ErrorProvider>
        </QueryClientProvider>
      </ErrorBoundary>

    </BrowserRouter>
  </StrictMode>,
);

