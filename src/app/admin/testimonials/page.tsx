import { AdminShell } from "@/features/admin/components/admin-shell";
import { EmptyState } from "@/features/admin/components/empty-state";
import { SectionCard } from "@/features/admin/components/section-card";
import { ensureAdminWorkspace } from "@/features/admin/lib/bootstrap";
import { requireAdminUser } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import {
  approveAcademyTestimonial,
  deleteAcademyTestimonial,
  rejectAcademyTestimonial,
  updateAcademyTestimonial,
} from "@/app/admin/testimonials/actions";

const testimonialDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

type AcademyTestimonialAdminRow = {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  class_year: string;
  tutor_name: string;
  subject: string;
  impression: string | null;
  video_url: string | null;
  moderation_status: string;
  is_published: boolean;
};

function StatusBadge({ value }: { value: string }) {
  const className =
    value === "approved"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
      : value === "rejected"
        ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
        : "border-amber-500/30 bg-amber-500/10 text-amber-200";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${className}`}>
      {value}
    </span>
  );
}

function TestimonialModerationCard({
  testimonial,
}: {
  testimonial: AcademyTestimonialAdminRow;
}) {
  return (
    <article className="rounded-3xl border border-border/70 bg-background/50 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h4 className="text-lg font-semibold">
              {testimonial.first_name} {testimonial.last_name}
            </h4>
            <StatusBadge value={testimonial.moderation_status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Submitted {testimonialDateFormatter.format(new Date(testimonial.created_at))} · Class year {testimonial.class_year}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <form action={approveAcademyTestimonial}>
            <input type="hidden" name="testimonial_id" value={testimonial.id} />
            <button
              type="submit"
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Approve
            </button>
          </form>
          <form action={rejectAcademyTestimonial}>
            <input type="hidden" name="testimonial_id" value={testimonial.id} />
            <button
              type="submit"
              className="rounded-xl border border-border/80 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              Reject
            </button>
          </form>
          <form action={deleteAcademyTestimonial}>
            <input type="hidden" name="testimonial_id" value={testimonial.id} />
            <button
              type="submit"
              className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-100 transition-colors hover:bg-rose-500/20"
            >
              Delete
            </button>
          </form>
        </div>
      </div>

      <form action={updateAcademyTestimonial} className="mt-5 space-y-4">
        <input type="hidden" name="testimonial_id" value={testimonial.id} />

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">First name</span>
            <input
              name="first_name"
              defaultValue={testimonial.first_name}
              className="w-full rounded-2xl border border-border/70 bg-card/70 px-4 py-3 text-sm"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Last name</span>
            <input
              name="last_name"
              defaultValue={testimonial.last_name}
              className="w-full rounded-2xl border border-border/70 bg-card/70 px-4 py-3 text-sm"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Class year</span>
            <input
              name="class_year"
              defaultValue={testimonial.class_year}
              className="w-full rounded-2xl border border-border/70 bg-card/70 px-4 py-3 text-sm"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Tutor</span>
            <input
              name="tutor_name"
              defaultValue={testimonial.tutor_name}
              className="w-full rounded-2xl border border-border/70 bg-card/70 px-4 py-3 text-sm"
            />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Subject</span>
            <input
              name="subject"
              defaultValue={testimonial.subject}
              className="w-full rounded-2xl border border-border/70 bg-card/70 px-4 py-3 text-sm"
            />
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Written testimonial</span>
          <textarea
            name="impression"
            rows={6}
            defaultValue={testimonial.impression ?? ""}
            className="w-full rounded-2xl border border-border/70 bg-card/70 px-4 py-3 text-sm leading-relaxed"
          />
        </label>

        {testimonial.video_url ? (
          <div className="overflow-hidden rounded-[1.5rem] border border-border/80 bg-card/70">
            <video controls preload="metadata" className="w-full" src={testimonial.video_url} />
          </div>
        ) : null}

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-xl border border-border/80 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Save changes
          </button>
        </div>
      </form>
    </article>
  );
}

export default async function AdminTestimonialsPage() {
  const user = await requireAdminUser();
  await ensureAdminWorkspace(user);

  const supabase = getSupabaseServiceClient() as any;
  const { data, error } = await supabase
    .from("academy_testimonials")
    .select(
      "id, created_at, first_name, last_name, class_year, tutor_name, subject, impression, video_url, moderation_status, is_published",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const testimonials = (data ?? []) as AcademyTestimonialAdminRow[];
  const pendingTestimonials = testimonials.filter((item) => item.moderation_status === "pending");
  const reviewedTestimonials = testimonials.filter((item) => item.moderation_status !== "pending");

  return (
    <AdminShell
      title="Academy Testimonials"
      subtitle="Review incoming Academy testimonials before they appear on the public site."
      userEmail={user.email ?? "Authenticated user"}
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-border/70 bg-card/90 p-5">
            <p className="text-sm text-muted-foreground">Pending review</p>
            <p className="mt-2 text-3xl font-semibold">{pendingTestimonials.length}</p>
          </div>
          <div className="rounded-3xl border border-border/70 bg-card/90 p-5">
            <p className="text-sm text-muted-foreground">Approved</p>
            <p className="mt-2 text-3xl font-semibold">
              {testimonials.filter((item) => item.moderation_status === "approved").length}
            </p>
          </div>
          <div className="rounded-3xl border border-border/70 bg-card/90 p-5">
            <p className="text-sm text-muted-foreground">Rejected</p>
            <p className="mt-2 text-3xl font-semibold">
              {testimonials.filter((item) => item.moderation_status === "rejected").length}
            </p>
          </div>
        </div>

        <SectionCard
          title="Pending submissions"
          description="Approve testimonials to publish them on the Academy site, or reject them to keep them private."
        >
          {pendingTestimonials.length ? (
            <div className="space-y-4">
              {pendingTestimonials.map((testimonial) => (
                <TestimonialModerationCard
                  key={testimonial.id}
                  testimonial={testimonial}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No pending testimonials"
              description="New Academy reviews waiting for approval will appear here."
            />
          )}
        </SectionCard>

        <SectionCard
          title="Reviewed submissions"
          description="This section keeps the recent approved and rejected moderation history in one place."
        >
          {reviewedTestimonials.length ? (
            <div className="space-y-4">
              {reviewedTestimonials.map((testimonial) => (
                <TestimonialModerationCard
                  key={testimonial.id}
                  testimonial={testimonial}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No reviewed testimonials yet"
              description="Approved and rejected submissions will appear here after moderation."
            />
          )}
        </SectionCard>
      </div>
    </AdminShell>
  );
}
