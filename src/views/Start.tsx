"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DEEBOAI_CONTACT_EMAIL } from "@/lib/contact";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PROJECT_TYPES = [
  "New website",
  "Website redesign",
  "Web app / SaaS",
  "Mobile app",
  "E-commerce / online store",
  "Custom workflow / internal tool",
  "AI feature / integration",
  "Healthcare tooling",
  "Email / Google Workspace setup",
  "Technical cleanup / rescue",
  "Ongoing managed support",
  "Not sure yet",
];

const FEATURES = [
  "User accounts / login",
  "Payments / billing",
  "Booking / scheduling",
  "Blog / content (CMS)",
  "Dashboard / analytics",
  "Search",
  "File uploads",
  "Email / notifications",
  "Chat / messaging",
  "AI / automation",
  "Third-party integrations",
  "Multi-language",
  "Admin panel",
];

const DESIGN_STATUS = [
  "Nothing yet",
  "Rough ideas / wireframes",
  "Figma / mockups ready",
  "Existing brand & guidelines",
];

const BUDGET_RANGES = [
  "Under $2,500",
  "$2,500 – $5,000",
  "$5,000 – $10,000",
  "$10,000 – $25,000",
  "$25,000 – $50,000",
  "$50,000+",
  "Not sure / need guidance",
];

const TIMELINES = ["As soon as possible", "Within 1 month", "1 – 3 months", "3 – 6 months", "Flexible"];

const ENGAGEMENT_TYPES = ["One-time project", "Ongoing monthly support", "Both", "Not sure"];

const BUSINESS_STAGES = ["Established business", "New venture / startup", "Personal / side project"];

const MAINTENANCE_OWNERS = ["You / your team", "Deebo", "Not sure yet"];

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  website: string;
  referralSource: string;
  projectTypes: string[];
  projectSummary: string;
  projectDetails: string;
  features: string[];
  designStatus: string;
  existingSystems: string;
  budgetRange: string;
  timeline: string;
  engagementType: string;
  businessStage: string;
  targetAudience: string;
  successDefinition: string;
  replacingExisting: string;
  complianceNeeds: string;
  maintenanceOwner: string;
  stakeholders: string;
  additionalNotes: string;
  consent: boolean;
  companyFax: string; // honeypot
};

const initialState: FormState = {
  fullName: "",
  email: "",
  phone: "",
  company: "",
  website: "",
  referralSource: "",
  projectTypes: [],
  projectSummary: "",
  projectDetails: "",
  features: [],
  designStatus: "",
  existingSystems: "",
  budgetRange: "",
  timeline: "",
  engagementType: "",
  businessStage: "",
  targetAudience: "",
  successDefinition: "",
  replacingExisting: "",
  complianceNeeds: "",
  maintenanceOwner: "",
  stakeholders: "",
  additionalNotes: "",
  consent: false,
  companyFax: "",
};

const STEPS = [
  { id: "about", title: "About you", hint: "Who we'll be talking to." },
  { id: "build", title: "What you want built", hint: "The shape of the project." },
  { id: "scope", title: "Features & scope", hint: "What it needs to do." },
  { id: "budget", title: "Budget & timeline", hint: "So we can scope it realistically." },
  { id: "context", title: "Context", hint: "The things that make the difference." },
  { id: "review", title: "Review & send", hint: "One last look." },
];

