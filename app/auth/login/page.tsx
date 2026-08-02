"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader2, MailWarning } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";

const roleHome: Record<string, string> = {
  volunteer: "/app/volunteer",
  ngo: "/app/ngo",
  company: "/app/company",
  admin: "/app/admin",
};

export default function LoginPage() {
  const router = useRouter();
  const { push } = useToast();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unverified, setUnverified] = useState(false);
  const [resending, setResending] = useState(false);

  const submit = async (mail?: string, pass?: string) => {
    const finalMail = mail ?? email;
    const finalPass = pass ?? password;
    if (!finalMail || !finalPass) return;
    setLoading(true);
    setError(null);
    setUnverified(false);
    try {
      const user = await login(finalMail, finalPass);
      push("success", "Welcome back!", `Signed in as ${user.full_name}.`);
      router.push(roleHome[user.role] ?? "/app/volunteer");
    } catch (e) {
      const err = e as ApiError;
      if (err.code === "email_not_verified") {
        setUnverified(true);
        setError("Please verify your email before signing in.");
      } else if (err.status === 401) {
        setError("Incorrect email or password.");
      } else {
        setError(err.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      await api.auth.resendVerification(email);
      push("success", "Verification email sent", "Check your inbox for the link.");
    } catch (e) {
      push("error", "Could not resend", (e as ApiError).message);
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to deploy CSR, verify NGOs, or keep volunteering."
      footer={
        <>
          New to Kards?{" "}
          <Link href="/auth/register" className="font-semibold text-primary underline-offset-4 hover:underline">
            Create a free account
          </Link>
        </>
      }
    >
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="you@company.in"
              className="pl-10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={show ? "text" : "password"}
              placeholder="••••••••"
              className="px-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-3 text-sm text-destructive">
            <MailWarning className="mt-0.5 size-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <p>{error}</p>
              {unverified && (
                <button
                  type="button"
                  className="mt-1 font-medium text-destructive underline underline-offset-4 hover:opacity-80 disabled:opacity-50"
                  onClick={resend}
                  disabled={resending}
                >
                  {resending ? "Sending…" : "Resend verification email"}
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <Checkbox checked={true} onCheckedChange={() => {}} aria-label="Remember me" />
            Remember me
          </label>
          <Link href="/auth/forgot-password" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="group w-full" size="lg" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Signing in…
            </>
          ) : (
            <>
              Sign in <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
