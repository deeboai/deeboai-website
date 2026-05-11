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
    pricing: "Reviewed first, then quoted",
    rationale: "Best when something is already broken or nobody knows who controls the setup.",
  },
  {
    title: "Email & Domain Setup",
    description: "For Google Workspace setup, domain verification, MX/SPF/DKIM/DMARC records, inbox setup, aliases, routing, and basic testing.",
    pricing: "Quoted after setup review",
    rationale: "Best when the business needs professional email properly connected to its domain.",
  },
  {
    title: "Website Presence Build",
    description: "For simple websites, landing pages, service pages, trust-building, and lead capture.",
    pricing: "Scoped by page count and setup needs",
    rationale: "Best when the business needs a credible online home before ongoing support begins.",
  },
  {
    title: "Custom Digital System",
    description: "For advanced forms, booking flows, payment workflows, automations, integrations, multiple websites, or custom business systems.",
    pricing: "Custom scope required",
    rationale: "Best when the website is part of a larger business workflow.",
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
    bestFor: "Simple websites that need basic maintenance, checks, and small updates",
    includes: [
      "Website health checks",
      "Basic uptime or availability checks when supported",
      "Backup checks when supported",
      "SSL/domain support tied to the website",
      "Contact form testing",
      "Up to 30 minutes/month of small edits",
    ],
  },
  {
    name: "Website + Email Care",
    standardPrice: 169,
    achPrice: 160,
    bestFor: "Websites that also need basic professional email support",
    includes: [
      "Everything in Essential Website Care",
      "Admin support for one managed Google Workspace inbox",
      "DNS/MX/SPF/DKIM/DMARC support",
      "Contact form deliverability support",
      "Simple aliases and routing for the included account",
      "Small edits up to 45 minutes/month",
      "Basic monthly website/email check",
    ],
  },
  {
    name: "Managed Presence",
    standardPrice: 295,
    achPrice: 280,
    bestFor: "Owner-led businesses that want website, form, domain, and email confidence",
    featured: true,
    includes: [
      "Everything in Website + Email Care",
      "Up to 75 minutes/month of small updates/support",
      "Priority handling ahead of entry-level plans",
      "Monthly form and key-page check",
      "Basic analytics/performance review if configured",
      "Redirects, aliases, and simple DNS changes",
      "Practical recommendations to improve clarity, trust, and lead capture",
    ],
  },
  {
    name: "Growth Support",
    standardPrice: 495,
    achPrice: 470,
    bestFor: "Businesses that need regular updates, lead-capture improvements, and light strategy support",
    includes: [
      "Everything in Managed Presence",
      "Up to 2 hours/month of small updates/support",
      "Priority request handling",
      "Monthly planning/review call if needed",
      "Form, routing, and conversion checks",
      "Light strategy guidance",
      "Small landing page and content improvements",
    ],
  },
  {
    name: "Partner Desk",
    standardPrice: 850,
    achPrice: 815,
    bestFor: "Teams with multiple stakeholders, recurring requests, and higher support needs",
    includes: [
      "Everything in Growth Support",
      "Up to 3.5 hours/month of support/change capacity",
      "Higher response priority",
      "Quarterly roadmap review",
      "Stakeholder coordination",
      "Request tracking and follow-through",
      "Practical conversion and messaging guidance",
      "Proactive risk review",
      "Recurring technical ownership",
    ],
  },
  {
    name: "Digital Ops Partner",
    standardPrice: null,
    achPrice: null,
    customPriceLabel: "Starts at $1,500+/mo",
    bestFor: "Larger teams with multiple websites, 10+ inboxes, frequent requests, integrations, or custom workflows",
    includes: [
      "Custom support capacity",
      "Custom response expectations and support process",
      "Multiple website support",
      "Larger email/admin footprint",
      "Workflow/integration monitoring",
      "Roadmap planning",
      "Monthly or biweekly review",
      "Custom reporting if needed",
    ],
    cta: "Book a consultation",
  },
];

