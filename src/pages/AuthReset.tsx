import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthReset() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);

  // Supabase abre uma sessão "recovery" ao entrar por link de reset. Checa isso:
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        toast({ title: "Link inválido/expirado", variant: "destructive" });
      }
    });
  }, [toast]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw1.length < 6) {
      return toast({ title: "Senha muito curta", description: "Mínimo 6 caracteres.", variant: "destructive" });
    }
    if (pw1 !== pw2) {
      return toast({ title: "As senhas não coincidem", variant: "destructive" });
    }
    try {
      setBusy(true);
      const { error } = await supabase.auth.updateUser({ password: pw1 });
      if (error) throw error;
      toast({ title: "Senha atualizada" });
      navigate("/auth", { replace: true });
    } catch (err: any) {
      toast({ title: "Erro ao atualizar senha", description: err?.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6 max-w-sm mx-auto">
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label>Nova senha</Label>
          <Input type="password" value={pw1} onChange={(e) => setPw1(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Repita a nova senha</Label>
          <Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
        </div>
        <Button type="submit" disabled={busy}>{busy ? "Salvando..." : "Salvar"}</Button>
      </form>
    </div>
  );
}
