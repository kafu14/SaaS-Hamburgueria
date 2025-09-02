// vite.config.ts
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig } from "vite";


export default defineConfig(async ({ mode }) => {
  const plugins = [react()];

  if (mode === "development") {
    try {
      const mod = await import("lovable-tagger"); 
      const tagger = (mod as any).componentTagger ?? (mod as any).default;
      if (tagger) plugins.push(tagger());
    } catch { /* sem plugin, sem drama */ }
  }

  return {
    plugins,
    server: { host: "::", port: 8080, strictPort: true },
    preview: { port: 8080, strictPort: true },
    resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  };
});
