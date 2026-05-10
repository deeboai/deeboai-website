"use client";

import Link from "next/link";
import {
  CheckCircle2,
  CreditCard,
  Globe2,
  MailCheck,
  ServerCog,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { useMemo, useState } from "react";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { GOOGLE_APPOINTMENT_SCHEDULING_URL } from "@/lib/contact";

type CommitmentOption = {
  id: string;
  label: string;
  discount: number;
  months: number;
  prepaid: boolean;
};

type ManagedPlan = {
  name: string;
  standardPrice: number | null;
  achPrice: number | null;
  customPriceLabel?: string;
  bestFor: string;
  includes: string[];
  excludes?: string[];
  note?: string;
  cta?: string;
  featured?: boolean;
};

const projectPathways = [
  {
    title: "Rescue Diagnostic",
    description: "For broken websites, email issues, DNS confusion, SSL problems, forms not delivering, or unclear vendor/domain access.",
    pricing: "Scoped after review",
    rationale: "The right fix depends on the current setup, access situation, and business risk.",
    label: "Contact us for a scoped next step",
  },
  {
    title: "Strategy Blueprint",
    description: "For unclear or complex projects that need planning before implementation.",
    pricing: "Planning-first engagement",
    rationale: "Best when the business needs recommendations, structure, and technical direction before implementation.",
    label: "Recommended before complex builds",
  },
  {
    title: "Email Setup Only",
    description: "For Google Workspace setup, domain verification, MX/SPF/DKIM/DMARC records, inbox setup, aliases, routing, and basic testing.",
    pricing: "Custom-scoped",
    rationale: "Final pricing depends on user count, routing needs, and the current domain or mailbox state.",
    label: "Contact us for a scoped quote",
  },
  {
    title: "Presence Launch",
    description: "For simple, credible websites or landing pages for solo operators, consultants, freelancers, and new local businesses.",
    pricing: "Scope depends on page count and setup needs",
    rationale: "Best when the business needs a professional web presence without heavier custom workflow requirements.",
    label: "Book a consultation",
  },
  {
    title: "Credibility Website",
    description: "For small businesses that need a stronger, more professional online home with service pages, trust-building, and lead capture.",
    pricing: "Custom-scoped with a clearer build range after discovery",
    rationale: "Scope increases with content volume, positioning support, and lead-capture requirements.",
    label: "Book a consultation",
  },
  {
    title: "Business Engine Website",
    description: "For businesses where the website supports leads, bookings, applications, recruiting, or trust.",
    pricing: "Consultation required",
    rationale: "Scope changes when the website becomes part of a real business workflow rather than a brochure presence.",
    label: "Book a consultation",
  },
  {
    title: "Growth System",
    description: "For companies with more content, integrations, recurring campaigns, stakeholder review, and more serious digital operations needs.",
    pricing: "Custom-scoped",
    rationale: "Complexity rises with integrations, review cycles, campaign support, and ongoing operational demands.",
    label: "Book a consultation",
  },
  {
    title: "Custom Platform",
    description: "For larger organizations, multiple departments, multiple websites, advanced forms, workflows, integrations, or custom systems.",
    pricing: "Custom scope required",
    rationale: "This work depends heavily on stakeholder count, system dependencies, workflow design, and support expectations.",
    label: "Custom scope required",
  },
];

const commitmentOptions: CommitmentOption[] = [
  { id: "monthly", label: "Monthly", discount: 0, months: 1, prepaid: false },
  { id: "6-month", label: "6-month commitment", discount: 0.05, months: 6, prepaid: false },
  { id: "12-month", label: "12-month commitment", discount: 0.1, months: 12, prepaid: false },
  { id: "annual-prepaid", label: "Annual prepaid", discount: 0.12, months: 12, prepaid: true },
];

const managedPlans: ManagedPlan[] = [
  {
    name: "Essential Website Care",
    standardPrice: 99,
    achPrice: 95,
    bestFor: "Simple websites with no business email responsibility",
    includes: [
      "Website health checks",
      "Basic monitoring where applicable",
      "Backups where applicable",
      "SSL/domain support tied to the website",
      "Contact form check",
      "Small edits up to 30 minutes/month",
    ],
    excludes: [
      "Google Workspace",
      "Inboxes",
      "Mailbox support",
      "New pages",
      "Redesigns",
      "Integrations",
      "Urgent support",
      "Employee IT support",
    ],
  },
  {
    name: "Website + Email Care",
    standardPrice: 169,
    achPrice: 160,
    bestFor: "Website plus basic professional email handling",
    includes: [
      "Everything in Essential Website Care",
      "One managed Google Workspace inbox admin support",
      "DNS/MX/SPF/DKIM/DMARC support",
      "Contact form deliverability support",
      "Aliases/routing within reason",
      "Small edits up to 45 minutes/month",
      "Basic monthly website/email check",
    ],
    note:
      "Includes one basic Google Workspace user when Deebo is managing professional email. Additional users, upgraded Workspace tiers, and special routing needs are priced in the quote.",
  },
  {
    name: "Managed Presence",
    standardPrice: 295,
    achPrice: 280,
    bestFor: "Real small businesses that want website, forms, domain, and email confidence",
    featured: true,
    includes: [
      "Everything in Website + Email Care",
      "Up to 75 minutes/month of small updates/support",
      "Higher priority than lower plans",
      "Monthly form and key-page check",
      "Basic analytics/performance review if configured",
      "Redirects, aliases, and simple DNS changes",
      "Light UX/content/trust recommendations",
    ],
    note:
      "Includes one basic Google Workspace user when Deebo is managing professional email. Additional users, upgraded Workspace tiers, and special routing needs are priced in the quote.",
  },
  {
    name: "Growth Support",
    standardPrice: 495,
    achPrice: 470,
    bestFor: "Businesses that need regular updates and lead-generation support",
    includes: [
      "Everything in Managed Presence",
      "Up to 2 hours/month of small updates/support",
      "Stronger priority handling",
      "Monthly planning/review call if needed",
      "Form, routing, and conversion checks",
      "Light strategy guidance",
      "Basic landing page/content improvements",
    ],
    note: "Includes one basic Google Workspace user when Deebo is managing professional email. Additional users and upgraded Workspace tiers are quoted separately.",
  },
  {
    name: "Partner Desk",
    standardPrice: 850,
    achPrice: 815,
    bestFor: "Teams with multiple stakeholders and priority support needs",
    includes: [
      "Everything in Growth Support",
      "Up to 3.5 hours/month of support/change capacity",
      "Higher response priority",
      "Quarterly roadmap review",
      "Stakeholder coordination",
      "Support queue management",
      "Light conversion and messaging guidance",
      "Proactive risk review",
      "Recurring technical ownership",
    ],
  },
  {
    name: "Digital Ops Partner",
    standardPrice: null,
    achPrice: null,
    customPriceLabel: "Starts at $1,500+/mo",
    bestFor: "Larger teams, multiple websites, 10+ inboxes, frequent requests, integrations, or custom workflows",
    includes: [
      "Custom support capacity",
      "Custom response expectations",
      "Multiple website support",
      "Larger email/admin footprint",
      "Workflow/integration monitoring",
      "Roadmap planning",
      "Monthly or biweekly review",
      "Custom reporting if needed",
    ],
    cta: "Book a consultation",
    note: "Always custom scoped.",
  },
];

const reliabilityItems = [
  { label: "Website live", icon: Globe2 },
  { label: "Domain connected", icon: ServerCog },
  { label: "SSL working", icon: ShieldCheck },
  { label: "Forms delivering", icon: MailCheck },
  { label: "Business email configured", icon: MailCheck },
  { label: "DNS stable", icon: ServerCog },
  { label: "Customers can reach you", icon: CheckCircle2 },
  { label: "Technical ownership", icon: SlidersHorizontal },
];

const includedSupport = [
  "Small text changes",
  "Image swaps",
  "Contact information updates",
  "Small layout tweaks",
  "DNS checks",
  "Form testing",
  "Aliases/routing",
  "Small troubleshooting",
  "Minor content updates",
];

const separatelyQuoted = [
  "New pages",
  "Redesigns",
  "New funnels",
  "Booking/payment workflows",
  "CRM setup",
  "Automations",
  "Advanced integrations",
  "Email migrations",
  "Device-specific IT support",
  "Cold email infrastructure",
  "SEO campaigns",
  "Ad landing page systems",
  "Copywriting-heavy work",
  "Emergency support outside normal availability",
];

const scopedWorkExamples = [
  "One-off website changes that exceed monthly support capacity",
  "Strategy, technical planning, and vendor coordination",
  "Emergency or expedited support outside normal availability",
  "Mini projects such as new sections, landing pages, or cleanup work",
  "Larger builds, integrations, migrations, automations, or custom workflows",
  "Campaign, SEO, ad landing page, or copywriting-heavy work",
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function calculateDiscountedPrice(price: number, discount: number) {
  return Math.round(price * (1 - discount));
}

const ManagedPresence = () => {
  const [selectedCommitmentId, setSelectedCommitmentId] = useState(commitmentOptions[0].id);
  const selectedCommitment = useMemo(
    () => commitmentOptions.find((option) => option.id === selectedCommitmentId) ?? commitmentOptions[0],
    [selectedCommitmentId],
  );

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="pt-32 pb-16 bg-gradient-to-b from-background to-secondary/30">
        <div className="container mx-auto px-4">
          <Reveal className="mx-auto max-w-4xl space-y-8 text-center">
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
              Managed website, email, and digital presence support for businesses that need things to keep working
            </h1>
            <p className="mx-auto max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              Deebo AI helps businesses keep their website, domain, forms, and professional email
              setup stable, supported, and technically owned through clear monthly service plans.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button asChild size="lg">
                <a href={GOOGLE_APPOINTMENT_SCHEDULING_URL} target="_blank" rel="noreferrer">
                  Book a consultation
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#monthly-plans">Compare monthly plans</a>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4">
          <Reveal className="mx-auto max-w-4xl text-center">
            <h2 className="mb-5 text-3xl font-bold md:text-4xl">Why businesses choose this</h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Most businesses do not need a full-time technical team. They do need someone who can
              keep the website current, the forms working, the domain stable, and the business
              reachable when something breaks or needs attention.
            </p>
          </Reveal>

          <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {reliabilityItems.map((item, index) => (
              <Reveal
                key={item.label}
                delayMs={index * 35}
                className="rounded-xl border border-border bg-card p-5 hover-lift"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="font-medium">{item.label}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <Reveal className="mx-auto max-w-4xl text-center">
            <h2 className="mb-5 text-3xl font-bold md:text-4xl">Initial project pathways</h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Consultations, diagnostics, builds, rescue work, and custom platforms are scoped based
              on complexity, urgency, and business risk. The goal is to make the next step clear,
              not vague.
            </p>
          </Reveal>

          <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {projectPathways.map((pathway, index) => (
              <Reveal key={pathway.title} delayMs={index * 35} className="rounded-xl border border-border bg-card p-6">
                <h3 className="mb-3 text-xl font-semibold">{pathway.title}</h3>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{pathway.description}</p>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary/80">
                  Pricing posture
                </p>
                <p className="mb-4 text-sm text-muted-foreground">{pathway.pricing}</p>
                <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{pathway.rationale}</p>
                <p className="text-sm font-medium text-primary">{pathway.label}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="monthly-plans" className="scroll-mt-24 py-24">
        <div className="container mx-auto px-4">
          <Reveal className="mx-auto max-w-4xl text-center">
            <h2 className="mb-5 text-3xl font-bold md:text-4xl">Monthly plans for ongoing support</h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              If your website and business communication systems are already live, monthly support
              can be the simplest way to keep everything maintained, reachable, and under control.
              Email-supported plans include one basic Google Workspace user unless your quote says
              otherwise, and discounts apply to the managed service portion of the plan.
            </p>
          </Reveal>

          <Reveal className="mx-auto mt-10 max-w-5xl rounded-2xl border border-border bg-card p-4">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {commitmentOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedCommitmentId(option.id)}
                  className={`rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                    selectedCommitmentId === option.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-secondary/40 text-muted-foreground hover:border-primary/60 hover:text-foreground"
                  }`}
                  aria-pressed={selectedCommitmentId === option.id}
                >
                  <span className="block font-medium">{option.label}</span>
                  <span className="mt-1 block text-xs">
                    {option.discount === 0 ? "No discount" : `${Math.round(option.discount * 100)}% off service fee`}
                  </span>
                </button>
              ))}
            </div>
          </Reveal>

          <div className="mx-auto mt-12 grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {managedPlans.map((plan, index) => {
              // Discounts are intentionally calculated only from Deebo's service fee; Workspace and third-party
              // software stay outside the plan math because those costs are owned by outside vendors.
              const adjustedCardPrice =
                plan.standardPrice === null ? null : calculateDiscountedPrice(plan.standardPrice, selectedCommitment.discount);
              const adjustedAchPrice =
                plan.achPrice === null ? null : calculateDiscountedPrice(plan.achPrice, selectedCommitment.discount);
              const prepaidTotal =
                selectedCommitment.prepaid && adjustedAchPrice !== null
                  ? adjustedAchPrice * selectedCommitment.months
                  : null;

              return (
                <Reveal
                  key={plan.name}
                  delayMs={index * 45}
                  className={`relative rounded-2xl border bg-card p-7 ${
                    plan.featured ? "border-primary shadow-lg shadow-primary/10" : "border-border"
                  }`}
                >
                  {plan.featured && (
                    <div className="absolute right-5 top-5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      Most common
                    </div>
                  )}
                  <div className="pr-24">
                    <h3 className="mb-2 text-2xl font-bold">{plan.name}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{plan.bestFor}</p>
                  </div>

                  <div className="my-6 space-y-3 rounded-xl bg-secondary/50 p-5">
                    {plan.standardPrice === null ? (
                      <div>
                        <p className="text-sm text-muted-foreground">Custom support scope</p>
                        <p className="mt-1 text-3xl font-bold">{plan.customPriceLabel}</p>
                        <p className="mt-2 text-sm text-primary">Custom scope required</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Card price</p>
                            <p className="text-2xl font-bold">{formatCurrency(plan.standardPrice)}/mo</p>
                          </div>
                          <CreditCard className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">ACH / bank price</p>
                          <p className="text-2xl font-bold">{formatCurrency(plan.achPrice ?? 0)}/mo</p>
                        </div>
                        <div className="border-t border-border pt-3">
                          <p className="text-sm text-muted-foreground">Commitment-adjusted monthly service price</p>
                          <p className="text-xl font-semibold">
                            {formatCurrency(adjustedCardPrice ?? 0)}/mo standard card ·{" "}
                            {formatCurrency(adjustedAchPrice ?? 0)}/mo ACH/bank
                          </p>
                          {prepaidTotal !== null && (
                            <p className="mt-2 text-sm text-primary">
                              Estimated prepaid Deebo service total: {formatCurrency(prepaidTotal)}
                            </p>
                          )}
                        </div>
                      </>
                    )}
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Email-supported plans include one basic Google Workspace user unless the final quote says otherwise.
                    </p>
                  </div>

                  <div>
                    <p className="mb-3 text-sm font-semibold">Includes</p>
                    <ul className="space-y-2">
                      {plan.includes.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {plan.excludes && (
                    <div className="mt-6">
                      <p className="mb-3 text-sm font-semibold">Does not include</p>
                      <ul className="space-y-2">
                        {plan.excludes.map((item) => (
                          <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-muted-foreground/60" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {plan.note && <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{plan.note}</p>}

                  <Button asChild className="mt-7 w-full" variant={plan.featured ? "default" : "outline"}>
                    <a href={GOOGLE_APPOINTMENT_SCHEDULING_URL} target="_blank" rel="noreferrer">
                      {plan.cta ?? "Book a consultation"}
                    </a>
                  </Button>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-[1fr_1.2fr]">
            <Reveal variant="left" className="space-y-5">
              <h2 className="text-3xl font-bold md:text-4xl">Google Workspace ownership stays clear</h2>
              <p className="text-lg leading-relaxed text-muted-foreground">
                Clients keep ownership of their domain and Google Workspace account. For plans that include email
                support, Deebo can cover and manage one basic Google Workspace user as part of the quoted monthly plan.
              </p>
            </Reveal>
            <Reveal variant="right" className="rounded-2xl border border-border bg-card p-8">
              <ul className="space-y-4 text-muted-foreground">
                {[
                  "The client owns the domain and Google Workspace account so the business keeps long-term control.",
                  "Deebo may be added as an admin for setup, billing coordination, DNS records, routing, and support.",
                  "Eligible email-support plans include one basic Google Workspace user unless the final quote says otherwise.",
                  "Additional users are added at the quoted per-user price.",
                  "Higher-tier Google Workspace subscriptions, migrations, employee device support, Outlook-specific troubleshooting, and cold email infrastructure are separately quoted.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <MailCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4">
          <Reveal className="mx-auto max-w-4xl text-center">
            <h2 className="mb-5 text-3xl font-bold md:text-4xl">What monthly support covers and what gets scoped separately</h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Monthly support is designed for routine reliability, small changes, and ongoing
              technical help. Larger requests are scoped separately when the size, urgency,
              complexity, or business risk changes.
            </p>
          </Reveal>

          <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-2">
            <Reveal className="rounded-2xl border border-border bg-card p-8">
              <h3 className="mb-6 text-2xl font-semibold">Included monthly support may include</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {includedSupport.map((item) => (
                  <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal className="rounded-2xl border border-border bg-card p-8">
              <h3 className="mb-6 text-2xl font-semibold">Not included unless separately quoted</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {separatelyQuoted.map((item) => (
                  <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-muted-foreground/60" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <Reveal variant="left" className="space-y-5">
              <h2 className="text-3xl font-bold md:text-4xl">When work becomes a separate project</h2>
              <p className="text-lg leading-relaxed text-muted-foreground">
                Some requests stop being routine support because they involve larger build effort,
                tighter deadlines, more stakeholders, or deeper technical dependencies. When that
                happens, the work is scoped separately so expectations stay clear.
              </p>
            </Reveal>
            <Reveal variant="right" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {scopedWorkExamples.map((item) => (
                <div key={item} className="rounded-xl border border-border bg-card p-5">
                  <SlidersHorizontal className="mb-4 h-5 w-5 text-primary" />
                  <p className="font-medium">{item}</p>
                </div>
              ))}
            </Reveal>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4">
          <Reveal className="mx-auto max-w-3xl space-y-6 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Need help choosing the right level of support?</h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Book a consultation and we&apos;ll recommend the lowest sensible plan or project path
              based on what your business actually needs.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button asChild size="lg">
                <a href={GOOGLE_APPOINTMENT_SCHEDULING_URL} target="_blank" rel="noreferrer">
                  Book a consultation
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/contact">Send a message</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ManagedPresence;
