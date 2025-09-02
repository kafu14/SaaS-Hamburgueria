// src/pages/AuthConfirm.tsx
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthConfirm() {
  const navigate = useNavigate();
  const [msg, setMsg] = useState("Confirmando seu acesso…");

  useEffect(() => {
    let done = false;

    (async () => {
      try {
        // --- HASH (fluxo magic link) ---
        const rawHash = window.location.hash.startsWith("#")
          ? window.location.hash.slice(1)
          : window.location.hash;
        const hash = new URLSearchParams(rawHash);

        // Erro vindo no hash
        const err = hash.get("error");
        const errDesc = hash.get("error_description");
        if (err) {
          setMsg(decodeURIComponent(errDesc || "Link inválido ou expirado."));
          return;
        }

        // Tipo de link (ex.: "recovery")
        const linkType = hash.get("type");

        // Tokens do magic link
        const access_token = hash.get("access_token");
        const refresh_token = hash.get("refresh_token");

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) throw error;

          done = true;

          // limpa o hash pra não expor tokens
          window.history.replaceState({}, "", window.location.pathname);

          // Se for link de recuperação de senha, manda direto para /auth/reset
          if (linkType === "recovery") {
            navigate("/auth/reset", { replace: true });
          } else {
            navigate("/", { replace: true });
          }
          return;
        }

        // --- QUERY (fluxo PKCE) ---
        const qs = new URLSearchParams(window.location.search);
        const code = qs.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;

          done = true;

          // limpa a query
          window.history.replaceState({}, "", window.location.pathname);

          // Não há type na query, então vamos pra home
          navigate("/", { replace: true });
          return;
        }

        // Já tem sessão ativa?
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          done = true;
          navigate("/", { replace: true });
          return;
        }

        // Nada processado: volta pro /auth
        setMsg("Redirecionando…");
        navigate("/auth", { replace: true });
      } catch (e: any) {
        setMsg(e?.message ?? "Falha ao confirmar o login.");
      }
    })();

    // Listener de segurança (se o provider disparar depois)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "USER_UPDATED" || event === "TOKEN_REFRESHED") && session && !done) {
        done = true;
        navigate("/", { replace: true });
      }
    });

    // Fallback duro
    const t = setTimeout(() => {
      if (!done) navigate("/auth", { replace: true });
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(t);
    };
  }, [navigate]);

  return (
    <div className="min-h-[60vh] grid place-items-center p-6 text-sm text-slate-600">
      {msg}
    </div>
  );
}
