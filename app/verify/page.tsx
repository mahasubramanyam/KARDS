import type { Metadata } from "next";
import { VerifyCodeLookup } from "@/components/public/verify-lookup";

export const metadata: Metadata = {
  title: "Verify a certificate — Kards",
  description: "Tamper-evident validation for Kards volunteering certificates. Enter the code from any certificate card.",
};

export default function VerifyLookupPage() {
  return <VerifyCodeLookup />;
}
