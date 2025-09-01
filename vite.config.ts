// vite.config.ts
import react from "@vitejs/plugin-react-swc";
import { componentTagger } from "lovable-tagger";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  server: {
    host: "127.0.0.1",   // <- em vez de "::"
    port: 8080,
    strictPort: true,    // falha se 8080 estiver ocupada (evita confusão)
    open: false,         // (opcional) abra manualmente no navegador
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
}));
