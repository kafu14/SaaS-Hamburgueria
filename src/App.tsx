import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { supabase } from "./lib/supabase";
import Index from "./pages/Index";
import KDS from "./pages/KDS";
import NotFound from "./pages/NotFound";
import POS from "./pages/POS";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const fetchData = async () => {
      if (!supabase) {
        console.error("Supabase client não inicializado");
        return;
      }

      const { data, error } = await supabase
        .from("products")
        .select("id, name, price");
      if (error) {
        console.error("Erro ao buscar produtos:", error);
      } else {
        console.log("Produtos:", data);
      }
    };

    fetchData();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/kds" element={<KDS />} />
            {/* catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
