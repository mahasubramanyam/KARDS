"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  UserRound,
  HeartHandshake,
  Building2,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  ShieldCheck,
  MailCheck,
} from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Role } from "@/lib/types";

const roles: {
  value: Role;
  title: string;
  desc: string;
  icon: typeof UserRound;
  blurb: string;
}[] = [
  {
    value: "volunteer",
    title: "Volunteer",
    desc: "Find sanctioned volunteering slots and micro-tasks, get verifiable certificates.",
    icon: UserRound,
    blurb: "Free forever · premium certificates optional",
  },
  {
    value: "ngo",
    title: "NGO",
    desc: "Get verified, build your CSR-Ready Score, receive corporate volunteers and funding.",
    icon: HeartHandshake,
    blurb: "Free · fast-track verification optional",
  },
  {
    value: "company",
    title: "Company",
    desc: "Deploy CSR budget and employee hours, generate board-ready Schedule VII reports.",
    icon: Building2,
    blurb: "Paid plans from ₹1.2L/year",
  },
];

export default function RegisterPage() {
  const { push } = useToast();
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    orgName: "",
    registrationNo: "",
    industry: "",
    employeeCount: "",
    location: "",
    skills: "",
    website: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const next = async () => {
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    if (!role) return;
    setLoading(true);
    setError(null);
    try {
      const skills = form.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const payload =
        role === "volunteer"
          ? { email: form.email, password: form.password, full_name: form.name, role, skills, location: form.location || undefined }
          : role === "ngo"
            ? {
                email: form.email,
                password: form.password,
                full_name: form.name,
                role,
                org_name: form.orgName || undefined,
                reg_number: form.registrationNo || undefined,
                website: form.website || undefined,
              }
            : {
                email: form.email,
                password: form.password,
                full_name: form.name,
                role,
                company_name: form.orgName || undefined,
                industry: form.industry || undefined,
              };
      await register(payload as Parameters<typeof register>[0]);
      setRegisteredEmail(form.email);
      push("success", "Account created!", "We sent a verification link to your email.");
    } catch (e) {
      const err = e as ApiError;
      if (err.status === 409) {
        setError("An account with this email already exists. Try signing in.");
      } else {
        const detailErrors = (err.detail?.errors as Array<{ msg?: string; loc?: string[] }>) ?? [];
        if (detailErrors.length > 0) {
          setError(detailErrors.map((d) => `${d.loc?.[d.loc.length - 1] ?? "Field"}: ${d.msg}`).join(" · "));
        } else {
          setError(err.message || "Registration failed. Please try again.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const back = () => (step === 1 ? (window.location.href = "/auth/login") : setStep(step - 1));

  const roleLabel = roles.find((r) => r.value === role)?.title;

  if (registeredEmail) {
    return (
      <AuthShell
        title="Check your inbox"
        subtitle={`We sent a verification link to ${registeredEmail}. Sign in is unlocked only after verification.`}
        footer={
          <>
            Wrong email?{" "}
            <button
              className="cursor-pointer font-semibold text-primary underline-offset-4 hover:underline"
              onClick={() => setRegisteredEmail(null)}
            >
              Go back
            </button>
          </>
        }
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center"
        >
          <div className="grid size-14 place-items-center rounded-2xl bg-primary/12">
            <MailCheck className="size-7 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              The email contains a one-time link. Verification emails are logged in the platform mail ledger.
            </p>
          </div>
          <Link href="/auth/login" className="mt-2">
            <Button variant="glow" size="lg">
              Go to sign in
            </Button>
          </Link>
        </motion.div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={
        step === 1
          ? "Create your free account"
          : step === 2
            ? "Tell us about you"
            : `Set up your ${roleLabel ?? "profile"}`
      }
      subtitle={
        step === 1
          ? "Choose how you'll use Kards. You can expand later — this just shapes your workspace."
          : step === 2
            ? "This is the profile corporates and NGOs will see. You can edit it anytime."
            : "A few role-specific details to make your profile CSR-ready."
      }
      footer={
        <>
          Already have an account?{" "}
          <Link href="/auth/login" className="font-semibold text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      {/* Stepper */}
      <div className="mb-8 flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition-all duration-300",
                s < step
                  ? "border-primary bg-primary text-primary-foreground"
                  : s === step
                    ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/25"
                    : "border-border text-muted-foreground"
              )}
            >
              {s < step ? <Check className="size-4" strokeWidth={3} /> : s}
            </div>
            {s < 3 && (
              <div
                className={cn(
                  "h-px flex-1 rounded-full transition-colors duration-300",
                  s < step ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </div>
        ))}
      </div>

      <div className="relative min-h-[360px]">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              {roles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={cn(
                    "group flex w-full cursor-pointer items-start gap-4 rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift",
                    role === r.value
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border bg-card"
                  )}
                >
                  <div
                    className={cn(
                      "grid size-11 shrink-0 place-items-center rounded-xl transition-colors",
                      role === r.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}
                  >
                    <r.icon className="size-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold">{r.title}</p>
                      <span
                        className={cn(
                          "grid size-5 place-items-center rounded-full border transition-all",
                          role === r.value ? "border-primary bg-primary text-primary-foreground" : "border-border"
                        )}
                      >
                        {role === r.value && <Check className="size-3" strokeWidth={3} />}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{r.desc}</p>
                    <p className="mt-1.5 text-xs font-medium text-primary">{r.blurb}</p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" placeholder="Aditi Sharma" value={form.name} onChange={set("name")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.in"
                  value={form.email}
                  onChange={set("email")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min 8 characters"
                  value={form.password}
                  onChange={set("password")}
                />
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ShieldCheck className="size-3.5 text-success" />
                  Argon2 hashing, rate-limited login, DPDP-compliant storage
                </p>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {role === "volunteer" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="skills">Skills (comma-separated)</Label>
                    <Input
                      id="skills"
                      placeholder="Teaching, Design, Data analysis"
                      value={form.skills}
                      onChange={set("skills")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="loc">City</Label>
                    <Input id="loc" placeholder="Pune" value={form.location} onChange={set("location")} />
                  </div>
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs leading-relaxed text-muted-foreground">
                    Your skills power the matching engine — <span className="font-medium text-foreground">skill
                    overlap (50%), location (30%), availability (20%)</span> — and company-sponsored projects rank
                    their own employees first.
                  </div>
                </>
              )}
              {role === "ngo" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="org">NGO name</Label>
                    <Input
                      id="org"
                      placeholder="Siksha Setu Foundation"
                      value={form.orgName}
                      onChange={set("orgName")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg">Registration number</Label>
                    <Input
                      id="reg"
                      placeholder="MH/2022/0012345"
                      value={form.registrationNo}
                      onChange={set("registrationNo")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="site">Website (optional)</Label>
                    <Input id="site" placeholder="https://…" value={form.website} onChange={set("website")} />
                  </div>
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs leading-relaxed text-muted-foreground">
                    Next step: upload your <span className="font-medium text-foreground">12A, 80G &amp; FCRA</span>{" "}
                    documents to unlock a CSR-Ready Score and become visible to corporate budgets.
                  </div>
                </>
              )}
              {role === "company" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="cname">Company name</Label>
                    <Input
                      id="cname"
                      placeholder="Nexora Technologies"
                      value={form.orgName}
                      onChange={set("orgName")}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry</Label>
                      <Input
                        id="industry"
                        placeholder="Software & IT"
                        value={form.industry}
                        onChange={set("industry")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emp">Employees</Label>
                      <Input
                        id="emp"
                        type="number"
                        placeholder="1284"
                        value={form.employeeCount}
                        onChange={set("employeeCount")}
                      />
                    </div>
                  </div>
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs leading-relaxed text-muted-foreground">
                    Next step: set your annual CSR budget and department-level hour targets.
                    Plans are billed annually with <span className="font-medium text-foreground">Razorpay GST invoicing</span>.
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="mt-8 flex items-center gap-3">
        <Button variant="outline" size="lg" onClick={back} className="shrink-0">
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <Button
          size="lg"
          className="group flex-1"
          onClick={next}
          disabled={
            (step === 1 && !role) ||
            (step === 2 && (!form.name || !form.email || form.password.length < 8)) ||
            loading
          }
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Creating…
            </>
          ) : step === 3 ? (
            <>
              Create account <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </>
          ) : (
            <>
              Continue <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </Button>
      </div>
    </AuthShell>
  );
}
