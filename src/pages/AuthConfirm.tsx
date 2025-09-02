import { supabase } from "@/lib/supabase";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthConfirm() {
  const navigate = useNavigate();

  useEffect(() => {
    // Quando o usuário clica no link do Supabase, o SDK dispara onAuthStateChange
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/", { replace: true });
      }
    });
    // fallback: se já tiver sessão, manda pra home
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/", { replace: true });
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  return <div className="p-6">Confirmando seu acesso…</div>;
}
