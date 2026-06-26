import { AdminShell } from "@/features/admin/components/admin-shell";
import { EmptyState } from "@/features/admin/components/empty-state";
import { SectionCard } from "@/features/admin/components/section-card";
import { ensureAdminWorkspace } from "@/features/admin/lib/bootstrap";
import { requireAdminUser } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import {
  deleteProjectIntakeSubmission,
  setProjectIntakeStatus,
  type ProjectIntakeStatus,
} from "@/app/admin/intake/actions";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const STATUS_FLOW: ProjectIntakeStatus[] = ["new", "reviewing", "quoted", "won", "lost"];

const STATUS_LABELS: Record<ProjectIntakeStatus, string> = {
  new: "New",
  reviewing: "Reviewing",
  quoted: "Quoted",
  won: "Won",
  lost: "Lost",
};

const STATUS_BADGE: Record<ProjectIntakeStatus, string> = {
  new: "border-sky-500/30 bg-sky-500/10 text-sky-200",
  reviewing: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  quoted: "border-violet-500/30 bg-violet-500/10 text-violet-200",
  won: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  lost: "border-rose-500/30 bg-rose-500/10 text-rose-200",
};

type ProjectIntakeRow = {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  website: string | null;
  referral_source: string | null;
  project_types: string[] | null;
  project_summary: string;
  project_details: string | null;
  features: string[] | null;
  design_status: string | null;
  existing_systems: string | null;
  budget_range: string;
  timeline: string;
  engagement_type: string | null;
  business_stage: string | null;
  target_audience: string | null;
  success_definition: string | null;
  replacing_existing: string | null;
  compliance_needs: string | null;
  maintenance_owner: string | null;
  stakeholders: string | null;
  additional_notes: string | null;
  status: ProjectIntakeStatus;
  source_page: string | null;
};

function isStatus(value: string): value is ProjectIntakeStatus {
  return (STATUS_FLOW as string[]).includes(value);
}

function ChipList({ values }: { values: string[] | null }) {
  if (!values || values.length === 0) {
    return <span className="text-sm text-muted-foreground/70">None selected</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <span key={value} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          {value}
        </span>
      ))}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value || !value.trim()) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1 py-2 sm:flex-row sm:gap-4">
      <span className="w-48 shrink-0 text-xs uppercase tracking-[0.18em] text-muted-foreground/70">
        {label}
      </span>
      <span className="whitespace-pre-wrap text-sm text-foreground/90">{value}</span>
    </div>
  );
}

