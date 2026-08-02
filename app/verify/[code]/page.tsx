import type { Metadata } from "next";
import { VerifyCertificate } from "@/components/public/verify-certificate";

export const metadata: Metadata = {
  title: "Verifying certificate — Kards",
  description: "Tamper-evident validation for Kards volunteering certificates.",
};

export default async function VerifyCodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <VerifyCertificate code={code} />;
}
