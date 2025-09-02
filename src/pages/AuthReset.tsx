// src/pages/AuthReset.tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthReset() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [busy, setBusy] = useState(false);

  const mismatch = pw1 !== pw2 && pw2.length > 0;
  const tooShort = pw1.length > 0 && pw1.length < 6;

  useEffect(() => {
    // 1) Erro na URL (#error=...)
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const urlError = hash.get("error");
    const urlDesc = hash.get("error_description");
    if (urlError) {
      toast({
        title: "Link inválido/expirado",
        description: decodeURIComponent(urlDesc || ""),
        variant: "destructive",
      });
      // limpa o hash pra não deixar erro exposto
      window.history.replaceState({}, "", window.location.pathname);
    }

    // 2) Suporte a PKCE (?code=...) — alguns fluxos de reset usam isso
    (async () => {
      const qs = new URLSearchParams(window.location.search);
      const code = qs.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          toast({
            title: "Link inválido/expirado",
            description: error.message,
            variant: "destructive",
          });
          navigate("/auth", { replace: true });
        }
      }
    })();

    // 3) Confere sessão de recovery (criada ao clicar no e-mail)
    let redirected = false;
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) console.warn(error);
      if (!data.session && !redirected) {
        redirected = true;
        toast({
          title: "Sessão ausente",
          description: "Peça um novo link de recuperação.",
          variant: "destructive",
        });
        navigate("/auth", { replace: true });
      }
    });

    // 4) Listener de segurança
    const { data: { subscription } } = supabase.auth.onAuthStateChange((evt, session) => {
      if (!session && (evt === "SIGNED_OUT" || evt === "TOKEN_REFRESHED")) {
        toast({ title: "Sessão encerrada", variant: "destructive" });
        navigate("/auth", { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tooShort) {
      return toast({
        title: "Senha muito curta",
        description: "Mínimo 6 caracteres.",
        variant: "destructive",
      });
    }
    if (mismatch) {
      return toast({
        title: "As senhas não coincidem",
        variant: "destructive",
      });
    }

    try {
      setBusy(true);
      const { error } = await supabase.auth.updateUser({ password: pw1 });
      if (error) throw error;

      // Opcional, mas recomendado: encerra a sessão de recovery e força login limpo
      await supabase.auth.signOut();

      toast({ title: "Senha atualizada", description: "Faça login com a nova senha." });
      navigate("/auth", { replace: true });
    } catch (err: any) {
      toast({
        title: "Erro ao atualizar senha",
        description: err?.message,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6 max-w-sm mx-auto">
      <h1 className="text-lg font-semibold mb-4">Definir nova senha</h1>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new-password">Nova senha</Label>
          <div className="relative">
            <Input
              id="new-password"
              type={show1 ? "text" : "password"}
              value={pw1}
              onChange={(e) => setPw1(e.target.value)}
              placeholder="••••••••"
              autoFocus
              className="pr-10"
              autoComplete="new-password"
              minLength={6}
              required
            />
            <button
              type="button"
              onClick={() => setShow1((s) => !s)}
              className="absolute right-2 top-2.5 p-1 text-slate-500 hover:text-slate-700"
              aria-label={show1 ? "Ocultar senha" : "Mostrar senha"}
            >
              {show1 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {tooShort && (
            <p className="text-xs text-red-500">
              A senha precisa ter ao menos 6 caracteres.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="repeat-password">Repita a nova senha</Label>
          <div className="relative">
            <Input
              id="repeat-password"
              type={show2 ? "text" : "password"}
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              placeholder="••••••••"
              className="pr-10"
              autoComplete="new-password"
              minLength={6}
              required
            />
            <button
              type="button"
              onClick={() => setShow2((s) => !s)}
              className="absolute right-2 top-2.5 p-1 text-slate-500 hover:text-slate-700"
              aria-label={show2 ? "Ocultar senha" : "Mostrar senha"}
            >
              {show2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {mismatch && (
            <p className="text-xs text-red-500">As senhas não coincidem.</p>
          )}
        </div>

        <Button type="submit" disabled={busy || mismatch || tooShort}>
          {busy ? "Salvando..." : "Salvar"}
        </Button>
      </form>
    </div>
  );
}
