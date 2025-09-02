// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { offlineStorage } from "../src/lib/offline-storage"; // importa o manager
import App from "./App";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import "./index.css";

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Elemento #root não encontrado em index.html");
}

// bootstrap assíncrono
async function bootstrap() {
  try {
    // garante IndexedDB aberta antes de qualquer SyncManager rodar
    await offlineStorage.init();
  } catch (e) {
    console.warn("IndexedDB não inicializou:", e);
  }

  createRoot(rootEl).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
}

bootstrap();