function ChipGroup({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {options.map((option) => {
        const active = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            aria-pressed={active}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              active
                ? "border-primary bg-primary/15 text-primary"
                : "border-border bg-secondary/40 text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function OptionRow({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {options.map((option) => {
        const active = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(active ? "" : option)}
            aria-pressed={active}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              active
                ? "border-primary bg-primary/15 text-primary"
                : "border-border bg-secondary/40 text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function FieldLabel({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <Label className="flex items-center gap-2 text-sm font-medium">
      {children}
      {optional && <span className="text-xs font-normal text-muted-foreground/60">Optional</span>}
    </Label>
  );
}

const Start = () => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const toggleInArray = (key: "projectTypes" | "features", value: string) => {
    setForm((prev) => {
      const list = prev[key];
      const next = list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
      return { ...prev, [key]: next };
    });
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const progress = useMemo(() => Math.round(((step + 1) / STEPS.length) * 100), [step]);

  const validateStep = (current: number) => {
    const next: Partial<Record<keyof FormState, string>> = {};

    if (current === 0) {
      if (!form.fullName.trim()) next.fullName = "Please tell us your name.";
      if (!emailPattern.test(form.email.trim())) next.email = "Enter a valid email address.";
    }

    if (current === 1) {
      if (form.projectTypes.length === 0) next.projectTypes = "Pick at least one — even “Not sure yet” helps.";
      if (!form.projectSummary.trim()) next.projectSummary = "A one-line summary helps us understand the idea.";
    }

    if (current === 3) {
      if (!form.budgetRange) next.budgetRange = "Choose a budget range so we can scope realistically.";
      if (!form.timeline) next.timeline = "Let us know your timeline.";
    }

    if (current === 5) {
      if (!form.consent) next.consent = "Please confirm you're happy for us to get in touch.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) {
      toast.error("Please complete the highlighted fields.");
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    setStep((s) => Math.max(s - 1, 0));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    // Re-validate every gated step so a user who jumped around can't skip required fields.
    for (let i = 0; i < STEPS.length; i += 1) {
      if (!validateStep(i)) {
        setStep(i);
        toast.error("Please complete the highlighted fields.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/project-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          sourcePage: typeof window === "undefined" ? "/start" : window.location.href,
        }),
      });

      const result = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error ?? "Something went wrong sending your request.");
      }

      setSubmitted(true);
      toast.success("Your project request was sent.");
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen">
        <Navbar />
        {/* Plain div (not Reveal) so the confirmation is always visible the moment it renders —
            a scroll-reveal wrapper here can leave the whole screen blank if its observer
            doesn't fire after the submit state change. */}
        <section className="pt-36 pb-28">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl rounded-3xl border border-border/70 bg-card p-10 text-center">
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Check className="h-7 w-7" />
              </div>
              <h1 className="text-3xl font-bold">Thank you — we've received your request.</h1>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                We sent a confirmation to <span className="text-foreground">{form.email}</span> and your
                details are with our team. You'll usually hear back within one to two business days. If you
                want to add anything, just reply to that email or write to {DEEBOAI_CONTACT_EMAIL}.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/">Back to home</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/products">See our work</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="pt-32 pb-12 bg-gradient-to-b from-background to-secondary/30">
        <div className="container mx-auto px-4">
          <Reveal className="mx-auto max-w-3xl text-center space-y-5">
            <h1 className="text-4xl md:text-5xl font-bold">Start a project</h1>
            <p className="text-lg text-muted-foreground">
              Tell us what you're trying to build. The more you share, the more useful and specific our
              first response will be. It takes about five minutes — there are no wrong answers.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="pb-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            {/* Progress */}
            <div className="mb-8">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="font-medium">
                  Step {step + 1} of {STEPS.length} · {STEPS[step].title}
                </span>
                <span className="text-muted-foreground">{progress}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-border/70 bg-card p-7 sm:p-9">
              <div className="mb-7">
                <h2 className="text-2xl font-bold">{STEPS[step].title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{STEPS[step].hint}</p>
              </div>

              {/* Honeypot */}
              <div className="hidden" aria-hidden="true">
                <label htmlFor="companyFax">Company fax</label>
                <input
                  id="companyFax"
                  name="companyFax"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.companyFax}
                  onChange={(e) => set("companyFax", e.target.value)}
                />
              </div>

              {/* Step 0 — About you */}
              {step === 0 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <FieldLabel>Name</FieldLabel>
                      <Input
                        value={form.fullName}
                        placeholder="Your name"
                        onChange={(e) => set("fullName", e.target.value)}
                        aria-invalid={Boolean(errors.fullName)}
                      />
                      {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                    </div>
                    <div className="space-y-2">
                      <FieldLabel>Email</FieldLabel>
                      <Input
                        type="email"
                        value={form.email}
                        placeholder="you@company.com"
                        onChange={(e) => set("email", e.target.value)}
                        aria-invalid={Boolean(errors.email)}
                      />
                      {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                    </div>
                    <div className="space-y-2">
                      <FieldLabel optional>Phone</FieldLabel>
                      <Input
                        type="tel"
                        value={form.phone}
                        placeholder="(555) 123-4567"
                        onChange={(e) => set("phone", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel optional>Company</FieldLabel>
                      <Input
                        value={form.company}
                        placeholder="Company or brand"
                        onChange={(e) => set("company", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel optional>Current website</FieldLabel>
                      <Input
                        value={form.website}
                        placeholder="https://"
                        onChange={(e) => set("website", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel optional>How did you hear about us?</FieldLabel>
                      <Input
                        value={form.referralSource}
                        placeholder="Referral, search, social…"
                        onChange={(e) => set("referralSource", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1 — What you want built */}
              {step === 1 && (
                <div className="space-y-7">
                  <div className="space-y-3">
                    <FieldLabel>What do you want built? Pick all that apply.</FieldLabel>
                    <ChipGroup
                      options={PROJECT_TYPES}
                      selected={form.projectTypes}
                      onToggle={(value) => toggleInArray("projectTypes", value)}
                    />
                    {errors.projectTypes && <p className="text-sm text-destructive">{errors.projectTypes}</p>}
                  </div>
                  <div className="space-y-2">
                    <FieldLabel>Describe it in one line.</FieldLabel>
                    <Input
                      value={form.projectSummary}
                      placeholder="e.g. A booking site for my cleaning business"
                      onChange={(e) => set("projectSummary", e.target.value)}
                      aria-invalid={Boolean(errors.projectSummary)}
                    />
                    {errors.projectSummary && (
                      <p className="text-sm text-destructive">{errors.projectSummary}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <FieldLabel optional>Tell us more about the idea.</FieldLabel>
                    <Textarea
                      rows={5}
                      value={form.projectDetails}
                      placeholder="What problem are you solving? What should it do? Anything you've already tried?"
                      onChange={(e) => set("projectDetails", e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Step 2 — Features & scope */}
              {step === 2 && (
                <div className="space-y-7">
                  <div className="space-y-3">
                    <FieldLabel optional>Which features do you think you'll need?</FieldLabel>
                    <ChipGroup
                      options={FEATURES}
                      selected={form.features}
                      onToggle={(value) => toggleInArray("features", value)}
                    />
                  </div>
                  <div className="space-y-3">
                    <FieldLabel optional>Do you have designs already?</FieldLabel>
                    <OptionRow
                      options={DESIGN_STATUS}
                      value={form.designStatus}
                      onChange={(value) => set("designStatus", value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <FieldLabel optional>Any existing tools or systems this needs to work with?</FieldLabel>
                    <Textarea
                      rows={3}
                      value={form.existingSystems}
                      placeholder="e.g. Stripe, QuickBooks, a CRM, an existing database…"
                      onChange={(e) => set("existingSystems", e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Step 3 — Budget & timeline */}
              {step === 3 && (
                <div className="space-y-7">
                  <div className="space-y-3">
                    <FieldLabel>What's your budget range?</FieldLabel>
                    <OptionRow
                      options={BUDGET_RANGES}
                      value={form.budgetRange}
                      onChange={(value) => set("budgetRange", value)}
                    />
                    {errors.budgetRange && <p className="text-sm text-destructive">{errors.budgetRange}</p>}
                  </div>
                  <div className="space-y-3">
                    <FieldLabel>What's your timeline?</FieldLabel>
                    <OptionRow
                      options={TIMELINES}
                      value={form.timeline}
                      onChange={(value) => set("timeline", value)}
                    />
                    {errors.timeline && <p className="text-sm text-destructive">{errors.timeline}</p>}
                  </div>
                  <div className="space-y-3">
                    <FieldLabel optional>What kind of engagement are you after?</FieldLabel>
                    <OptionRow
                      options={ENGAGEMENT_TYPES}
                      value={form.engagementType}
                      onChange={(value) => set("engagementType", value)}
                    />
                  </div>
                  <div className="space-y-3">
                    <FieldLabel optional>Is this for…</FieldLabel>
                    <OptionRow
                      options={BUSINESS_STAGES}
                      value={form.businessStage}
                      onChange={(value) => set("businessStage", value)}
                    />
                  </div>
                </div>
              )}

              {/* Step 4 — Context */}
              {step === 4 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <FieldLabel optional>Who are your users or customers?</FieldLabel>
                    <Textarea
                      rows={2}
                      value={form.targetAudience}
                      placeholder="Who is this for?"
                      onChange={(e) => set("targetAudience", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <FieldLabel optional>What would success look like in six months?</FieldLabel>
                    <Textarea
                      rows={2}
                      value={form.successDefinition}
                      placeholder="The real goal behind the build."
                      onChange={(e) => set("successDefinition", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <FieldLabel optional>Are you replacing something that exists today?</FieldLabel>
                    <Textarea
                      rows={2}
                      value={form.replacingExisting}
                      placeholder="What's there now, and what's wrong with it?"
                      onChange={(e) => set("replacingExisting", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <FieldLabel optional>Any compliance or regulatory needs?</FieldLabel>
                      <Input
                        value={form.complianceNeeds}
                        placeholder="e.g. HIPAA, accessibility, PCI…"
                        onChange={(e) => set("complianceNeeds", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel optional>Who maintains it after launch?</FieldLabel>
                      <OptionRow
                        options={MAINTENANCE_OWNERS}
                        value={form.maintenanceOwner}
                        onChange={(value) => set("maintenanceOwner", value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <FieldLabel optional>Who else is involved in the decision?</FieldLabel>
                    <Input
                      value={form.stakeholders}
                      placeholder="Decision-makers, stakeholders, partners…"
                      onChange={(e) => set("stakeholders", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <FieldLabel optional>Anything else we should know?</FieldLabel>
                    <Textarea
                      rows={3}
                      value={form.additionalNotes}
                      placeholder="Anything we didn't ask about."
                      onChange={(e) => set("additionalNotes", e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Step 5 — Review */}
              {step === 5 && (
                <div className="space-y-6">
                  <p className="text-sm text-muted-foreground">
                    Quick recap before you send. You can go back to any step to edit.
                  </p>
                  <dl className="divide-y divide-border/60 rounded-2xl border border-border/60 bg-background/40">
                    {[
                      ["Name", form.fullName],
                      ["Email", form.email],
                      ["Company", form.company],
                      ["What you want built", form.projectTypes.join(", ")],
                      ["Summary", form.projectSummary],
                      ["Features", form.features.join(", ")],
                      ["Budget", form.budgetRange],
                      ["Timeline", form.timeline],
                      ["Engagement", form.engagementType],
                    ]
                      .filter(([, value]) => value && String(value).trim())
                      .map(([label, value]) => (
                        <div key={label} className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:gap-4">
                          <dt className="w-48 shrink-0 text-sm font-medium text-muted-foreground">{label}</dt>
                          <dd className="text-sm text-foreground">{value}</dd>
                        </div>
                      ))}
                  </dl>

                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border/60 bg-background/40 p-4">
                    <Checkbox
                      checked={form.consent}
                      onCheckedChange={(checked) => set("consent", checked === true)}
                      className="mt-0.5"
                    />
                    <span className="text-sm text-muted-foreground">
                      I'm happy for the Deebo team to contact me about this project at the email and phone
                      number I provided.
                    </span>
                  </label>
                  {errors.consent && <p className="text-sm text-destructive">{errors.consent}</p>}
                </div>
              )}

              {/* Navigation */}
              <div className="mt-9 flex items-center justify-between gap-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={goBack}
                  disabled={step === 0 || isSubmitting}
                  className={step === 0 ? "invisible" : ""}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>

                {step < STEPS.length - 1 ? (
                  <Button type="button" onClick={goNext}>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="button" onClick={handleSubmit} disabled={isSubmitting} aria-busy={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      "Send project request"
                    )}
                  </Button>
                )}
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Prefer a quick note instead?{" "}
              <Link href="/contact" className="text-primary hover:underline">
                Use the contact form
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Start;
