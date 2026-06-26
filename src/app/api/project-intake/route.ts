import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

import { DEEBOAI_CONTACT_EMAIL } from "@/lib/contact";
import {
  sanitizeEmailAddress,
  sanitizeMultilineText,
  sanitizePlainText,
} from "@/lib/input-security";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The public form posts camelCase; the database stores snake_case. The schema validates shape and
// bounds only — every string is sanitized below before it touches the database or an email.
const intakeSchema = z.object({
  fullName: z.string().max(120),
  email: z.string().max(320),
  phone: z.string().max(80).optional().default(""),
  company: z.string().max(160).optional().default(""),
  website: z.string().max(300).optional().default(""),
  referralSource: z.string().max(160).optional().default(""),

  projectTypes: z.array(z.string().max(80)).max(30).optional().default([]),
  projectSummary: z.string().max(300),
  projectDetails: z.string().max(6000).optional().default(""),

  features: z.array(z.string().max(80)).max(40).optional().default([]),
  designStatus: z.string().max(80).optional().default(""),
  existingSystems: z.string().max(2000).optional().default(""),

  budgetRange: z.string().max(80),
  timeline: z.string().max(80),
  engagementType: z.string().max(80).optional().default(""),
  businessStage: z.string().max(80).optional().default(""),

  targetAudience: z.string().max(2000).optional().default(""),
  successDefinition: z.string().max(2000).optional().default(""),
  replacingExisting: z.string().max(2000).optional().default(""),
  complianceNeeds: z.string().max(2000).optional().default(""),
  maintenanceOwner: z.string().max(160).optional().default(""),
  stakeholders: z.string().max(2000).optional().default(""),
  additionalNotes: z.string().max(4000).optional().default(""),

  consent: z.boolean().optional().default(false),
  sourcePage: z.string().max(300).optional().default(""),
  // Honeypot — must stay empty. Named so password managers/bots fill it but humans never see it.
  companyFax: z.string().max(200).optional().default(""),
});

type IntakeInput = z.infer<typeof intakeSchema>;

function cleanLine(value: string, maxLength: number) {
  return sanitizePlainText(value ?? "", { maxLength });
}

function cleanBlock(value: string, maxLength: number) {
  return sanitizeMultilineText(value ?? "", { maxLength });
}

