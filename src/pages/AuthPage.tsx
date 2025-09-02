// src/pages/AuthPage.tsx
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { Eye, EyeOff, Link as LinkIcon, Loader2, Lock, Mail, User } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";

/**
 * AuthPage
 * - Login (senha) + Login por link mágico (OTP)
 * - Cadastro (senha)
 * - Recuperação de senha
 * - Redireciona após login
 */
export default function AuthPage() {
  const [tab, setTab] = useState<"login" | "signup">("login");

  // Se já logado, manda embora
  const [checking, setChecking] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader className="animate-spin" />
      </div>
    );
  }

  if (session) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 grid place-items-center p-6">
      <Card className="w-full max-w-[420px] shadow-xl border-slate-200">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl">Sizzle • Acesso</CardTitle>
          <CardDescription>Entre com sua conta ou crie um cadastro novo</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signup")} className="w-full">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <LoginForm onDone={() => (window.location.href = "/")} />
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <SignupForm onDone={() => setTab("login")} />
            </TabsContent>
          </Tabs>

          <div className="mt-8 text-center text-xs text-slate-500">
            Ao continuar, você concorda com os Termos e a Política de Privacidade.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Loader({ className = "" }: { className?: string }) {
  return <Loader2 className={twMerge("h-5 w-5 text-slate-600", className)} />;
}

/* ===================== LOGIN ===================== */

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
});

