"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Building2, Mail, Clock3, UserPlus, Loader2, Info, Globe2 } from "lucide-react";
import { Section } from "@/components/app/section";
import { StatCard } from "@/components/app/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { api, ApiError, type CompanyProfileOut } from "@/lib/api";

export function RosterPage() {
  const { push } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<CompanyProfileOut | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const me = await api.users.me();
      setCompany(me.company);
    } catch (e) {
      setError((e as ApiError).message || "Could not load company profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="grid place-items-center py-32 text-center">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Loading roster…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid place-items-center py-32 text-center">
        <p className="text-sm font-medium text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Company profile" value={company ? 1 : 0} icon={Building2} tone="primary" />
        <StatCard label="Employee seats" value={0} icon={Users} tone="success" hint="Team seat management is not exposed yet" />
        <StatCard label="Avg hours / employee" value={0} format={(n) => n.toFixed(1)} icon={Clock3} tone="accent" />
      </div>

      <div className="mt-6">
        <Section title="Company details" subtitle="Live profile from your account record.">
          <Card>
            <CardContent className="p-5">
              {company ? (
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="flex items-start gap-4">
                    <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                      <Building2 className="size-6" />
                    </div>
                    <div>
                      <p className="font-heading text-lg font-semibold">{company.company_name}</p>
                      {company.cin && (
                        <p className="text-xs text-muted-foreground">CIN: {company.cin}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {company.industry && <Badge variant="secondary">{company.industry}</Badge>}
                        {(company.city || company.state) && (
                          <Badge variant="outline">
                            {[company.city, company.state].filter(Boolean).join(", ")}
                          </Badge>
                        )}
                        {company.headquarters && (
                          <Badge variant="outline">{company.headquarters}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {company.website && (
                      <p className="flex items-center gap-2">
                        <Globe2 className="size-4" /> {company.website}
                      </p>
                    )}
                    {company.description && (
                      <p className="leading-relaxed">{company.description}</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No company profile found. Complete your company profile to manage your CSR program.
                </p>
              )}
            </CardContent>
          </Card>
        </Section>
      </div>

      {/* Roster */}
      <div className="mt-6">
        <Section title="Roster" subtitle="Employee seats with live hours tracked.">
          <Card>
            <CardContent className="flex flex-col items-center gap-3 px-5 py-16 text-center">
              <div className="grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
                <UserPlus className="size-6" />
              </div>
              <p className="text-sm font-semibold">Team seats are not exposed yet</p>
              <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
                Employee seats and per-employee hour tracking are provisioned server-side. Once seat management
                ships, your roster will appear here — pulled live from the database, never from demo data.
              </p>
              <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-[11px] text-muted-foreground">
                <Info className="size-3.5" /> No mock employees shown
              </div>
            </CardContent>
          </Card>
        </Section>
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-border bg-card p-5">
        <Mail className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="text-sm">
          <p className="font-semibold">Bulk-invite & CSV import</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            Bulk-inviting employees via CSV is planned for a backend endpoint. The UI here will connect to it once
            available —{" "}
            <button className="cursor-pointer font-medium text-primary hover:underline" onClick={() => push("info", "Bulk invite", "CSV roster import will be wired to the backend invite endpoint.")}>
              track progress
            </button>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
