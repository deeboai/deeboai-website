import { AdminShell } from "@/features/admin/components/admin-shell";
import { EmptyState } from "@/features/admin/components/empty-state";
import { SectionCard } from "@/features/admin/components/section-card";
import { ensureAdminWorkspace } from "@/features/admin/lib/bootstrap";
import { requireAdminUser } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import {
  deleteAcademyIntakeSubmission,
  markAcademyIntakeContacted,
  markAcademyIntakeConverted,
  markAcademyIntakeNew,
} from "@/app/admin/intake/actions";

const intakeDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

type AcademyIntakeRow = {
  id: string;
  created_at: string;
  parent_full_name: string;
  parent_email: string;
  parent_phone: string | null;
  student_first_name: string;
  grade: string;
  subject: string;
  goals: string;
  session_format: string;
  status: "new" | "contacted" | "converted";
};

function IntakeStatusBadge({ value }: { value: AcademyIntakeRow["status"] }) {
  const className =
    value === "converted"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
      : value === "contacted"
        ? "border-sky-500/30 bg-sky-500/10 text-sky-200"
        : "border-amber-500/30 bg-amber-500/10 text-amber-200";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${className}`}
    >
      {value}
    </span>
  );
}

function IntakeActionButton({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <button type="submit" className={className}>
      {label}
    </button>
  );
}

function IntakeSubmissionCard({ submission }: { submission: AcademyIntakeRow }) {
  return (
    <article className="rounded-3xl border border-border/70 bg-background/50 p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h4 className="text-lg font-semibold">
              {submission.student_first_name} · {submission.subject}
            </h4>
            <IntakeStatusBadge value={submission.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Submitted {intakeDateFormatter.format(new Date(submission.created_at))}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <form action={markAcademyIntakeNew}>
            <input type="hidden" name="submission_id" value={submission.id} />
            <IntakeActionButton
              label="Mark new"
              className="rounded-xl border border-border/80 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            />
          </form>
          <form action={markAcademyIntakeContacted}>
            <input type="hidden" name="submission_id" value={submission.id} />
            <IntakeActionButton
              label="Mark contacted"
              className="rounded-xl border border-sky-500/40 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-100 transition-colors hover:bg-sky-500/20"
            />
          </form>
          <form action={markAcademyIntakeConverted}>
            <input type="hidden" name="submission_id" value={submission.id} />
            <IntakeActionButton
              label="Mark converted"
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            />
          </form>
          <form action={deleteAcademyIntakeSubmission}>
            <input type="hidden" name="submission_id" value={submission.id} />
            <IntakeActionButton
              label="Delete"
              className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-100 transition-colors hover:bg-rose-500/20"
            />
          </form>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Contact</p>
          <p className="mt-2 font-medium text-foreground">{submission.parent_full_name}</p>
          <a
            href={`mailto:${submission.parent_email}`}
            className="mt-2 block text-sm text-primary hover:underline"
          >
            {submission.parent_email}
          </a>
          {submission.parent_phone ? (
            <a
              href={`tel:${submission.parent_phone}`}
              className="mt-1 block text-sm text-muted-foreground hover:text-foreground"
            >
              {submission.parent_phone}
            </a>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">No phone number provided</p>
          )}
        </div>

        <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Student</p>
          <p className="mt-2 font-medium text-foreground">{submission.student_first_name}</p>
          <p className="mt-1 text-sm text-muted-foreground">{submission.grade}</p>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Tutoring request</p>
          <p className="mt-2 font-medium text-foreground">{submission.subject}</p>
          <p className="mt-1 text-sm capitalize text-muted-foreground">
            {submission.session_format}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-border/70 bg-card/70 p-4">
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
          Goals and current challenges
        </p>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {submission.goals}
        </p>
      </div>
    </article>
  );
}

export default async function AdminIntakePage() {
  const user = await requireAdminUser();
  await ensureAdminWorkspace(user);

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("academy_intake_submissions")
    .select(
      "id, created_at, parent_full_name, parent_email, parent_phone, student_first_name, grade, subject, goals, session_format, status",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const submissions = (data ?? []) as AcademyIntakeRow[];
  const newSubmissions = submissions.filter((item) => item.status === "new");
  const pipelineSubmissions = submissions.filter((item) => item.status !== "new");

  return (
    <AdminShell
      title="Academy Intake"
      subtitle="Review new tutoring requests, follow up with the contact, and track which requests convert."
      userEmail={user.email ?? "Authenticated user"}
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-border/70 bg-card/90 p-5">
            <p className="text-sm text-muted-foreground">New</p>
            <p className="mt-2 text-3xl font-semibold">{newSubmissions.length}</p>
          </div>
          <div className="rounded-3xl border border-border/70 bg-card/90 p-5">
            <p className="text-sm text-muted-foreground">Contacted</p>
            <p className="mt-2 text-3xl font-semibold">
              {submissions.filter((item) => item.status === "contacted").length}
            </p>
          </div>
          <div className="rounded-3xl border border-border/70 bg-card/90 p-5">
            <p className="text-sm text-muted-foreground">Converted</p>
            <p className="mt-2 text-3xl font-semibold">
              {submissions.filter((item) => item.status === "converted").length}
            </p>
          </div>
        </div>

        <SectionCard
          title="New submissions"
          description="Fresh Academy intake requests appear here first so they can be reviewed and followed up quickly."
        >
          {newSubmissions.length ? (
            <div className="space-y-4">
              {newSubmissions.map((submission) => (
                <IntakeSubmissionCard key={submission.id} submission={submission} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No new intake submissions"
              description="New tutoring requests will appear here as soon as they are submitted."
            />
          )}
        </SectionCard>

        <SectionCard
          title="Pipeline history"
          description="This keeps the recently contacted and converted Academy requests in one place."
        >
          {pipelineSubmissions.length ? (
            <div className="space-y-4">
              {pipelineSubmissions.map((submission) => (
                <IntakeSubmissionCard key={submission.id} submission={submission} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No followed-up submissions yet"
              description="Requests that have been contacted or converted will appear here."
            />
          )}
        </SectionCard>
      </div>
    </AdminShell>
  );
}