function LoginForm({ onDone }: { onDone: () => void }) {
  const { toast } = useToast();
  const [showPass, setShowPass] = useState(false);
  const [loadingPwd, setLoadingPwd] = useState(false);
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  // Login por senha
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parse = loginSchema.safeParse(form);
    if (!parse.success) {
      toast({ title: "Corrija os campos", description: parse.error.issues[0].message, variant: "destructive" });
      return;
    }
    try {
      setLoadingPwd(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      });
      if (error) throw error;
      toast({ title: "Bem-vindo", description: "Login realizado com sucesso." });
      onDone();
    } catch (err: any) {
      toast({ title: "Falha ao entrar", description: err?.message ?? "Tente novamente.", variant: "destructive" });
    } finally {
      setLoadingPwd(false);
    }
  };

  // Login por link mágico (OTP)
  const onMagicLink = async () => {
    const email = form.email.trim();
    if (!email) {
      return toast({ title: "Informe o e-mail", description: "Coloque o e-mail para enviar o link mágico." });
    }
    try {
      setLoadingOtp(true);
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: window.location.origin + "/auth/confirm",
        },
      });
      if (error) {
        // Trata rate limit (429) de forma amigável
        if (error.status === 429) {
          return toast({
            title: "Aguarde um instante",
            description: "Você já solicitou um link. Tente novamente em alguns segundos.",
          });
        }
        throw error;
      }
      toast({
        title: "Link enviado",
        description: "Cheque seu e-mail e clique no link para entrar.",
      });
    } catch (err: any) {
      toast({ title: "Não foi possível enviar", description: err?.message ?? "Tente mais tarde.", variant: "destructive" });
    } finally {
      setLoadingOtp(false);
    }
  };

  const onReset = async () => {
    const email = form.email.trim();
    if (!email) {
      return toast({ title: "Informe o e-mail", description: "Coloque o e-mail para enviar o link de redefinição." });
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset`,
      });
      if (error) throw error;
      toast({ title: "Enviado", description: "Cheque seu e-mail para redefinir a senha." });
    } catch (err: any) {
      toast({ title: "Não foi possível enviar", description: err?.message ?? "Tente mais tarde.", variant: "destructive" });
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            id="email"
            type="email"
            placeholder="voce@exemplo.com"
            className="pl-9"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            id="password"
            type={showPass ? "text" : "password"}
            placeholder="••••••••"
            className="pl-9 pr-10"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          />
          <button
            type="button"
            onClick={() => setShowPass((s) => !s)}
            className="absolute right-2 top-2.5 p-1 text-slate-500 hover:text-slate-700"
            aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="ghost" className="px-0" onClick={onReset}>
          Esqueci minha senha
        </Button>
        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" onClick={onMagicLink} disabled={loadingOtp}>
            {loadingOtp ? <Loader className="animate-spin" /> : <><LinkIcon className="mr-2 h-4 w-4" /> Enviar link</>}
          </Button>
          <Button type="submit" disabled={loadingPwd}>
            {loadingPwd ? <Loader className="animate-spin" /> : "Entrar"}
          </Button>
        </div>
      </div>
    </form>
  );
}

/* ===================== SIGNUP ===================== */

const signupSchema = z.object({
  name: z.string().min(2, "Informe seu nome"),
  email: z.string().email("E-mail inválido"),
  password: z
    .string()
    .min(6, "Mínimo 6 caracteres")
    .regex(/[A-Z]/, "Inclua 1 letra maiúscula")
    .regex(/[0-9]/, "Inclua 1 número"),
  tenantName: z.string().min(2, "Nome da empresa/loja obrigatório"),
});

function SignupForm({ onDone }: { onDone: () => void }) {
  const { toast } = useToast();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", tenantName: "" });

  const strength = useMemo(() => passwordStrength(form.password), [form.password]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parse = signupSchema.safeParse(form);
    if (!parse.success) {
      toast({ title: "Corrija os campos", description: parse.error.issues[0].message, variant: "destructive" });
      return;
    }
    try {
      setLoading(true);
      // Cria usuário; envia e-mail de confirmação do Supabase
      const { error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: { full_name: form.name, tenant_hint: form.tenantName },
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      });
      if (error) throw error;

      toast({
        title: "Quase lá",
        description: "Enviamos um e-mail para confirmar sua conta.",
      });

      onDone(); // volta pra aba de login
    } catch (err: any) {
      toast({ title: "Falha no cadastro", description: err?.message ?? "Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Seu nome</Label>
        <div className="relative">
          <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            id="name"
            placeholder="Ex.: Lucas Souza"
            className="pl-9"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="tenant">Empresa/Loja</Label>
        <Input
          id="tenant"
          placeholder="Ex.: Hamburgueria Sizzle"
          value={form.tenantName}
          onChange={(e) => setForm((f) => ({ ...f, tenantName: e.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email2">E-mail</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            id="email2"
            type="email"
            placeholder="voce@exemplo.com"
            className="pl-9"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password2">Senha</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            id="password2"
            type={showPass ? "text" : "password"}
            placeholder="••••••••"
            className="pl-9 pr-10"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          />
          <button
            type="button"
            onClick={() => setShowPass((s) => !s)}
            className="absolute right-2 top-2.5 p-1 text-slate-500 hover:text-slate-700"
            aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <PasswordMeter strength={strength} />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader className="animate-spin" /> : "Criar conta"}
      </Button>
      <p className="text-xs text-slate-500">
        Ao cadastrar, você receberá um e-mail para confirmar a conta. Depois disso, o acesso é imediato.
      </p>
    </form>
  );
}

/* ===================== PROTECTED ROUTE ===================== */

export function ProtectedRoute() {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session);
      setChecking(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => setAuthed(!!session));
    return () => subscription.unsubscribe();
  }, []);

  if (checking) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <Loader className="animate-spin" />
      </div>
    );
  }

  return authed ? <Outlet /> : <Navigate to="/auth" replace />;
}

/* ===================== UTILS ===================== */

function passwordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 6) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0..4
}

function PasswordMeter({ strength }: { strength: number }) {
  const labels = ["fraca", "ok", "boa", "forte"]; // 1..4
  const pct = (strength / 4) * 100;
  const label = strength === 0 ? "" : labels[strength - 1] ?? "";
  return (
    <div className="mt-1">
      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 16 }}
          className={twMerge(
            "h-full",
            strength <= 1 && "bg-red-400",
            strength === 2 && "bg-yellow-400",
            strength === 3 && "bg-green-400",
            strength >= 4 && "bg-emerald-500"
          )}
        />
      </div>
      {label && <span className="text-[10px] text-slate-500">força: {label}</span>}
    </div>
  );
}
