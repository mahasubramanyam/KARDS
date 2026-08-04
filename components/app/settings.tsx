"use client";

import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Building2, HandHelping, Loader2, Mail, Save, ShieldCheck, User } from "lucide-react";
import { Section } from "@/components/app/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { api, ApiError, type Locale, type ProfileOut } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const LOCALES: { value: Locale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी (Hindi)" },
  { value: "ta", label: "தமிழ் (Tamil)" },
];

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}

export function SettingsPage() {
  const { push } = useToast();
  const { refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileOut | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const [phone, setPhone] = useState("");
  const [locale, setLocale] = useState<Locale>("en");

  const [volunteer, setVolunteer] = useState({
    location: "",
    availability: "",
    bio: "",
    skills: "",
  });
  const [ngo, setNgo] = useState({
    org_name: "",
    reg_number: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    website: "",
    description: "",
    founded_year: "",
  });
  const [company, setCompany] = useState({
    company_name: "",
    cin: "",
    industry: "",
    headquarters: "",
    city: "",
    state: "",
    website: "",
    description: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const me = await api.users.me();
      setProfile(me);
      setPhone(me.user.phone ?? "");
      setLocale(me.user.locale);
      if (me.volunteer) {
        setVolunteer({
          location: me.volunteer.location ?? "",
          availability: me.volunteer.availability ?? "",
          bio: me.volunteer.bio ?? "",
          skills: me.volunteer.skills.join(", "),
        });
      }
      if (me.ngo) {
        setNgo({
          org_name: me.ngo.org_name ?? "",
          reg_number: me.ngo.reg_number ?? "",
          address: me.ngo.address ?? "",
          city: me.ngo.city ?? "",
          state: me.ngo.state ?? "",
          pincode: me.ngo.pincode ?? "",
          website: me.ngo.website ?? "",
          description: me.ngo.description ?? "",
          founded_year: me.ngo.founded_year ? String(me.ngo.founded_year) : "",
        });
      }
      if (me.company) {
        setCompany({
          company_name: me.company.company_name ?? "",
          cin: me.company.cin ?? "",
          industry: me.company.industry ?? "",
          headquarters: me.company.headquarters ?? "",
          city: me.company.city ?? "",
          state: me.company.state ?? "",
          website: me.company.website ?? "",
          description: me.company.description ?? "",
        });
      }
    } catch (e) {
      setError((e as ApiError).message || "Could not load your profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (key: string, fn: () => Promise<ProfileOut>) => {
    setSaving(key);
    try {
      const me = await fn();
      setProfile(me);
      setPhone(me.user.phone ?? "");
      await refreshProfile();
      push("success", "Settings saved", "Your profile has been updated.");
    } catch (e) {
      push("error", "Save failed", (e as ApiError).message || "Something went wrong.");
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="grid place-items-center py-32 text-center">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Loading settings…</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="grid place-items-center py-32 text-center">
        <p className="text-sm font-medium text-destructive">{error || "Profile unavailable."}</p>
      </div>
    );
  }

  const role = profile.user.role;

  return (
    <div className="space-y-6">
      <Section title="Account" subtitle="Your login details and preferences.">
        <Card>
          <CardHeader className="pb-0">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                <User className="size-5" />
              </div>
              <div>
                <CardTitle>{profile.user.full_name}</CardTitle>
                <CardDescription className="flex items-center gap-1.5">
                  <Mail className="size-3.5" /> {profile.user.email}
                </CardDescription>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Badge variant="secondary">{role}</Badge>
                {profile.user.email_verified_at ? (
                  <Badge variant="outline" className="gap-1 text-success">
                    <BadgeCheck className="size-3.5" /> Verified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 text-muted-foreground">
                    <ShieldCheck className="size-3.5" /> Unverified
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Phone">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 …" />
            </Field>
            <Field label="Language">
              <Select
                value={locale}
                onValueChange={(v) => setLocale(v as Locale)}
                options={LOCALES}
                aria-label="Language"
              />
            </Field>
            <div className="md:col-span-2">
              <Button
                variant="outline"
                disabled={saving !== null}
                onClick={() =>
                  save("account", async () => {
                    await api.users.setLocale(locale);
                    const patch = { phone: phone || undefined };
                    if (role === "volunteer") return api.users.updateVolunteer(patch);
                    if (role === "ngo") return api.users.updateNgo(patch);
                    if (role === "company") return api.users.updateCompany(patch);
                    return api.users.me();
                  })
                }
              >
                {saving === "account" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Save preferences
              </Button>
            </div>
          </CardContent>
        </Card>
      </Section>

      {role === "volunteer" && (
        <Section title="Volunteer profile" subtitle="Showcase your skills so NGOs find you faster.">
          <Card>
            <CardHeader className="pb-0">
              <div className="flex items-center gap-3">
                <div className="grid size-11 place-items-center rounded-2xl bg-success/10 text-success">
                  <HandHelping className="size-5" />
                </div>
                <div>
                  <CardTitle>Volunteer details</CardTitle>
                  <CardDescription>Editable — saved to your profile.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Location">
                <Input
                  value={volunteer.location}
                  onChange={(e) => setVolunteer({ ...volunteer, location: e.target.value })}
                  placeholder="City, State"
                />
              </Field>
              <Field label="Availability">
                <Input
                  value={volunteer.availability}
                  onChange={(e) => setVolunteer({ ...volunteer, availability: e.target.value })}
                  placeholder="Weekends, 10 hrs/week"
                />
              </Field>
              <Field label="Skills" className="md:col-span-2">
                <Input
                  value={volunteer.skills}
                  onChange={(e) => setVolunteer({ ...volunteer, skills: e.target.value })}
                  placeholder="Teaching, Design, Data entry"
                />
              </Field>
              <Field label="Bio" className="md:col-span-2">
                <Textarea
                  value={volunteer.bio}
                  onChange={(e) => setVolunteer({ ...volunteer, bio: e.target.value })}
                  placeholder="A short intro about yourself…"
                />
              </Field>
              <div className="md:col-span-2">
                <Button
                  disabled={saving !== null}
                  onClick={() =>
                    save("volunteer", () =>
                      api.users.updateVolunteer({
                        location: volunteer.location || null,
                        availability: volunteer.availability || null,
                        bio: volunteer.bio || null,
                        skills: volunteer.skills
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    )
                  }
                >
                  {saving === "volunteer" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Save volunteer profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </Section>
      )}

      {role === "ngo" && (
        <Section title="NGO profile" subtitle="These details are reviewed during verification.">
          <Card>
            <CardHeader className="pb-0">
              <div className="flex items-center gap-3">
                <div className="grid size-11 place-items-center rounded-2xl bg-accent/10 text-accent">
                  <Building2 className="size-5" />
                </div>
                <div>
                  <CardTitle>Organisation details</CardTitle>
                  <CardDescription>Editable — saved to your NGO record.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Organisation name">
                <Input value={ngo.org_name} onChange={(e) => setNgo({ ...ngo, org_name: e.target.value })} />
              </Field>
              <Field label="Registration number">
                <Input
                  value={ngo.reg_number}
                  onChange={(e) => setNgo({ ...ngo, reg_number: e.target.value })}
                  placeholder="e.g. 123/2016"
                />
              </Field>
              <Field label="Founded year">
                <Input
                  value={ngo.founded_year}
                  onChange={(e) => setNgo({ ...ngo, founded_year: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                  inputMode="numeric"
                  placeholder="2016"
                />
              </Field>
              <Field label="Website">
                <Input
                  value={ngo.website}
                  onChange={(e) => setNgo({ ...ngo, website: e.target.value })}
                  placeholder="https://…"
                />
              </Field>
              <Field label="Address" className="md:col-span-2">
                <Input value={ngo.address} onChange={(e) => setNgo({ ...ngo, address: e.target.value })} />
              </Field>
              <Field label="City">
                <Input value={ngo.city} onChange={(e) => setNgo({ ...ngo, city: e.target.value })} />
              </Field>
              <Field label="State">
                <Input value={ngo.state} onChange={(e) => setNgo({ ...ngo, state: e.target.value })} />
              </Field>
              <Field label="PIN code">
                <Input
                  value={ngo.pincode}
                  onChange={(e) => setNgo({ ...ngo, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                  inputMode="numeric"
                />
              </Field>
              <Field label="Description" className="md:col-span-2">
                <Textarea
                  value={ngo.description}
                  onChange={(e) => setNgo({ ...ngo, description: e.target.value })}
                  placeholder="Your mission and impact…"
                />
              </Field>
              <div className="md:col-span-2">
                <Button
                  disabled={saving !== null}
                  onClick={() =>
                    save("ngo", () =>
                      api.users.updateNgo({
                        org_name: ngo.org_name,
                        reg_number: ngo.reg_number || null,
                        address: ngo.address || null,
                        city: ngo.city || null,
                        state: ngo.state || null,
                        pincode: ngo.pincode || null,
                        website: ngo.website || null,
                        description: ngo.description || null,
                        founded_year: ngo.founded_year ? Number(ngo.founded_year) : null,
                      })
                    )
                  }
                >
                  {saving === "ngo" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Save NGO profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </Section>
      )}

      {role === "company" && (
        <Section title="Company profile" subtitle="Shown to NGOs browsing your CSR program.">
          <Card>
            <CardHeader className="pb-0">
              <div className="flex items-center gap-3">
                <div className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Building2 className="size-5" />
                </div>
                <div>
                  <CardTitle>Company details</CardTitle>
                  <CardDescription>Editable — saved to your company record.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Company name">
                <Input
                  value={company.company_name}
                  onChange={(e) => setCompany({ ...company, company_name: e.target.value })}
                />
              </Field>
              <Field label="CIN">
                <Input value={company.cin} onChange={(e) => setCompany({ ...company, cin: e.target.value })} />
              </Field>
              <Field label="Industry">
                <Input
                  value={company.industry}
                  onChange={(e) => setCompany({ ...company, industry: e.target.value })}
                />
              </Field>
              <Field label="Headquarters">
                <Input
                  value={company.headquarters}
                  onChange={(e) => setCompany({ ...company, headquarters: e.target.value })}
                />
              </Field>
              <Field label="City">
                <Input value={company.city} onChange={(e) => setCompany({ ...company, city: e.target.value })} />
              </Field>
              <Field label="State">
                <Input value={company.state} onChange={(e) => setCompany({ ...company, state: e.target.value })} />
              </Field>
              <Field label="Website" className="md:col-span-2">
                <Input
                  value={company.website}
                  onChange={(e) => setCompany({ ...company, website: e.target.value })}
                  placeholder="https://…"
                />
              </Field>
              <Field label="Description" className="md:col-span-2">
                <Textarea
                  value={company.description}
                  onChange={(e) => setCompany({ ...company, description: e.target.value })}
                  placeholder="Your CSR focus areas…"
                />
              </Field>
              <div className="md:col-span-2">
                <Button
                  disabled={saving !== null}
                  onClick={() =>
                    save("company", () =>
                      api.users.updateCompany({
                        company_name: company.company_name,
                        cin: company.cin || null,
                        industry: company.industry || null,
                        headquarters: company.headquarters || null,
                        city: company.city || null,
                        state: company.state || null,
                        website: company.website || null,
                        description: company.description || null,
                      })
                    )
                  }
                >
                  {saving === "company" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Save company profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </Section>
      )}

      {role === "admin" && (
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-5">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          <div className="text-sm">
            <p className="font-semibold">Admin account</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              Admin profiles are managed by the platform. Your account and language preferences above are the only
              editable fields.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
