export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

const TOKEN_KEYS = {
  access: "kards.access_token",
  refresh: "kards.refresh_token",
} as const;

export class ApiError extends Error {
  status: number;
  code: string;
  detail: Record<string, unknown>;
  constructor(status: number, code: string, message: string, detail: Record<string, unknown> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.detail = detail;
  }
}

// ---- Token helpers --------------------------------------------------------

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEYS.access);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEYS.refresh);
}

export function setTokens(pair: { access_token: string; refresh_token: string }) {
  window.localStorage.setItem(TOKEN_KEYS.access, pair.access_token);
  window.localStorage.setItem(TOKEN_KEYS.refresh, pair.refresh_token);
}

export function clearTokens() {
  window.localStorage.removeItem(TOKEN_KEYS.access);
  window.localStorage.removeItem(TOKEN_KEYS.refresh);
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken());
}

// ---- Refresh (single-flight) ----------------------------------------------

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const refresh = getRefreshToken();
    if (!refresh) return null;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refresh }),
      });
      if (!res.ok) {
        clearTokens();
        return null;
      }
      const data = (await res.json()) as TokenPair;
      setTokens(data);
      return data.access_token;
    } catch {
      clearTokens();
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

// ---- Request core ---------------------------------------------------------

interface RequestOptions {
  method?: string;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  auth?: boolean;
  headers?: Record<string, string>;
}

async function parseError(res: Response): Promise<ApiError> {
  let code = "request_failed";
  let message = `Request failed with status ${res.status}`;
  let detail: Record<string, unknown> = {};
  try {
    const data = await res.json();
    if (data?.error) {
      code = data.error.code ?? code;
      message = data.error.message ?? message;
      detail = data.error.detail ?? {};
    } else if (data?.detail) {
      message = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
      detail = typeof data.detail === "object" ? data.detail : {};
    }
  } catch {
    /* body not JSON */
  }
  return new ApiError(res.status, code, message, detail);
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", query, body, auth = true, headers } = options;

  let url = `${API_BASE_URL}${path}`;
  if (query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const finalHeaders: Record<string, string> = { ...headers };
  if (body !== undefined && !(body instanceof FormData)) {
    finalHeaders["Content-Type"] = "application/json";
  }
  if (auth) {
    const token = getAccessToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  const makeFetch = () =>
    fetch(url, {
      method,
      headers: finalHeaders,
      body:
        body instanceof FormData
          ? body
          : body !== undefined
            ? JSON.stringify(body)
            : undefined,
    });

  let res = await makeFetch();

  if (res.status === 401 && auth && getRefreshToken()) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      finalHeaders.Authorization = `Bearer ${newToken}`;
      res = await makeFetch();
    }
  }

  if (!res.ok) throw await parseError(res);

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ---- API types (mirror backend Pydantic schemas) --------------------------

export type Role = "volunteer" | "ngo" | "company" | "admin";
export type Locale = "en" | "hi" | "ta";

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface UserOut {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  locale: Locale;
  phone: string | null;
  email_verified_at: string | null;
  created_at: string;
}

export interface VolunteerProfileOut {
  user_id: string;
  location: string | null;
  bio: string | null;
  skills: string[];
  availability: string | null;
}

export interface NgoProfileOut {
  user_id: string;
  org_name: string;
  reg_number: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  website: string | null;
  description: string | null;
  founded_year: number | null;
  status: string;
  verified_at: string | null;
}

export interface CompanyProfileOut {
  user_id: string;
  company_name: string;
  cin: string | null;
  industry: string | null;
  headquarters: string | null;
  city: string | null;
  state: string | null;
  website: string | null;
  description: string | null;
}

export interface ProfileOut {
  user: UserOut;
  volunteer: VolunteerProfileOut | null;
  ngo: NgoProfileOut | null;
  company: CompanyProfileOut | null;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface MessageResponse {
  message: string;
}

export interface OpportunityOut {
  id: string;
  ngo_user_id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  category: string;
  location: string | null;
  is_remote: boolean;
  status: string;
  start_date: string | null;
  end_date: string | null;
  slots_total: number;
  slots_filled: number;
  hours_estimate: number;
  created_at: string;
  updated_at: string;
}

export interface ApplicationOut {
  id: string;
  opportunity_id: string;
  volunteer_id: string;
  status: string;
  cover_note: string | null;
  applied_at: string;
  decided_at: string | null;
  decided_by: string | null;
  created_at: string;
}

export interface WorkLogOut {
  id: string;
  opportunity_id: string;
  volunteer_id: string;
  application_id: string | null;
  log_date: string;
  hours: number;
  note: string | null;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
}

export interface CertificateOut {
  id: string;
  code: string;
  volunteer_id: string;
  opportunity_id: string;
  ngo_user_id: string;
  title: string;
  hours_total: number;
  issued_at: string;
  issued_by: string;
  template: string;
  status: string;
  content_hash: string;
  created_at: string;
}

export interface CertificatePublic {
  valid: boolean;
  code: string;
  volunteer_name: string | null;
  opportunity_title: string | null;
  hours_total: number | null;
  issued_at: string | null;
  status: string | null;
  content_hash_verified: boolean | null;
}

export interface ThreadOut {
  id: string;
  subject: string;
  subject_id: string;
  title: string;
  created_by: string;
  last_message_at: string | null;
  created_at: string;
}

export interface MessageOut {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  attachment_key: string | null;
  created_at: string;
}

export interface ThreadWithMessages extends ThreadOut {
  messages: MessageOut[];
}

export interface NotificationOut {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export interface ReportOut {
  id: string;
  kind: string;
  company_user_id: string;
  project_id: string | null;
  period_start: string;
  period_end: string;
  status: string;
  generated_by: string;
  total_hours: number | null;
  total_volunteers: number | null;
  total_expense: number | null;
  schedule_vii_breakdown: Record<string, unknown> | null;
  detail: Record<string, unknown> | null;
  file_name: string | null;
  error_message: string | null;
  finalized_at: string | null;
  is_final: boolean;
  created_at: string;
}

export interface InvoiceOut {
  id: string;
  company_user_id: string;
  subscription_id: string | null;
  provider: string;
  provider_invoice_id: string | null;
  amount: number;
  status: string;
  due_date: string;
  paid_at: string | null;
  items: Array<{ label: string; amount: number }> | null;
  created_at: string;
}

export interface SubscriptionOut {
  id: string;
  company_user_id: string;
  plan_id: string;
  status: string;
  provider: string;
  provider_subscription_id: string | null;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
}

export interface PlanOut {
  id: string;
  tier: string;
  name: string;
  price_monthly: number;
  price_annual: number;
  seats: number;
  features: string[];
}

export interface ProjectOut {
  id: string;
  company_user_id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  budget_amount: number;
  target_hours: number;
  created_at: string;
  updated_at: string;
}

export interface PartnershipOut {
  id: string;
  project_id: string;
  ngo_user_id: string;
  invited_by: string;
  status: string;
  responded_at: string | null;
  message: string | null;
  created_at: string;
}

export interface VerificationRequestOut {
  id: string;
  ngo_user_id: string;
  status: string;
  submitted_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  decision_reason: string | null;
  created_at: string;
}

export interface CsrScoreOut {
  id: string;
  ngo_user_id: string;
  documents_weight: number;
  operations_weight: number;
  past_performance_weight: number;
  governance_weight: number;
  total: number;
  computed_by: string | null;
  created_at: string;
}

export interface DocumentOut {
  id: string;
  subject_type: string;
  subject_id: string;
  storage_key: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  sha256: string;
  uploaded_by: string | null;
  doc_type: string | null;
  validation_status: string | null;
  validated_at: string | null;
  validated_by: string | null;
  rejection_reason: string | null;
  created_at: string;
}

export interface BudgetOut {
  id: string;
  company_user_id: string;
  fiscal_year: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface AllocationOut {
  id: string;
  budget_id: string;
  category: string;
  amount: number;
}

export interface DisputeOut {
  id: string;
  subject_type: string;
  subject_id: string;
  filed_by: string;
  against_user_id: string | null;
  summary: string;
  status: string;
  decision: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface AuditOut {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  subject_type: string | null;
  subject_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  severity: string;
  created_at: string;
}

export interface ApiKeyOut {
  id: string;
  company_user_id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  is_active: boolean;
  rate_limit_per_hour: number;
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

export interface ApiKeyCreated extends ApiKeyOut {
  plain_key: string;
}

// ---- Endpoint functions ---------------------------------------------------

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  role: "volunteer" | "ngo" | "company";
  locale?: Locale;
  phone?: string;
  skills?: string[];
  location?: string;
  org_name?: string;
  reg_number?: string;
  city?: string;
  state?: string;
  address?: string;
  company_name?: string;
  cin?: string;
  industry?: string;
}

export const auth = {
  register: (payload: RegisterPayload) =>
    request<UserOut>("/auth/register", { method: "POST", body: payload, auth: false }),
  login: (email: string, password: string) =>
    request<TokenPair>("/auth/login", { method: "POST", body: { email, password }, auth: false }),
  refresh: (refresh_token: string) =>
    request<TokenPair>("/auth/refresh", { method: "POST", body: { refresh_token }, auth: false }),
  logout: () => request<MessageResponse>("/auth/logout", { method: "POST", body: { refresh_token: getRefreshToken() } }),
  verifyEmail: (token: string) => request<MessageResponse>("/auth/verify-email", { method: "POST", body: { token }, auth: false }),
  resendVerification: (email: string) => request<MessageResponse>("/auth/resend-verification", { method: "POST", body: { email }, auth: false }),
  forgotPassword: (email: string) => request<MessageResponse>("/auth/forgot-password", { method: "POST", body: { email }, auth: false }),
  resetPassword: (token: string, new_password: string) =>
    request<MessageResponse>("/auth/reset-password", { method: "POST", body: { token, new_password }, auth: false }),
};

export const users = {
  me: () => request<ProfileOut>("/users/me"),
  updateVolunteer: (payload: Partial<VolunteerProfileOut & { phone?: string }>) =>
    request<ProfileOut>("/users/me/volunteer", { method: "PATCH", body: payload }),
  updateNgo: (payload: Partial<NgoProfileOut>) => request<ProfileOut>("/users/me/ngo", { method: "PATCH", body: payload }),
  updateCompany: (payload: Partial<CompanyProfileOut>) =>
    request<ProfileOut>("/users/me/company", { method: "PATCH", body: payload }),
  setLocale: (locale: Locale) => request<ProfileOut>("/users/me/locale", { method: "PATCH", body: { locale } }),
};

export const publicApi = {
  opportunities: (query?: {
    category?: string;
    remote?: boolean;
    search?: string;
    skip?: number;
    limit?: number;
  }) =>
    request<Page<OpportunityOut>>("/public/opportunities", {
      auth: false,
      query: {
        category: query?.category,
        remote: query?.remote,
        search: query?.search,
        skip: query?.skip,
        limit: query?.limit,
      },
    }),
  opportunity: (id: string) => request<OpportunityOut>(`/public/opportunities/${id}`, { auth: false }),
  verifyCertificate: (code: string) =>
    request<CertificatePublic>(`/public/certificates/verify`, { query: { code }, auth: false }),
};

export const volunteering = {
  apply: (opportunity_id: string, cover_note?: string) =>
    request<ApplicationOut>("/volunteering/applications", { method: "POST", body: { opportunity_id, cover_note } }),
  myApplications: (query?: { status?: string; skip?: number; limit?: number }) =>
    request<Page<ApplicationOut>>("/volunteering/applications/mine", { query }),
  withdraw: (application_id: string) =>
    request<ApplicationOut>(`/volunteering/applications/${application_id}/withdraw`, { method: "POST" }),
  applicants: (opportunity_id: string) =>
    request<Page<ApplicationOut>>(`/volunteering/applications/opportunity/${opportunity_id}`),
  decide: (application_id: string, accept: boolean) =>
    request<ApplicationOut>(`/volunteering/applications/${application_id}/decide`, { method: "POST", body: { accept } }),
  logHours: (payload: { opportunity_id: string; log_date: string; hours: number; note?: string }) =>
    request<WorkLogOut>("/volunteering/worklogs", { method: "POST", body: payload }),
  pendingWorklogs: (query?: { skip?: number; limit?: number }) =>
    request<Page<WorkLogOut>>("/volunteering/worklogs/pending", { query }),
  approveWorklog: (worklog_id: string) =>
    request<WorkLogOut>(`/volunteering/worklogs/${worklog_id}/approve`, { method: "POST" }),
  rejectWorklog: (worklog_id: string) =>
    request<WorkLogOut>(`/volunteering/worklogs/${worklog_id}/reject`, { method: "POST" }),
  issueCertificate: (opportunity_id: string, volunteer_id: string) =>
    request<CertificateOut>(`/volunteering/opportunities/${opportunity_id}/certificates`, {
      method: "POST",
      query: { volunteer_id },
    }),
  completeOpportunity: (opportunity_id: string) =>
    request<OpportunityOut>(`/volunteering/opportunities/${opportunity_id}/complete`, { method: "POST" }),
  myCertificates: () => request<CertificateOut[]>("/volunteering/certificates/mine"),
};

export const verification = {
  documents: () => request<DocumentOut[]>("/verification/documents"),
  uploadDocument: (file: File, subject_id: string, doc_type?: string) => {
    const form = new FormData();
    form.append("file", file);
    form.append("subject_type", "ngo_verification");
    form.append("subject_id", subject_id);
    if (doc_type) form.append("doc_type", doc_type);
    return request<DocumentOut>("/verification/documents", { method: "POST", body: form });
  },
  submit: (document_ids: string[]) =>
    request<VerificationRequestOut>("/verification/submit", { method: "POST", body: { document_ids } }),
  status: () => request<VerificationRequestOut | null>("/verification/status"),
  score: () => request<CsrScoreBreakdownApi>("/verification/score"),
  queue: (query?: { skip?: number; limit?: number }) =>
    request<Page<VerificationRequestOut>>("/verification/queue", { query }),
  review: (request_id: string, approve: boolean, reason: string) =>
    request<VerificationRequestOut>(`/verification/queue/${request_id}/review`, {
      method: "POST",
      body: { approve, reason },
    }),
};

export const csr = {
  budgets: () => request<BudgetOut[]>("/csr/budgets"),
  upsertBudget: (payload: { fiscal_year: string; total_amount: number; allocations: Record<string, number> }) =>
    request<BudgetOut>("/csr/budget", { method: "PUT", body: payload }),
  allocations: (budget_id: string) => request<AllocationOut[]>(`/csr/budgets/${budget_id}/allocations`),
  projects: (query?: { status?: string; skip?: number; limit?: number }) =>
    request<Page<ProjectOut>>("/csr/projects", { query }),
  project: (id: string) => request<ProjectOut>(`/csr/projects/${id}`),
  createProject: (payload: Omit<ProjectOut, "id" | "company_user_id" | "status" | "created_at" | "updated_at">) =>
    request<ProjectOut>("/csr/projects", { method: "POST", body: payload }),
  updateProject: (id: string, payload: Partial<ProjectOut>) =>
    request<ProjectOut>(`/csr/projects/${id}`, { method: "PATCH", body: payload }),
  activateProject: (id: string) => request<ProjectOut>(`/csr/projects/${id}/activate`, { method: "POST" }),
  completeProject: (id: string) => request<ProjectOut>(`/csr/projects/${id}/complete`, { method: "POST" }),
  inviteNgo: (id: string, ngo_user_id: string, message?: string) =>
    request<PartnershipOut>(`/csr/projects/${id}/invite`, { method: "POST", body: { ngo_user_id, message } }),
  projectPartnerships: (id: string) => request<PartnershipOut[]>(`/csr/projects/${id}/partnerships`),
  myPartnerships: () => request<PartnershipOut[]>("/csr/partnerships"),
  respondPartnership: (id: string, accept: boolean, message?: string) =>
    request<PartnershipOut>(`/csr/partnerships/${id}/respond`, { method: "POST", body: { accept, message } }),
  opportunities: (query?: { status?: string; skip?: number; limit?: number }) =>
    request<Page<OpportunityOut>>("/csr/opportunities", { query }),
  createOpportunity: (payload: {
    title: string;
    description?: string;
    category: string;
    location?: string;
    is_remote?: boolean;
    start_date?: string;
    end_date?: string;
    slots_total?: number;
    hours_estimate?: number;
    project_id?: string;
  }) => request<OpportunityOut>("/csr/opportunities", { method: "POST", body: payload }),
  publishOpportunity: (id: string) => request<OpportunityOut>(`/csr/opportunities/${id}/publish`, { method: "POST" }),
  closeOpportunity: (id: string) => request<OpportunityOut>(`/csr/opportunities/${id}/close`, { method: "POST" }),
  updateOpportunity: (id: string, payload: Partial<OpportunityOut>) =>
    request<OpportunityOut>(`/csr/opportunities/${id}`, { method: "PATCH", body: payload }),
};

export const reports = {
  create: (payload: { kind?: string; project_id?: string; period_start: string; period_end: string }) =>
    request<ReportOut>("/reports", { method: "POST", body: payload }),
  list: (query?: { skip?: number; limit?: number }) => request<Page<ReportOut>>("/reports", { query }),
  get: (id: string) => request<ReportOut>(`/reports/${id}`),
  finalize: (id: string, payload: { project_id?: string; period_start: string; period_end: string }) =>
    request<ReportOut>(`/reports/${id}/finalize`, { method: "POST", body: payload }),
};

export const billing = {
  plans: () => request<PlanOut[]>("/billing/plans", { auth: false }),
  subscribe: (plan_id: string) => request<SubscriptionOut>("/billing/subscribe", { method: "POST", body: { plan_id } }),
  subscription: () => request<SubscriptionOut | null>("/billing/subscription"),
  invoices: () => request<InvoiceOut[]>("/billing/invoices"),
};

export const messaging = {
  threads: () => request<ThreadOut[]>("/messaging/threads"),
  getThread: (id: string) => request<ThreadWithMessages>(`/messaging/threads/${id}`),
  send: (thread_id: string, body: string) =>
    request<MessageOut>(`/messaging/threads/${thread_id}/messages`, { method: "POST", body: { body } }),
  markRead: (thread_id: string) =>
    request<{ read_at: string }>(`/messaging/threads/${thread_id}/read`, { method: "POST" }),
  createThread: (payload: { subject: string; subject_id: string; title: string; participant_ids?: string[] }) =>
    request<ThreadOut>("/messaging/threads", { method: "POST", body: payload }),
};

export const disputes = {
  mine: () => request<DisputeOut[]>("/disputes/mine"),
  file: (payload: { subject_type: string; subject_id: string; summary: string }) =>
    request<DisputeOut>("/disputes", { method: "POST", body: payload }),
  get: (id: string) => request<DisputeOut>(`/disputes/${id}`),
  adminQueue: (query?: { skip?: number; limit?: number }) =>
    request<Page<DisputeOut>>("/disputes/admin/queue", { query }),
  resolve: (id: string, decision: string) =>
    request<DisputeOut>(`/disputes/admin/${id}/resolve`, { method: "POST", body: { decision } }),
};

export const admin = {
  users: (query?: { role?: string; search?: string; skip?: number; limit?: number }) =>
    request<Page<UserOut>>("/admin/users", { query }),
  deactivate: (id: string) => request<UserOut>(`/admin/users/${id}/deactivate`, { method: "POST" }),
  activate: (id: string) => request<UserOut>(`/admin/users/${id}/activate`, { method: "POST" }),
  auditLogs: (query?: { severity?: string; skip?: number; limit?: number }) =>
    request<Page<AuditOut>>("/admin/audit-logs", { query }),
};

export const apiKeys = {
  create: (payload: { name: string; scopes?: string[]; rate_limit_per_hour?: number }) =>
    request<ApiKeyCreated>("/api-keys", { method: "POST", body: payload }),
  list: () => request<ApiKeyOut[]>("/api-keys"),
  revoke: (id: string) => request<ApiKeyOut>(`/api-keys/${id}/revoke`, { method: "POST" }),
};

export const notifications = {
  list: (query?: { unread_only?: boolean; limit?: number }) =>
    request<NotificationOut[]>("/notifications", { query }),
  unreadCount: () => request<{ count: number }>("/notifications/unread-count"),
  markRead: (id: string) => request<NotificationOut>(`/notifications/${id}/read`, { method: "POST" }),
  markAllRead: () => request<{ updated: number }>("/notifications/read-all", { method: "POST" }),
};

export const uploads = {
  upload: (file: File, subject_type: string, subject_id: string, doc_type?: string) => {
    const form = new FormData();
    form.append("file", file);
    form.append("subject_type", subject_type);
    form.append("subject_id", subject_id);
    if (doc_type) form.append("doc_type", doc_type);
    return request<DocumentOut>("/uploads", { method: "POST", body: form });
  },
};

// Extra shapes used by verification / admin surfaces.
export interface CsrScoreBreakdownApi {
  documents_weight: number;
  operations_weight: number;
  past_performance_weight: number;
  governance_weight: number;
  total: number;
}

export const api = {
  auth,
  users,
  public: publicApi,
  volunteering,
  verification,
  csr,
  reports,
  billing,
  messaging,
  disputes,
  admin,
  apiKeys,
  notifications,
  uploads,
};
