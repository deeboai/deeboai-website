"use client";

import { AdminShell } from "@/features/admin/components/admin-shell";
import { SectionCard } from "@/features/admin/components/section-card";

type HelpPageProps = {
  userEmail: string;
};

const PAGE_GUIDES = [
  {
    title: "Dashboard",
    description:
      "This is the summary layer. It rolls up W-2 paychecks, self-employment income, business expenses, mileage, tax reserves, and personal cash flow into year-to-date, monthly, and quarterly views.",
  },
  {
    title: "Income",
    description:
      "Use this for self-employment money coming in. Each tutoring payout, consulting invoice, website deposit, or final payment should be its own entry.",
  },
  {
    title: "W-2 Paychecks",
    description:
      "Use this for your job paychecks. Enter gross pay, federal withholding, state withholding, and take-home pay for each paycheck so the app can track real payroll cash flow and tax coverage.",
  },
  {
    title: "Expenses",
    description:
      "Use this for business spending. Each software bill, phone bill, bank fee, contractor payment, equipment purchase, or other deductible business expense should be entered separately.",
  },
  {
    title: "Mileage",
    description:
      "Use this for business driving only. Each trip should be its own row with date, purpose, route, and miles. The app applies the business mileage rate for that tax year unless you override it.",
  },
  {
    title: "Personal Cash Flow",
    description:
      "Use this for rent, utilities, groceries, insurance, internet, parking, subscriptions, and other living costs. This keeps personal cash flow separate from business deductions while still feeding the home-office calculator.",
  },
  {
    title: "Tax Reserves",
    description:
      "Use this to track money you want to set aside for taxes and also to record actual IRS or state estimated-tax payments. A reserve transfer is not automatically treated as a tax payment unless you mark it that way.",
  },
  {
    title: "Tax Planning",
    description:
      "Use this once you have filed the prior year's return. It calculates quarterly-risk alerts from prior-year tax numbers, your current-year W-2 withholding, and any reserve entries that were actual tax payments.",
  },
  {
    title: "Assets",
    description:
      "Use this for larger business purchases such as laptops, monitors, cameras, desks, and other equipment that you want tracked separately from routine expenses.",
  },
  {
    title: "Settings",
    description:
      "Use this for profile details, fallback defaults, and business setup. Most day-to-day activity should go into the entry pages instead of Settings.",
  },
] as const;

const OPERATING_RULES = [
  "Enter events as they happen instead of waiting until the end of the month.",
  "One payment, one expense, one trip, and one paycheck should usually mean one row.",
  "Use actual dates so the dashboard, month summaries, quarter summaries, and tax-year summaries stay accurate.",
  "When something changes by state, the entry date and the state context should reflect what was true at that time.",
  "Use Settings only for fallback assumptions. If you have actual entries, the app should be driven by those entries.",
] as const;

const HOME_OFFICE_RULES = [
  "Enter rent, utilities, internet, insurance, and home maintenance in Personal Cash Flow throughout the year.",
  "Enter home square footage, office square footage, qualifying months, and direct office-only costs on Tax Planning.",
  "The app then calculates business-use percentage, rent allocation, utilities allocation, internet allocation, insurance allocation, and maintenance allocation for the selected tax year.",
  "The simplified and regular home-office methods are shown side by side so you can compare them.",
] as const;

const TAX_ALERT_RULES = [
  "Quarterly-risk alerts are planning alerts. They are there to tell you when you may be under-covered relative to the saved planning inputs.",
  "W-2 salary is not what drives the tax-risk calculation. W-2 withholding is what matters.",
  "Federal and state alerts improve as you enter actual W-2 paycheck data and actual tax payments.",
  "After you file each tax return, update Tax Planning with the prior-year tax numbers so the next year's risk alerts are using fresh data.",
] as const;

const GET_STARTED_STEPS = [
  "Backfill every 2026 W-2 paycheck you have received so far.",
  "Backfill 2026 personal living costs such as rent, electricity, utilities, internet, insurance, and home maintenance.",
  "Backfill 2026 self-employment income, business expenses, mileage trips, and tax reserve transfers.",
  "Mark any reserve entries that were actual IRS or state estimated-tax payments.",
  "Open Tax Planning and enter the prior-year filed-return inputs once they are known.",
  "Use the Dashboard as the reading layer and the entry pages as the writing layer.",
] as const;

export function HelpPage({ userEmail }: HelpPageProps) {
  return (
    <AdminShell
      title="Help"
      subtitle="Detailed guidance on what each page does, what you should enter, and how the app turns those entries into dashboard and tax-planning outputs."
      userEmail={userEmail}
    >
      <div className="space-y-6">
        <SectionCard
          title="How This App Works"
          description="The system is event-based. It is designed so you can enter what actually happened during the year and let the app summarize it into monthly, quarterly, and yearly views."
        >
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              This app is not meant to be driven by static monthly assumptions. It is meant to be driven by real entries:
              actual paychecks, actual tutoring payouts, actual expenses, actual rent payments, actual utility bills,
              actual mileage trips, and actual reserve transfers.
            </p>
            <p>
              The main idea is simple: write data in the ledger pages, then read the rollups on the Dashboard and Tax
              Planning pages.
            </p>
          </div>
        </SectionCard>

        <SectionCard
          title="Operating Rules"
          description="These are the core habits that keep the system accurate and useful."
        >
          <div className="space-y-3 text-sm text-muted-foreground">
            {OPERATING_RULES.map((rule) => (
              <p key={rule}>{rule}</p>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="What Each Page Means"
          description="Use this as the reference for where each type of information belongs."
        >
          <div className="space-y-4">
            {PAGE_GUIDES.map((guide) => (
              <div key={guide.title} className="rounded-2xl border border-border/70 bg-background/60 p-4">
                <p className="text-sm font-medium">{guide.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{guide.description}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="grid gap-6 xl:grid-cols-2">
          <SectionCard
            title="Home Office"
            description="This part of the app is there to help you calculate the office share of your shared living costs."
          >
            <div className="space-y-3 text-sm text-muted-foreground">
              {HOME_OFFICE_RULES.map((rule) => (
                <p key={rule}>{rule}</p>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Quarterly Tax Alerts"
            description="These alerts are planning signals, not filing software."
          >
            <div className="space-y-3 text-sm text-muted-foreground">
              {TAX_ALERT_RULES.map((rule) => (
                <p key={rule}>{rule}</p>
              ))}
            </div>
          </SectionCard>
        </div>

        <SectionCard
          title="What To Enter Right Now"
          description="If you are starting mid-year, this is the order that gives you the fastest path to a useful dashboard."
        >
          <div className="space-y-3 text-sm text-muted-foreground">
            {GET_STARTED_STEPS.map((step, index) => (
              <p key={step}>
                {index + 1}. {step}
              </p>
            ))}
          </div>
        </SectionCard>
      </div>
    </AdminShell>
  );
}

