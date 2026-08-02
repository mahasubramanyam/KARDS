"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Paperclip, Send, ChevronLeft, FolderKanban, Loader2, AlertTriangle } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api, ApiError, type ThreadOut, type MessageOut, type ThreadWithMessages } from "@/lib/api";
import { timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function Messaging({
  variant = "volunteer",
}: {
  variant?: "volunteer" | "ngo" | "company";
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [threads, setThreads] = useState<ThreadOut[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeThread, setActiveThread] = useState<ThreadWithMessages | null>(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [mobileThread, setMobileThread] = useState(false);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [sending, setSending] = useState(false);

  const loadThreads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.messaging.threads();
      setThreads(data);
      if (data.length > 0 && !activeId) {
        setActiveId(data[0].id);
      }
    } catch (e) {
      setError((e as ApiError).message || "Could not load threads.");
    } finally {
      setLoading(false);
    }
  }, [activeId]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  const loadThreadDetail = useCallback(async (id: string) => {
    setLoadingThread(true);
    try {
      const detail = await api.messaging.getThread(id);
      setActiveThread(detail);
      await api.messaging.markRead(id).catch(() => {});
    } catch {
      setActiveThread(null);
    } finally {
      setLoadingThread(false);
    }
  }, []);

  useEffect(() => {
    if (activeId) {
      loadThreadDetail(activeId);
    }
  }, [activeId, loadThreadDetail]);

  const listed = threads.filter((t) => t.title.toLowerCase().includes(query.toLowerCase()));

  const send = async () => {
    if (!draft.trim() || !activeId || sending) return;
    setSending(true);
    try {
      const msg = await api.messaging.send(activeId, draft.trim());
      setDraft("");
      setActiveThread((curr) => (curr ? { ...curr, messages: [...curr.messages, msg] } : curr));
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="grid h-[480px] place-items-center rounded-2xl border border-border bg-card">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error && threads.length === 0) {
    return (
      <div className="grid h-[480px] place-items-center rounded-2xl border border-border bg-card p-6 text-center">
        <div>
          <AlertTriangle className="mx-auto size-6 text-destructive" />
          <p className="mt-2 text-sm text-foreground">{error}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={loadThreads}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-[calc(100vh-13rem)] min-h-[480px] overflow-hidden rounded-2xl border border-border bg-card lg:grid-cols-[300px_1fr]">
      {/* Thread list */}
      <div
        className={cn(
          "flex-col border-r border-border/70 lg:flex",
          mobileThread ? "hidden" : "flex"
        )}
      >
        <div className="border-b border-border/70 p-4">
          <p className="text-sm font-semibold">
            {variant === "company" ? "Partner NGO threads" : "Project threads"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Threaded per opportunity — structured communication
          </p>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search threads…"
              className="h-9 w-full rounded-xl border border-input bg-background/60 pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-ring/40"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
          {listed.length === 0 ? (
            <p className="p-4 text-center text-xs text-muted-foreground">No threads found.</p>
          ) : (
            listed.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setActiveId(t.id);
                  setMobileThread(true);
                }}
                className={cn(
                  "flex w-full cursor-pointer items-start gap-3 rounded-xl p-3 text-left transition-colors",
                  t.id === activeId ? "bg-primary/8 ring-1 ring-primary/20" : "hover:bg-muted/70"
                )}
              >
                <Avatar name={t.title} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{t.title}</p>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {t.last_message_at ? timeAgo(t.last_message_at) : ""}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{t.subject}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Badge variant="secondary" className="gap-1">
                      <FolderKanban className="size-2.5" /> {t.subject}
                    </Badge>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Conversation */}
      <div className={cn("flex-col", mobileThread ? "flex" : "hidden lg:flex")}>
        {!activeThread ? (
          <div className="grid h-full place-items-center p-6 text-center text-sm text-muted-foreground">
            {loadingThread ? <Loader2 className="size-6 animate-spin text-primary" /> : "Select a thread to start messaging."}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-border/70 p-4">
              <button
                className="grid size-8 cursor-pointer place-items-center rounded-full text-muted-foreground hover:bg-muted lg:hidden"
                onClick={() => setMobileThread(false)}
                aria-label="Back to threads"
              >
                <ChevronLeft className="size-4" />
              </button>
              <Avatar name={activeThread.title} size="md" status="online" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{activeThread.title}</p>
                <p className="truncate text-xs text-muted-foreground">Subject: {activeThread.subject}</p>
              </div>
              <Badge variant="secondary">Project thread</Badge>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4 scrollbar-thin sm:p-5">
              <div className="mx-auto w-fit rounded-full border border-border bg-muted/60 px-3 py-1 text-[10px] text-muted-foreground">
                Structured project-threaded messaging
              </div>
              {activeThread.messages.map((m) => {
                const isMe = false; // We can refine once user id is known
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className={cn("flex items-end gap-2.5", isMe ? "flex-row-reverse" : "")}
                  >
                    {!isMe && <Avatar name="User" size="sm" />}
                    <div className={cn("max-w-[75%]", isMe ? "items-end" : "")}>
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                          isMe
                            ? "rounded-br-md bg-primary text-primary-foreground"
                            : "rounded-bl-md bg-muted text-foreground"
                        )}
                      >
                        {m.attachment_key && (
                          <p className="mb-2 flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium">
                            <Paperclip className="size-3.5" /> Attachment
                          </p>
                        )}
                        {m.body}
                      </div>
                      <p className={cn("mt-1 text-[10px] text-muted-foreground", isMe ? "text-right" : "")}>
                        {timeAgo(m.created_at)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="border-t border-border/70 p-3 sm:p-4">
              <div className="flex items-end gap-2">
                <Button variant="ghost" size="icon" className="shrink-0" aria-label="Attach file">
                  <Paperclip className="size-4" />
                </Button>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Type your message…"
                  className="max-h-28 min-h-[44px] flex-1 resize-none rounded-xl border border-input bg-background/60 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-ring/40"
                />
                <Button className="shrink-0" size="icon" onClick={send} disabled={!draft.trim() || sending} aria-label="Send message">
                  {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