const reliabilityItems = [
  { label: "Website live", icon: Globe2 },
  { label: "Domain connected", icon: ServerCog },
  { label: "SSL working", icon: ShieldCheck },
  { label: "Forms delivering", icon: MailCheck },
  { label: "Business email configured", icon: MailCheck },
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
  "New pages, funnels, major redesigns, or larger website changes",
  "Booking, payment, CRM, automation, or advanced integration work",
  "Email migrations, device-specific IT support, or cold email infrastructure",
  "SEO campaigns, ad landing page systems, or major copywriting projects",
  "Emergency or expedited work outside normal availability",
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
              Managed website, email, and digital presence support for businesses that cannot afford broken systems
            </h1>
            <p className="mx-auto max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              Deebo AI helps small businesses keep their website live, forms working, domain stable, and
              professional email properly configured without needing to hire a full-time technical team.
              We handle the ongoing technical ownership behind your digital presence, so customers can
              reach you and your business stays credible.
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
              Most small businesses do not need a full-time IT or web team. They do need someone
              responsible when the website goes down, forms stop delivering, email records break,
              SSL expires, or nobody knows how the domain is configured.
            </p>
          </Reveal>

          <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      <section id="monthly-plans" className="scroll-mt-24 py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <Reveal className="mx-auto max-w-4xl text-center">
            <h2 className="mb-5 text-3xl font-bold md:text-4xl">Monthly plans for ongoing support</h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              If your website and business communication systems are already live, monthly support
              can keep them maintained, reachable, and under control. Email-supported plans can
              include one basic Google Workspace user when Deebo manages your professional email.
              Extra users, migrations, upgraded Workspace tiers, and special routing needs are
              quoted separately.
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
                        {selectedCommitment.discount > 0 || selectedCommitment.prepaid ? (
                          <p className="text-sm font-medium text-primary">With selected commitment:</p>
                        ) : null}
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm text-muted-foreground">Card</p>
                              <p className="text-2xl font-bold">
                                {formatCurrency(adjustedCardPrice ?? plan.standardPrice)}/mo
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">ACH/bank</p>
                              <p className="text-2xl font-bold">
                                {formatCurrency(adjustedAchPrice ?? plan.achPrice ?? 0)}/mo
                              </p>
                            </div>
                          </div>
                          <CreditCard className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          {prepaidTotal !== null && (
                            <p className="mt-2 text-sm text-primary">
                              Estimated prepaid Deebo service total: {formatCurrency(prepaidTotal)}
                            </p>
                          )}
                        </div>
                      </>
                    )}
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

      <section className="py-24">
        <div className="container mx-auto px-4">
          <Reveal className="mx-auto max-w-4xl text-center">
            <h2 className="mb-5 text-3xl font-bold md:text-4xl">Initial project pathways</h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              One-time setup, rescue work, and larger builds are reviewed before quoting so the
              next step matches the current setup, access situation, and business need.
            </p>
          </Reveal>

          <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {projectPathways.map((pathway, index) => (
              <Reveal key={pathway.title} delayMs={index * 35} className="rounded-xl border border-border bg-card p-6">
                <h3 className="mb-3 text-xl font-semibold">{pathway.title}</h3>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{pathway.description}</p>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary/80">
                  How pricing works
                </p>
                <p className="mb-4 text-sm font-medium">{pathway.pricing}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{pathway.rationale}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <Reveal className="mx-auto max-w-4xl text-center">
            <h2 className="mb-5 text-3xl font-bold md:text-4xl">What monthly support covers</h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Monthly support is for routine reliability, small updates, and ongoing technical help.
              Larger builds, urgent deadlines, new workflows, and deeper technical work are quoted
              separately before work begins.
            </p>
          </Reveal>

          <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-2">
            <Reveal className="rounded-2xl border border-border bg-card p-8">
              <h3 className="mb-6 text-2xl font-semibold">Included in monthly support</h3>
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
              <h3 className="mb-6 text-2xl font-semibold">Quoted separately</h3>
              <div className="grid grid-cols-1 gap-3">
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

      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-[1fr_1.2fr]">
            <Reveal variant="left" className="space-y-5">
              <h2 className="text-3xl font-bold md:text-4xl">How email ownership works</h2>
              <p className="text-lg leading-relaxed text-muted-foreground">
                Clients keep ownership of their domain and Google Workspace account. Deebo can be
                added as an admin to help with setup, billing coordination, DNS, routing, and support.
              </p>
            </Reveal>
            <Reveal variant="right" className="rounded-2xl border border-border bg-card p-8">
              <ul className="space-y-4 text-muted-foreground">
                {[
                  "The client owns the domain and Google Workspace account.",
                  "Deebo may be added as an admin for setup, DNS, billing coordination, routing, and support.",
                  "Email-supported plans can include one basic Google Workspace user when Deebo manages professional email.",
                  "Additional users, migrations, upgraded Workspace tiers, employee device support, Outlook-specific troubleshooting, and cold email infrastructure are quoted separately.",
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
          <Reveal className="mx-auto max-w-3xl space-y-6 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Not sure what level of support you need?</h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Book a consultation. We will review your current setup and recommend the lowest
              sensible plan or project path for what your business actually needs.
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
