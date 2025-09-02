// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import "./index.css";

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error('Elemento #root não encontrado em index.html');
}

createRoot(rootEl).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
