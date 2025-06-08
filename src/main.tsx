import React from "react";
import ReactDOM from "react-dom/client";
import { TempoDevtools } from "tempo-devtools";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import App from "./App";
import "./index.css";
import "./styles/theme-styles.css";
import "./styles/lightning-effects.css";
import { Toaster } from "./components/ui/toaster";
import { WorkspaceProvider } from "./context/workspace-context";
import { ThemeProvider } from "./context/theme-context";
import { AppLoadingProvider } from "./context/app-loading-context";
import { AuthProvider } from "./context/auth-context";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false, // Prevent refetching on window focus
    },
  },
});

// Initialize Tempo Devtools
TempoDevtools.init();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <NextThemesProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false} // Explicitly disable system preference if we want a hard default
        >
          <ThemeProvider>
            <AppLoadingProvider>
              <AuthProvider>
                <WorkspaceProvider>
                  <App />
                  <Toaster />
                </WorkspaceProvider>
              </AuthProvider>
            </AppLoadingProvider>
          </ThemeProvider>
        </NextThemesProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
