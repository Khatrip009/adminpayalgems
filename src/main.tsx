// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";

import App from "./App";

// Context Providers
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { NotificationsProvider } from "./context/NotificationsContext";

import "./index.css";
import { Toaster } from "react-hot-toast";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <NotificationsProvider>
          <HashRouter>
            <Toaster position="top-right" reverseOrder={false} />
            <App />
          </HashRouter>
        </NotificationsProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
