"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { KeyRound, Copy, Plus, Eye, EyeOff, Trash2, Globe2, ShieldCheck, Activity, Loader2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { api, ApiError, type ApiKeyOut, type ApiKeyCreated } from "@/lib/api";
import { cn } from "@/lib/utils";

const allScopes = ["reports.read", "opportunities.read", "certificates.verify", "matches.create", "audit.read"];

export function AdminApi() {
  const { push } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keys, setKeys] = useState<ApiKeyOut[]>([]);
  const [creating, setCreating] = useState(false);
  const [label, setLabel] = useState("");
  const [scope, setScope] = useState("reports.read");
  const [newKeyPlain, setNewKeyPlain] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.apiKeys.list();
      setKeys(data);
    } catch (e) {
      setError((e as ApiError).message || "Could not load API keys.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    if (!label.trim()) return;
    try {
      const res: ApiKeyCreated = await api.apiKeys.create({
        name: label.trim(),
        scopes: [scope],
        rate_limit_per_hour: 1000,
      });
      setNewKeyPlain(res.plain_key);
      setKeys((k) => [res, ...k]);
      push("success", "API key created", "Copy your plain key now — it won't be shown again.");
      setCreating(false);
      setLabel("");
    } catch (e) {
      push("error", "Could not create key", (e as ApiError).message);
    }
  };

  const revoke = async (id: string) => {
    try {
      await api.apiKeys.revoke(id);
      setKeys((k) => k.map((x) => (x.id === id ? { ...x, is_active: false } : x)));
      push("error", "Key revoked", "API key deactivated and logged.");
      setConfirmDelete(null);
    } catch (e) {
      push("error", "Could not revoke", (e as ApiError).message);
    }
  };

  if (loading) {
    return (
      <div className="grid place-items-center py-24 text-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Keys issued", value: String(keys.length), icon: KeyRound },
          { label: "Requests (30d)", value: "0", icon: Activity },
          { label: "White-label partners", value: String(keys.filter((k) => k.is_active).length), icon: Globe2 },
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
        <h3 className="font-heading text-base font-semibold">Active API keys</h3>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" /> Issue new key
        </Button>
      </div>

      <div className="mt-4 space-y-3">
        {keys.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
            No API keys issued yet. Issue a key to enable white-label REST access.
          </div>
        ) : (
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
                        {k.name}
                        <span
                          className={cn(
                            "size-1.5 rounded-full",
                            k.is_active ? "bg-success" : "bg-muted-foreground/50"
                          )}
                        />
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">Prefix: {k.key_prefix}…</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={k.is_active ? "success" : "default"} dot>
                      {k.is_active ? "active" : "revoked"}
                    </Badge>
                    {k.is_active && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setConfirmDelete(k.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5 text-primary" /> Scopes:
                    {k.scopes.map((s) => (
                      <code key={s} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">{s}</code>
                    ))}
                  </span>
                  <span>Created {new Date(k.created_at).toLocaleDateString("en-IN")}</span>
                  <span className="ml-auto font-medium text-foreground">{k.rate_limit_per_hour} req/hr limit</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogHeader>
          <DialogTitle>Issue API key</DialogTitle>
          <DialogDescription>Keys are scoped, revocable, and audit-logged.</DialogDescription>
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
          <Button disabled={!label.trim()} onClick={create}>
            <KeyRound className="size-4" /> Generate key
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={!!newKeyPlain} onOpenChange={(o) => !o && setNewKeyPlain(null)}>
        <DialogHeader>
          <DialogTitle>API key generated</DialogTitle>
          <DialogDescription>Copy this key now. It will never be shown again.</DialogDescription>
        </DialogHeader>
        <div className="rounded-xl border border-success/30 bg-success/5 p-4">
          <p className="font-mono text-sm font-semibold select-all text-foreground">{newKeyPlain}</p>
        </div>
        <DialogFooter>
          <Button onClick={() => { navigator.clipboard.writeText(newKeyPlain ?? ""); push("success", "Copied", "Plain key copied."); setNewKeyPlain(null); }}>
            <Copy className="size-4" /> Copy & Close
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogHeader>
          <DialogTitle>Revoke API key?</DialogTitle>
          <DialogDescription>Integrations using this key will fail immediately.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button variant="destructive" onClick={() => revoke(confirmDelete!)}>
            <Trash2 className="size-4" /> Revoke key
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
