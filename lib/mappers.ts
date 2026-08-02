import type { OpportunityOut } from "./api";
import type { Lifecycle, Opportunity, ScheduleVII } from "./types";

const KNOWN_LIFECYCLES: Lifecycle[] = [
  "draft",
  "published",
  "in_progress",
  "completed",
  "reported",
  "closed",
];

export function toOpportunity(o: OpportunityOut): Opportunity {
  const remote = o.is_remote;
  const lifecycle = (KNOWN_LIFECYCLES as string[]).includes(o.status)
    ? (o.status as Lifecycle)
    : "published";
  return {
    id: o.id,
    title: o.title,
    ngoName: "Verified partner NGO",
    ngoId: o.ngo_user_id,
    category: o.category as ScheduleVII,
    type: o.hours_estimate > 5 ? "long_term" : "micro_task",
    duration: o.end_date
      ? `Runs to ${o.end_date.slice(0, 10)}`
      : remote
        ? "Flexible · remote"
        : "Flexible schedule",
    location: o.location ?? (remote ? "Remote" : "On-site"),
    remote,
    slots: { total: o.slots_total, filled: o.slots_filled },
    hours: o.hours_estimate,
    skills: [],
    description: o.description ?? "",
    lifecycle,
    postedDate: o.created_at.slice(0, 10),
  };
}
