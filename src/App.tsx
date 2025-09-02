import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

// Páginas existentes
import Index from "./pages/Index";
import KDS from "./pages/KDS";
import POS from "./pages/POS";


// Auth
import AuthPage, { ProtectedRoute } from "@/pages/AuthPage"; // já criei pra você

const queryClient = new QueryClient();

// Telas simples para confirmação/reset (pode virar página separada depois)
function ConfirmEmail() {
  return <div className="p-6">E-mail confirmado. Você já pode entrar.</div>;
}
function ResetPassword() {
  return <div className="p-6">Defina sua nova senha aqui (implementar form com updateUser).</div>;
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Público */}
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/auth/confirm" element={<ConfirmEmail />} />
            <Route path="/auth/reset" element={<ResetPassword />} />

            {/* Privado */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Index />} />
              <Route path="/pos" element={<POS />} />
              <Route path="/kds" element={<KDS />} />
            </Route>

            {/* 404 → manda pro início (que é protegido) */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