function SubmissionCard({ submission }: { submission: ProjectIntakeRow }) {
  return (
    <article className="rounded-3xl border border-border/70 bg-background/50 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h4 className="text-lg font-semibold">{submission.full_name}</h4>
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${STATUS_BADGE[submission.status]}`}
            >
              {STATUS_LABELS[submission.status]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {submission.company ? `${submission.company} · ` : ""}
            Submitted {dateFormatter.format(new Date(submission.created_at))}
          </p>
          <p className="text-sm">
            <a href={`mailto:${submission.email}`} className="text-primary hover:underline">
              {submission.email}
            </a>
            {submission.phone ? <span className="text-muted-foreground"> · {submission.phone}</span> : null}
            {submission.website ? (
              <span className="text-muted-foreground"> · {submission.website}</span>
            ) : null}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FLOW.map((status) => (
            <form action={setProjectIntakeStatus} key={status}>
              <input type="hidden" name="submission_id" value={submission.id} />
              <input type="hidden" name="status" value={status} />
              <button
                type="submit"
                disabled={submission.status === status}
                className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                  submission.status === status
                    ? "cursor-default bg-primary text-primary-foreground"
                    : "border border-border/80 text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {STATUS_LABELS[status]}
              </button>
            </form>
          ))}
          <form action={deleteProjectIntakeSubmission}>
            <input type="hidden" name="submission_id" value={submission.id} />
            <button
              type="submit"
              className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-100 transition-colors hover:bg-rose-500/20"
            >
              Delete
            </button>
          </form>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        <div className="rounded-2xl border border-border/60 bg-card/60 p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-primary/80">Wants to build</p>
          <div className="mt-3">
            <ChipList values={submission.project_types} />
          </div>
          <p className="mt-4 text-base font-medium text-foreground">{submission.project_summary}</p>
          {submission.project_details ? (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {submission.project_details}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Budget", submission.budget_range],
            ["Timeline", submission.timeline],
            ["Engagement", submission.engagement_type],
            ["Stage", submission.business_stage],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-border/60 bg-card/60 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/70">{label}</p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {value && String(value).trim() ? value : "—"}
              </p>
            </div>
          ))}
        </div>

        {submission.features && submission.features.length > 0 ? (
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.18em] text-muted-foreground/70">Features</p>
            <ChipList values={submission.features} />
          </div>
        ) : null}

        <div className="divide-y divide-border/50">
          <DetailRow label="Design status" value={submission.design_status} />
          <DetailRow label="Existing systems" value={submission.existing_systems} />
          <DetailRow label="Target audience" value={submission.target_audience} />
          <DetailRow label="Success in 6 months" value={submission.success_definition} />
          <DetailRow label="Replacing" value={submission.replacing_existing} />
          <DetailRow label="Compliance" value={submission.compliance_needs} />
          <DetailRow label="Maintained by" value={submission.maintenance_owner} />
          <DetailRow label="Stakeholders" value={submission.stakeholders} />
          <DetailRow label="Heard via" value={submission.referral_source} />
          <DetailRow label="Anything else" value={submission.additional_notes} />
        </div>
      </div>
    </article>
  );
}

export default async function AdminProjectIntakePage() {
  const user = await requireAdminUser();
  await ensureAdminWorkspace(user);

  const supabase = getSupabaseServiceClient() as any;
  const { data, error } = await supabase
    .from("project_intake_submissions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const submissions = ((data ?? []) as ProjectIntakeRow[]).map((row) => ({
    ...row,
    status: isStatus(row.status) ? row.status : "new",
  }));

  const counts = STATUS_FLOW.reduce<Record<ProjectIntakeStatus, number>>(
    (acc, status) => {
      acc[status] = submissions.filter((item) => item.status === status).length;
      return acc;
    },
    { new: 0, reviewing: 0, quoted: 0, won: 0, lost: 0 },
  );

  const activeSubmissions = submissions.filter((item) => item.status !== "won" && item.status !== "lost");
  const closedSubmissions = submissions.filter((item) => item.status === "won" || item.status === "lost");

  return (
    <AdminShell
      title="Project Intake"
      subtitle="Incoming project requests from the website's Start a Project form."
      userEmail={user.email ?? "Authenticated user"}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-3xl border border-border/70 bg-card/90 p-5">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="mt-2 text-3xl font-semibold">{submissions.length}</p>
          </div>
          {STATUS_FLOW.map((status) => (
            <div key={status} className="rounded-3xl border border-border/70 bg-card/90 p-5">
              <p className="text-sm text-muted-foreground">{STATUS_LABELS[status]}</p>
              <p className="mt-2 text-3xl font-semibold">{counts[status]}</p>
            </div>
          ))}
        </div>

        <SectionCard
          title="Active requests"
          description="New, reviewing, and quoted leads. Move a request through the pipeline with the status buttons."
        >
          {activeSubmissions.length ? (
            <div className="space-y-5">
              {activeSubmissions.map((submission) => (
                <SubmissionCard key={submission.id} submission={submission} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No active requests"
              description="New project requests from the Start a Project form will appear here."
            />
          )}
        </SectionCard>

        <SectionCard
          title="Closed"
          description="Requests marked won or lost, kept for reference."
        >
          {closedSubmissions.length ? (
            <div className="space-y-5">
              {closedSubmissions.map((submission) => (
                <SubmissionCard key={submission.id} submission={submission} />
              ))}
            </div>
          ) : (
            <EmptyState title="Nothing closed yet" description="Won and lost requests will collect here." />
          )}
        </SectionCard>
      </div>
    </AdminShell>
  );
}
