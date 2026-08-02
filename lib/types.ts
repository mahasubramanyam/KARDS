export type Role = "volunteer" | "ngo" | "company" | "admin";

export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";

export type DocType = "12A" | "80G" | "FCRA" | "PAN" | "NITI Aayog" | "other";

export type ScheduleVII =
  | "education"
  | "health"
  | "environment"
  | "livelihood"
  | "disaster_relief"
  | "heritage"
  | "gender"
  | "hunger"
  | "sports"
  | "other";

export type Lifecycle = "draft" | "published" | "in_progress" | "completed" | "reported" | "closed";

export type PlanTier = "starter" | "growth" | "enterprise";

export type Language = "en" | "hi" | "ta";

export const SCHEDULE_VII_META: Record<
  ScheduleVII,
  { label: string; color: string; soft: string }
> = {
  education: { label: "Education", color: "hsl(262 83% 55%)", soft: "hsl(262 83% 55% / 0.12)" },
  health: { label: "Health", color: "hsl(160 60% 42%)", soft: "hsl(160 60% 42% / 0.12)" },
  environment: { label: "Environment", color: "hsl(120 45% 42%)", soft: "hsl(120 45% 42% / 0.12)" },
  livelihood: { label: "Livelihood", color: "hsl(38 92% 50%)", soft: "hsl(38 92% 50% / 0.14)" },
  disaster_relief: { label: "Disaster Relief", color: "hsl(0 72% 55%)", soft: "hsl(0 72% 55% / 0.12)" },
  heritage: { label: "Heritage & Arts", color: "hsl(320 65% 55%)", soft: "hsl(320 65% 55% / 0.12)" },
  gender: { label: "Gender Equality", color: "hsl(200 80% 48%)", soft: "hsl(200 80% 48% / 0.12)" },
  hunger: { label: "Hunger & Nutrition", color: "hsl(28 90% 48%)", soft: "hsl(28 90% 48% / 0.14)" },
  sports: { label: "Sports", color: "hsl(152 62% 42%)", soft: "hsl(152 62% 42% / 0.12)" },
  other: { label: "Other", color: "hsl(262 20% 50%)", soft: "hsl(262 20% 50% / 0.12)" },
};

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  companyId?: string;
  skills: string[];
  location: string;
  verified?: boolean;
  hoursLogged?: number;
  languages: string[];
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  employeeCount: number;
  csrBudgetAnnual: number;
  budgetCommitted: number;
  planTier: PlanTier;
  renewalDate: string;
  seatsIncluded: number;
  deptTargets: { department: string; hoursTarget: number; hoursDone: number; budget: number }[];
  scheduleVIIAllocation: Record<ScheduleVII, number>;
}

export interface Ngo {
  id: string;
  name: string;
  registrationNo: string;
  location: string;
  state: string;
  founded: number;
  focus: ScheduleVII[];
  verificationStatus: VerificationStatus;
  csrReadyScore: number;
  scoreBreakdown: { label: string; value: number; max: number }[];
  documents: {
    id: string;
    type: DocType;
    name: string;
    regNumber: string;
    validity: string;
    status: "valid" | "expiring" | "expired" | "under_review";
    uploadedAt: string;
  }[];
  impactHistory: { period: string; beneficiaries: number; projects: number }[];
  headline: string;
  description: string;
  verifiedDate?: string;
}

export interface Opportunity {
  id: string;
  title: string;
  ngoName: string;
  ngoId: string;
  category: ScheduleVII;
  type: "micro_task" | "long_term";
  duration: string;
  location: string;
  remote: boolean;
  slots: { total: number; filled: number };
  hours: number;
  skills: string[];
  description: string;
  lifecycle: Lifecycle;
  sponsored?: boolean;
  companyName?: string;
  budget?: number;
  postedDate: string;
  recommendedScore?: number;
  matchReasons?: string[];
}

export interface Certificate {
  id: string;
  code: string;
  volunteerName: string;
  ngoName: string;
  opportunityTitle: string;
  category: ScheduleVII;
  hours: number;
  issuedAt: string;
  isPremium: boolean;
  issuedBy: string;
}

export interface ThreadMessage {
  id: string;
  threadId: string;
  sender: string;
  senderRole: Role;
  body: string;
  at: string;
  attachment?: string;
}

export interface Thread {
  id: string;
  opportunityId: string;
  title: string;
  ngoName: string;
  participants: string[];
  lastMessageAt: string;
  unread: number;
  messages: ThreadMessage[];
}

export interface Report {
  id: string;
  period: string;
  status: "generating" | "ready" | "final";
  totalHours: number;
  totalBudgetDeployed: number;
  volunteers: number;
  ngoCount: number;
  scheduleVIIBreakdown: { category: ScheduleVII; hours: number; budget: number; volunteers: number }[];
  deptBreakdown: { department: string; hours: number; budget: number }[];
  generatedAt: string;
  downloaded: number;
}

export interface Invoice {
  id: string;
  number: string;
  period: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  dueDate: string;
  items: { label: string; amount: number }[];
}

export interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  target: string;
  reason?: string;
  at: string;
  severity: "info" | "warning" | "critical";
}

export interface VerificationQueueItem {
  id: string;
  ngoName: string;
  location: string;
  submittedAt: string;
  docCount: number;
  risk: "low" | "medium" | "high";
  status: VerificationStatus;
  priority: number;
}

export interface Dispute {
  id: string;
  title: string;
  from: string;
  opportunityId?: string;
  status: "open" | "resolved";
  at: string;
  summary: string;
}

export interface Plan {
  tier: PlanTier;
  name: string;
  priceAnnual: number;
  priceMonthly: number;
  seats: number;
  tagline: string;
  features: string[];
  highlighted?: boolean;
}

export const PLANS: Plan[] = [
  {
    tier: "starter",
    name: "Starter",
    priceAnnual: 120000,
    priceMonthly: 12000,
    seats: 200,
    tagline: "For companies deploying CSR for the first time.",
    features: [
      "200 employee seats",
      "CSR budget ledger + Schedule VII tagging",
      "Quarterly compliance report (PDF)",
      "Employee volunteering matching",
      "Email support",
    ],
  },
  {
    tier: "growth",
    name: "Growth",
    priceAnnual: 480000,
    priceMonthly: 48000,
    seats: 1000,
    tagline: "For teams that need audit-ready proof of spend.",
    features: [
      "1,000 employee seats",
      "Everything in Starter",
      "XLSX exports for finance teams",
      "Department-level hour targets",
      "Razorpay invoicing + GST",
      "Verifiable certificates for all volunteers",
      "Priority verification for partner NGOs",
    ],
    highlighted: true,
  },
  {
    tier: "enterprise",
    name: "Enterprise",
    priceAnnual: 1500000,
    priceMonthly: 150000,
    seats: 5000,
    tagline: "For multi-location CSR programs and consultancies.",
    features: [
      "5,000+ employee seats",
      "Everything in Growth",
      "White-label API + public REST access",
      "Benchmarking & sector analytics",
      "Dedicated CSM + audit support",
      "Custom report formats",
      "SSO + advanced RBAC",
    ],
  },
];

export const CURRENCY = "INR";