function cleanList(values: string[], maxLength: number) {
  return (values ?? [])
    .map((value) => sanitizePlainText(value, { maxLength }))
    .filter(Boolean);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type SanitizedIntake = ReturnType<typeof sanitizeIntake>;

function sanitizeIntake(input: IntakeInput) {
  return {
    fullName: cleanLine(input.fullName, 120),
    email: sanitizeEmailAddress(input.email ?? ""),
    phone: cleanLine(input.phone, 80),
    company: cleanLine(input.company, 160),
    website: cleanLine(input.website, 300),
    referralSource: cleanLine(input.referralSource, 160),

    projectTypes: cleanList(input.projectTypes, 80),
    projectSummary: cleanLine(input.projectSummary, 300),
    projectDetails: cleanBlock(input.projectDetails, 6000),

    features: cleanList(input.features, 80),
    designStatus: cleanLine(input.designStatus, 80),
    existingSystems: cleanBlock(input.existingSystems, 2000),

    budgetRange: cleanLine(input.budgetRange, 80),
    timeline: cleanLine(input.timeline, 80),
    engagementType: cleanLine(input.engagementType, 80),
    businessStage: cleanLine(input.businessStage, 80),

    targetAudience: cleanBlock(input.targetAudience, 2000),
    successDefinition: cleanBlock(input.successDefinition, 2000),
    replacingExisting: cleanBlock(input.replacingExisting, 2000),
    complianceNeeds: cleanBlock(input.complianceNeeds, 2000),
    maintenanceOwner: cleanLine(input.maintenanceOwner, 160),
    stakeholders: cleanBlock(input.stakeholders, 2000),
    additionalNotes: cleanBlock(input.additionalNotes, 4000),

    sourcePage: cleanLine(input.sourcePage, 300),
  };
}

function optional(value: string) {
  return value || "Not provided";
}

function optionalList(values: string[]) {
  return values.length ? values.join(", ") : "Not provided";
}

function buildInternalHtml(fields: SanitizedIntake, timestamp: string) {
  const rows: [string, string][] = [
    ["Name", fields.fullName],
    ["Email", fields.email],
    ["Phone", optional(fields.phone)],
    ["Company", optional(fields.company)],
    ["Website", optional(fields.website)],
    ["Heard about us via", optional(fields.referralSource)],
    ["Project type(s)", optionalList(fields.projectTypes)],
    ["One-line summary", fields.projectSummary],
    ["Features wanted", optionalList(fields.features)],
    ["Design status", optional(fields.designStatus)],
    ["Existing systems", optional(fields.existingSystems)],
    ["Budget range", fields.budgetRange],
    ["Timeline", fields.timeline],
    ["Engagement", optional(fields.engagementType)],
    ["Business stage", optional(fields.businessStage)],
    ["Target audience", optional(fields.targetAudience)],
    ["Definition of success", optional(fields.successDefinition)],
    ["Replacing something?", optional(fields.replacingExisting)],
    ["Compliance needs", optional(fields.complianceNeeds)],
    ["Who maintains it", optional(fields.maintenanceOwner)],
    ["Stakeholders", optional(fields.stakeholders)],
    ["Page/source", optional(fields.sourcePage)],
    ["Submitted", timestamp],
  ];

  const tableRows = rows
    .map(
      ([label, value]) => `
        <tr>
          <th style="border:1px solid #e5e7eb;padding:8px;text-align:left;width:200px;background:#f9fafb;vertical-align:top;">${escapeHtml(
            label,
          )}</th>
          <td style="border:1px solid #e5e7eb;padding:8px;white-space:pre-wrap;">${escapeHtml(value)}</td>
        </tr>`,
    )
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.5;">
      <h1 style="font-size:20px;margin:0 0 8px;">New project intake submission</h1>
      <p style="margin:0 0 20px;">A potential client submitted the project intake form on deeboai.com.</p>
      <table style="border-collapse:collapse;width:100%;margin-bottom:20px;"><tbody>${tableRows}</tbody></table>
      ${
        fields.projectDetails
          ? `<h2 style="font-size:16px;margin:0 0 8px;">Project description</h2>
             <div style="white-space:pre-wrap;border:1px solid #e5e7eb;padding:12px;border-radius:8px;">${escapeHtml(
               fields.projectDetails,
             )}</div>`
          : ""
      }
      ${
        fields.additionalNotes
          ? `<h2 style="font-size:16px;margin:16px 0 8px;">Anything else</h2>
             <div style="white-space:pre-wrap;border:1px solid #e5e7eb;padding:12px;border-radius:8px;">${escapeHtml(
               fields.additionalNotes,
             )}</div>`
          : ""
      }
    </div>`;
}

function buildInternalText(fields: SanitizedIntake, timestamp: string) {
  return [
    "New project intake submission",
    "",
    `Name: ${fields.fullName}`,
    `Email: ${fields.email}`,
    `Phone: ${optional(fields.phone)}`,
    `Company: ${optional(fields.company)}`,
    `Website: ${optional(fields.website)}`,
    `Heard about us via: ${optional(fields.referralSource)}`,
    `Project type(s): ${optionalList(fields.projectTypes)}`,
    `One-line summary: ${fields.projectSummary}`,
    `Features wanted: ${optionalList(fields.features)}`,
    `Design status: ${optional(fields.designStatus)}`,
    `Existing systems: ${optional(fields.existingSystems)}`,
    `Budget range: ${fields.budgetRange}`,
    `Timeline: ${fields.timeline}`,
    `Engagement: ${optional(fields.engagementType)}`,
    `Business stage: ${optional(fields.businessStage)}`,
    `Target audience: ${optional(fields.targetAudience)}`,
    `Definition of success: ${optional(fields.successDefinition)}`,
    `Replacing something?: ${optional(fields.replacingExisting)}`,
    `Compliance needs: ${optional(fields.complianceNeeds)}`,
    `Who maintains it: ${optional(fields.maintenanceOwner)}`,
    `Stakeholders: ${optional(fields.stakeholders)}`,
    `Page/source: ${optional(fields.sourcePage)}`,
    `Submitted: ${timestamp}`,
    "",
    "Project description:",
    fields.projectDetails || "Not provided",
    "",
    "Anything else:",
    fields.additionalNotes || "Not provided",
  ].join("\n");
}

function buildConfirmationHtml(fields: SanitizedIntake) {
  return `
    <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6;max-width:560px;">
      <h1 style="font-size:20px;margin:0 0 16px;">Thanks for reaching out, ${escapeHtml(
        fields.fullName.split(" ")[0] || fields.fullName,
      )}.</h1>
      <p style="margin:0 0 16px;">
        We received your project details and will review them carefully. You can expect a thoughtful
        response from the DeeboAI team, usually within one to two business days.
      </p>
      <p style="margin:0 0 16px;">Here is a quick summary of what you shared:</p>
      <ul style="margin:0 0 16px;padding-left:18px;">
        <li><strong>What you want built:</strong> ${escapeHtml(optionalList(fields.projectTypes))}</li>
        <li><strong>Summary:</strong> ${escapeHtml(fields.projectSummary)}</li>
        <li><strong>Budget range:</strong> ${escapeHtml(fields.budgetRange)}</li>
        <li><strong>Timeline:</strong> ${escapeHtml(fields.timeline)}</li>
      </ul>
      <p style="margin:0 0 16px;">
        If anything changes or you want to add detail in the meantime, just reply to this email and it
        will reach us directly.
      </p>
      <p style="margin:0;">— The DeeboAI team<br/>
        <a href="mailto:${DEEBOAI_CONTACT_EMAIL}" style="color:#2563eb;">${DEEBOAI_CONTACT_EMAIL}</a>
      </p>
    </div>`;
}

function buildConfirmationText(fields: SanitizedIntake) {
  return [
    `Thanks for reaching out, ${fields.fullName.split(" ")[0] || fields.fullName}.`,
    "",
    "We received your project details and will review them carefully. You can expect a thoughtful",
    "response from the DeeboAI team, usually within one to two business days.",
    "",
    "Here is a quick summary of what you shared:",
    `- What you want built: ${optionalList(fields.projectTypes)}`,
    `- Summary: ${fields.projectSummary}`,
    `- Budget range: ${fields.budgetRange}`,
    `- Timeline: ${fields.timeline}`,
    "",
    "If anything changes or you want to add detail, just reply to this email and it will reach us directly.",
    "",
    `— The DeeboAI team`,
    DEEBOAI_CONTACT_EMAIL,
  ].join("\n");
}

export async function POST(request: Request) {
  let json: unknown;

  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = intakeSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Some required details were missing or invalid." }, { status: 400 });
  }

  // Honeypot: bots fill the hidden field. Pretend success so they get no signal.
  if (sanitizePlainText(parsed.data.companyFax ?? "", { maxLength: 200 })) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const fields = sanitizeIntake(parsed.data);

  if (!fields.fullName) {
    return NextResponse.json({ error: "Your name is required." }, { status: 400 });
  }

  if (!fields.email || !emailPattern.test(fields.email)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  if (!fields.projectSummary) {
    return NextResponse.json({ error: "A short project summary is required." }, { status: 400 });
  }

  if (!fields.budgetRange) {
    return NextResponse.json({ error: "Please choose a budget range." }, { status: 400 });
  }

  if (!fields.timeline) {
    return NextResponse.json({ error: "Please choose a timeline." }, { status: 400 });
  }

  if (!parsed.data.consent) {
    return NextResponse.json({ error: "Please confirm you agree to be contacted." }, { status: 400 });
  }

  // Persist first so a submission is never lost even if email delivery has a hiccup. The generated
  // Supabase types do not yet include this table, so the service client is cast the same way the
  // existing admin actions cast it.
  try {
    const supabase = getSupabaseServiceClient() as any;
    const { error } = await supabase.from("project_intake_submissions").insert({
      full_name: fields.fullName,
      email: fields.email,
      phone: fields.phone || null,
      company: fields.company || null,
      website: fields.website || null,
      referral_source: fields.referralSource || null,
      project_types: fields.projectTypes,
      project_summary: fields.projectSummary,
      project_details: fields.projectDetails || null,
      features: fields.features,
      design_status: fields.designStatus || null,
      existing_systems: fields.existingSystems || null,
      budget_range: fields.budgetRange,
      timeline: fields.timeline,
      engagement_type: fields.engagementType || null,
      business_stage: fields.businessStage || null,
      target_audience: fields.targetAudience || null,
      success_definition: fields.successDefinition || null,
      replacing_existing: fields.replacingExisting || null,
      compliance_needs: fields.complianceNeeds || null,
      maintenance_owner: fields.maintenanceOwner || null,
      stakeholders: fields.stakeholders || null,
      additional_notes: fields.additionalNotes || null,
      source_page: fields.sourcePage || null,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Project intake insert failed", error);
    return NextResponse.json({ error: "We could not save your request right now." }, { status: 502 });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.CONTACT_FROM_EMAIL;
  const toEmail =
    process.env.INTAKE_TO_EMAIL || process.env.CONTACT_TO_EMAIL || DEEBOAI_CONTACT_EMAIL;

  // The submission is already saved. If email is not configured, still report success to the user —
  // the admin dashboard will show the record regardless.
  if (!resendApiKey || !fromEmail) {
    console.warn("Project intake email skipped: RESEND_API_KEY or CONTACT_FROM_EMAIL not set.");
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const resend = new Resend(resendApiKey);
  const timestamp = new Date().toISOString();

  // Notify the team (reply-to the client) and confirm to the client. A failed confirmation must not
  // fail the request — the lead is captured and the team is notified.
  try {
    await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      replyTo: fields.email,
      subject: `New project intake: ${fields.fullName}${fields.company ? ` (${fields.company})` : ""}`,
      html: buildInternalHtml(fields, timestamp),
      text: buildInternalText(fields, timestamp),
    });
  } catch (error) {
    console.error("Project intake team notification failed", error);
  }

  try {
    await resend.emails.send({
      from: fromEmail,
      to: fields.email,
      replyTo: toEmail,
      subject: "We received your project request — DeeboAI",
      html: buildConfirmationHtml(fields),
      text: buildConfirmationText(fields),
    });
  } catch (error) {
    console.error("Project intake confirmation email failed", error);
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
