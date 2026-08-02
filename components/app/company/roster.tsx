"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { UploadCloud, Users, Mail, Clock3, Download, CheckCircle2, UserPlus } from "lucide-react";
import { Section } from "@/components/app/section";
import { StatCard } from "@/components/app/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { companies, teamMembers } from "@/lib/data";
import { cn } from "@/lib/utils";

export function RosterPage() {
  const { push } = useToast();
  const co = companies[0];
  const [invited, setInvited] = useState<{ email: string; dept: string }[]>([]);
  const [csvEmails, setCsvEmails] = useState("");

  const importCsv = () => {
    const emails = csvEmails
      .split(/[\n,;]/)
      .map((e) => e.trim())
      .filter((e) => e.includes("@"));
    if (emails.length === 0) {
      push("error", "No valid emails", "Add at least one email, comma or newline separated.");
      return;
    }
    setInvited((inv) => [...inv, ...emails.map((e) => ({ email: e, dept: "Engineering" }))]);
    setCsvEmails("");
    push("success", `${emails.length} employees invited`, "Invitation emails sent · sessions invalidate on password change.");
  };

  const totalInvited = invited.length;

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Seats on plan" value={co.seatsIncluded} icon={Users} tone="primary" hint={`${co.planTier} plan`} />
        <StatCard label="Active volunteers" value={342} icon={UserPlus} tone="success" />
        <StatCard label="Avg hours / employee" value={14.2} format={(n) => n.toFixed(1)} icon={Clock3} tone="accent" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* CSV import */}
        <Card>
          <CardContent className="p-5">
            <p className="font-heading text-base font-semibold">Bulk-invite via CSV</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Upload your roster — one email per row. New employees get sanctioned volunteering seats instantly.
            </p>
            <button
              onClick={() => push("info", "CSV import", "Accepted columns: name, email, department. Max 5,000 rows per file.")}
              className="group mt-4 flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 px-6 py-10 text-center transition-colors hover:border-primary/50 hover:bg-primary/5"
            >
              <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <UploadCloud className="size-6" />
              </div>
              <p className="mt-3 text-sm font-semibold">Drop roster.csv here</p>
              <p className="mt-1 text-xs text-muted-foreground">or browse files · .csv · .xlsx</p>
            </button>
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">…or paste emails</label>
                <button
                  className="cursor-pointer text-xs font-medium text-primary hover:underline"
                  onClick={() => setCsvEmails("aditi.sharma@nexora.in\nravi.iyer@nexora.in\npriya.nair@nexora.in")}
                >
                  Try sample
                </button>
              </div>
              <div className="flex gap-2">
                <Input
                  value={csvEmails}
                  onChange={(e) => setCsvEmails(e.target.value)}
                  placeholder="email1@company.in, email2@company.in…"
                  className="flex-1"
                />
                <Button onClick={importCsv}>Invite</Button>
              </div>
            </div>
            {invited.length > 0 && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-success/25 bg-success/8 p-3 text-sm">
                <CheckCircle2 className="size-4 shrink-0 text-success" />
                <span>
                  <span className="font-semibold">{totalInvited}</span> invited{" "}
                  {totalInvited > 1 ? "employees" : "employee"} · email sent, seats active
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Department targets */}
        <Card>
          <CardContent className="p-5">
            <p className="font-heading text-base font-semibold">Department volunteering targets</p>
            <p className="mt-0.5 text-sm text-muted-foreground">Sets the hour &amp; budget goals per department.</p>
            <div className="mt-4 space-y-3">
              {co.deptTargets.map((d, i) => {
                const pct = Math.min(100, Math.round((d.hoursDone / d.hoursTarget) * 100));
                return (
                  <motion.div
                    key={d.department}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <span className="w-24 shrink-0 text-sm font-medium">{d.department}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className={cn(
                          "h-full rounded-full",
                          pct >= 100 ? "bg-success" : pct >= 60 ? "bg-primary" : "bg-warning"
                        )}
                      />
                    </div>
                    <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">
                      {d.hoursDone}/{d.hoursTarget}
                    </span>
                  </motion.div>
                );
              })}
            </div>
            <Button variant="outline" size="sm" className="mt-4">
              <Download className="size-3.5" /> Export targets
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Team members */}
      <Section title="Roster" subtitle="Every employee seat with live hours tracked.">
        <Card>
          <CardContent className="p-3">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-border/70 text-left text-xs text-muted-foreground">
                    <th className="px-3 py-2.5 font-medium">Employee</th>
                    <th className="px-3 py-2.5 font-medium">Department</th>
                    <th className="px-3 py-2.5 font-medium">Role</th>
                    <th className="px-3 py-2.5 font-medium">Hours</th>
                    <th className="px-3 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((m) => (
                    <tr key={m.id} className="border-b border-border/50 last:border-0">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={m.name} size="sm" />
                          <div>
                            <p className="font-medium">{m.name}</p>
                            <p className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Mail className="size-3" /> {m.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge variant="secondary">{m.dept}</Badge>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">{m.role}</td>
                      <td className="px-3 py-2.5">
                        <span className="font-semibold">{m.hours}</span>
                        <span className="text-xs text-muted-foreground"> hrs</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge variant={m.hours >= 50 ? "success" : m.hours > 0 ? "warning" : "outline"} dot>
                          {m.hours >= 50 ? "Active" : m.hours > 0 ? "Getting started" : "Not started"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </Section>
    </div>
  );
}
