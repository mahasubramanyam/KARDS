import {
  LayoutDashboard,
  Compass,
  Zap,
  BadgeCheck,
  MessageSquare,
  Building2,
  FileSearch,
  FileText,
  FolderKanban,
  Users,
  CreditCard,
  BarChart3,
  ShieldCheck,
  ScrollText,
  Scale,
  KeyRound,
  type LucideIcon,
} from "lucide-react";
import { Role } from "@/lib/types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

export const ROLE_LABEL: Record<Role, string> = {
  volunteer: "Volunteer",
  ngo: "NGO",
  company: "Company",
  admin: "Admin",
};

export const ROLE_DESC: Record<Role, string> = {
  volunteer: "Discover opportunities & get certified",
  ngo: "Get verified & receive funding",
  company: "Deploy CSR & prove compliance",
  admin: "Verification, moderation & audit",
};

export const NAV: Record<Role, NavItem[]> = {
  volunteer: [
    { href: "/app/volunteer", label: "Dashboard", icon: LayoutDashboard },
    { href: "/app/volunteer/opportunities", label: "Opportunities", icon: Compass },
    { href: "/app/volunteer/certificates", label: "Certificates", icon: BadgeCheck },
    { href: "/app/volunteer/messages", label: "Messages", icon: MessageSquare },
  ],
  ngo: [
    { href: "/app/ngo", label: "Dashboard", icon: LayoutDashboard },
    { href: "/app/ngo/verification", label: "Verification", icon: FileSearch },
    { href: "/app/ngo/projects", label: "Projects", icon: FolderKanban },
    { href: "/app/ngo/messages", label: "Messages", icon: MessageSquare },
  ],
  company: [
    { href: "/app/company", label: "Dashboard", icon: LayoutDashboard },
    { href: "/app/company/reports", label: "Compliance Reports", icon: FileText },
    { href: "/app/company/roster", label: "Roster & Targets", icon: Users },
    { href: "/app/company/billing", label: "Billing & Plan", icon: CreditCard },
    { href: "/app/company/messages", label: "Messages", icon: MessageSquare },
  ],
  admin: [
    { href: "/app/admin", label: "Dashboard", icon: BarChart3 },
    { href: "/app/admin/verification", label: "Verification Queue", icon: ShieldCheck },
    { href: "/app/admin/audit", label: "Audit Log", icon: ScrollText },
    { href: "/app/admin/disputes", label: "Disputes", icon: Scale },
    { href: "/app/admin/api", label: "API Keys", icon: KeyRound },
  ],
};

export function roleForPath(pathname: string): Role {
  if (pathname.startsWith("/app/ngo")) return "ngo";
  if (pathname.startsWith("/app/company")) return "company";
  if (pathname.startsWith("/app/admin")) return "admin";
  return "volunteer";
}

export const APP_HOME: Record<Role, string> = {
  volunteer: "/app/volunteer",
  ngo: "/app/ngo",
  company: "/app/company",
  admin: "/app/admin",
};

export const SECONDARY = [
  { href: "/app/settings", label: "Settings" },
  { href: "/app/billing", label: "Billing" },
];
