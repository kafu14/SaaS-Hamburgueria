import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { offlineStorage } from "../src/lib/offline-storage";
import { supabase, supabaseReady } from "../src/lib/supabase";
import { syncManager } from "../src/lib/sync-manager";

// ---------- UI de apoio ----------
function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh grid place-items-center bg-background text-foreground">
      <div className="p-6 rounded-xl border shadow-sm">{children}</div>
    </div>
  );
}

function Spinner({ label = "Carregando..." }) {
  return (
    <div className="flex items-center gap-3">
      <div className="size-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

// ---------- Página pública de Auth (placeholder) ----------
export default function AuthPage() {
  // Coloque aqui seu formulário de login real (magic link, etc.)
  const [email, setEmail] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    // Exemplo: login via OTP por e-mail
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) alert(error.message);
    else alert("Verifique seu e-mail para entrar.");
  }

  return (
    <Centered>
      <form onSubmit={handleLogin} className="flex flex-col gap-3">
        <h1 className="text-lg font-semibold">Entrar</h1>
        <input
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="px-3 py-2 border rounded-md"
        />
        <button className="px-3 py-2 rounded-md bg-primary text-primary-foreground">
          Enviar link
        </button>
      </form>
    </Centered>
  );
}

// ---------- Rota protegida ----------
export function ProtectedRoute() {
  const location = useLocation();
  const [ready, setReady] = useState(false);          // IndexedDB + Supabase checados
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Garantia de inicialização idempotente do IndexedDB:
  // (no offline-storage novo, init() é idempotente e todos os métodos chamam ensureReady)
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        if (!supabaseReady) {
          setError(
            "Supabase não configurado. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env.local e reinicie."
          );
          return;
        }

        await offlineStorage.init(); // IndexedDB aberto antes de qualquer acesso
        if (!alive) return;

        // Sessão atual
        const { data, error: sessErr } = await supabase.auth.getSession();
        if (sessErr) throw sessErr;

        const currentSession = data.session ?? null;
        setHasSession(Boolean(currentSession));
        setSessionChecked(true);
        setReady(true);

        // Inicia/paralisa sync conforme sessão
        if (currentSession) {
          // start é idempotente no nosso SyncManager (o timer só é criado se não existir)
          syncManager.syncPendingOrders().catch(console.warn);
        }

        // Listener de sessão
        const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
          const logged = Boolean(newSession);
          setHasSession(logged);
          // start/stop do sync conforme login/logout
          if (logged) {
            syncManager.syncPendingOrders().catch(console.warn);
          } else {
            // não há um stop explícito no manager, mas podemos simplesmente não chamar sync sem sessão
            // (se quiser, crie um método stop() no manager; aqui não é obrigatório)
          }
        });

        return () => {
          sub.subscription?.unsubscribe();
        };
      } catch (e: any) {
        console.error(e);
        if (!alive) return;
        setError(e?.message ?? "Falha ao inicializar app offline/online.");
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // Estados de carregamento/erro
  if (error) {
    return (
      <Centered>
        <div className="space-y-2">
          <p className="text-sm text-destructive">Erro: {error}</p>
          <p className="text-xs text-muted-foreground">
            Cheque seu <code>.env.local</code> e reinicie o servidor de dev.
          </p>
        </div>
      </Centered>
    );
  }

  if (!ready || !sessionChecked) {
    return (
      <Centered>
        <Spinner label="Inicializando armazenamento offline e sessão..." />
      </Centered>
    );
  }

  // Sem sessão → redireciona pra /auth preservando de onde veio
  if (!hasSession) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Autenticado e tudo pronto → libera as rotas filhas
  return <Outlet />;
}
