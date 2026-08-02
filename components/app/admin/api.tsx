"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { KeyRound, Copy, Plus, Eye, EyeOff, Trash2, Globe2, ShieldCheck, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type ApiKey = {
  id: string;
  label: string;
  token: string;
  scope: string[];
  created: string;
  lastUsed: string;
  requests: string;
  active: boolean;
};

const initialKeys: ApiKey[] = [
  {
    id: "k1",
    label: "White-label portal · Tata Digital",
    token: "krd_live_9f2b4c7d1a8e…",
    scope: ["reports.read", "opportunities.read"],
    created: "2026-01-12",
    lastUsed: "2026-02-22 09:41",
    requests: "41,288",
    active: true,
  },
  {
    id: "k2",
    label: "Reconciliation webhook · ZohoBooks",
    token: "krd_live_3e8a6c01f9b2…",
    scope: ["reports.read", "certificates.verify"],
    created: "2026-01-28",
    lastUsed: "2026-02-22 08:12",
    requests: "9,071",
    active: true,
  },
  {
    id: "k3",
    label: "Staging · integration tests",
    token: "krd_test_00d1…",
    scope: ["*"],
    created: "2025-12-04",
    lastUsed: "2026-02-18 17:03",
    requests: "1,204",
    active: false,
  },
];

const allScopes = ["reports.read", "opportunities.read", "certificates.verify", "matches.create", "audit.read"];

export function AdminApi() {
  const { push } = useToast();
  const [keys, setKeys] = useState(initialKeys);
  const [creating, setCreating] = useState(false);
  const [label, setLabel] = useState("");
  const [scope, setScope] = useState("reports.read");
  const [revealed, setRevealed] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const create = () => {
    const token = `krd_live_${Math.random().toString(16).slice(2, 14)}…`;
    setKeys((k) => [
      { id: `k${Date.now()}`, label, token, scope: [scope], created: "2026-02-22", lastUsed: "—", requests: "0", active: true },
      ...k,
    ]);
    push("success", "API key created", `Key for "${label}" generated. Copy it now — it won't be shown again.`);
    setCreating(false);
    setLabel("");
  };

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Keys issued", value: String(keys.length), icon: KeyRound },
          { label: "Requests (30d)", value: "51,563", icon: Activity },
          { label: "White-label partners", value: "2", icon: Globe2 },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3.5 p-5">
              <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <s.icon className="size-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                <p className="font-heading text-2xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h3 className="font-heading text-base font-semibold">Active keys</h3>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" /> Issue new key
        </Button>
      </div>

      <div className="mt-4 space-y-3">
        <AnimatePresence initial={false}>
          {keys.map((k) => (
            <motion.div
              key={k.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                    <KeyRound className="size-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      {k.label}
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          k.active ? "bg-success" : "bg-muted-foreground/50"
                        )}
                      />
                    </p>
                    <button
                      className="mt-0.5 flex cursor-pointer items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => push("success", "Copied", "API key copied to clipboard.")}
                    >
                      {revealed === k.id ? k.token.replace("…", "3f7c9e21") : k.token}
                      {revealed === k.id ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                      <Copy className="size-3" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={k.active ? "success" : "default"} dot>
                    {k.active ? "active" : "revoked"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-destructive"
                    onClick={() => setConfirmDelete(k.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-primary" /> Scopes:
                  {k.scope.map((s) => (
                    <code key={s} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">{s}</code>
                  ))}
                </span>
                <span>Created {k.created}</span>
                <span>Last used {k.lastUsed}</span>
                <span className="ml-auto font-medium text-foreground">{k.requests} requests</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogHeader>
          <DialogTitle>Issue API key</DialogTitle>
          <DialogDescription>Keys are scoped, revocable, and audit-logged. Rotation supported.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Label</Label>
            <Input placeholder="e.g. Reconciliation webhook" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Scope</Label>
            <Select
              value={scope}
              onValueChange={setScope}
              options={allScopes.map((s) => ({ value: s, label: s }))}
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border/70 bg-background/50 p-3.5">
            <div>
              <p className="text-sm font-medium">Rate limiting</p>
              <p className="text-xs text-muted-foreground">Default 1,000 req/hour per key</p>
            </div>
            <Switch checked onCheckedChange={() => undefined} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
          <Button disabled={!label.trim()} onClick={create}>
            <KeyRound className="size-4" /> Generate key
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogHeader>
          <DialogTitle>Revoke API key?</DialogTitle>
          <DialogDescription>Integrations using this key will fail immediately. The action is appended to the audit log.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={() => {
              setKeys((k) => k.filter((x) => x.id !== confirmDelete));
              push("error", "Key revoked", "API key revoked and logged to the audit trail.");
              setConfirmDelete(null);
            }}
          >
            <Trash2 className="size-4" /> Revoke key
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
