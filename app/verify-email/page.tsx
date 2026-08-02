"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { MailCheck, ShieldAlert, Loader2, ArrowRight } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("Verification token missing.");
      return;
    }
    api.auth
      .verifyEmail(token)
      .then(() => setSuccess(true))
      .catch((e) => setError((e as ApiError).message || "Verification failed."))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <AuthShell
      title="Email verification"
      subtitle="Confirming your Kards account activation."
    >
      <div className="py-8 text-center">
        {loading && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Verifying your email…</p>
          </div>
        )}
        {!loading && success && (
          <div className="flex flex-col items-center gap-4">
            <div className="grid size-16 place-items-center rounded-2xl bg-success/15 text-success">
              <MailCheck className="size-8" />
            </div>
            <h2 className="font-heading text-xl font-bold">Email verified successfully!</h2>
            <p className="text-sm text-muted-foreground">Your account is now active. You can sign in.</p>
            <Link href="/auth/login" className="mt-4 w-full">
              <Button size="lg" className="w-full">
                Sign in <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        )}
        {!loading && error && (
          <div className="flex flex-col items-center gap-4">
            <div className="grid size-16 place-items-center rounded-2xl bg-destructive/15 text-destructive">
              <ShieldAlert className="size-8" />
            </div>
            <h2 className="font-heading text-xl font-bold">Verification failed</h2>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Link href="/auth/login" className="mt-4">
              <Button variant="outline">Return to sign in</Button>
            </Link>
          </div>
        )}
      </div>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center">Loading…</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
