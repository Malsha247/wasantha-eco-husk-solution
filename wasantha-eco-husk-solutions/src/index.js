import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { PreferencesProvider } from "./contexts/PreferencesContext";
import { ToastProvider } from "./contexts/ToastContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  // Use PUBLIC_URL as basename so routing works when the app is served from a subpath
  <BrowserRouter basename={process.env.PUBLIC_URL}>
    <PreferencesProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </PreferencesProvider>
  </BrowserRouter>
);
