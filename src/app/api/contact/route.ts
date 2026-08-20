import { NextResponse } from "next/server";
import { Resend } from "resend";

import { sanitizeEmailAddress, sanitizeMultilineText, sanitizePlainText } from "@/lib/input-security";

type ContactRequestBody = {
  name?: string;
  email?: string;
  company?: string;
  phone?: string;
  serviceInterest?: string;
  message?: string;
  sourcePage?: string;
  website?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatOptionalValue(value: string) {
  return value || "Not provided";
}

function buildEmailHtml(fields: Required<Omit<ContactRequestBody, "website">>, timestamp: string) {
  const rows = [
    ["Name", fields.name],
    ["Email", fields.email],
    ["Company", formatOptionalValue(fields.company)],
    ["Phone", formatOptionalValue(fields.phone)],
    ["Service interest", formatOptionalValue(fields.serviceInterest)],
    ["Page/source", formatOptionalValue(fields.sourcePage)],
    ["Timestamp", timestamp],
  ];

  return `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
      <h1 style="font-size: 20px; margin: 0 0 16px;">New Deebo contact form submission</h1>
      <p style="margin: 0 0 20px;">This message came from deeboai.com.</p>
      <table style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
        <tbody>
          ${rows
            .map(
              ([label, value]) => `
                <tr>
                  <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left; width: 180px; background: #f9fafb;">${escapeHtml(
                    label,
                  )}</th>
                  <td style="border: 1px solid #e5e7eb; padding: 8px;">${escapeHtml(value)}</td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
      <h2 style="font-size: 16px; margin: 0 0 8px;">Message</h2>
      <div style="white-space: pre-wrap; border: 1px solid #e5e7eb; padding: 12px; border-radius: 8px;">${escapeHtml(
        fields.message,
      )}</div>
    </div>
  `;
}

function buildEmailText(fields: Required<Omit<ContactRequestBody, "website">>, timestamp: string) {
  return [
    "New Deebo contact form submission",
    "This message came from deeboai.com.",
    "",
    `Name: ${fields.name}`,
    `Email: ${fields.email}`,
    `Company: ${formatOptionalValue(fields.company)}`,
    `Phone: ${formatOptionalValue(fields.phone)}`,
    `Service interest: ${formatOptionalValue(fields.serviceInterest)}`,
    `Page/source: ${formatOptionalValue(fields.sourcePage)}`,
    `Timestamp: ${timestamp}`,
    "",
    "Message:",
    fields.message,
  ].join("\n");
}

export async function POST(request: Request) {
  let body: ContactRequestBody;

  try {
    body = (await request.json()) as ContactRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const honeypotValue = sanitizePlainText(body.website ?? "", { maxLength: 200 });

  if (honeypotValue) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const fields = {
    name: sanitizePlainText(body.name ?? "", { maxLength: 120 }),
    email: sanitizeEmailAddress(body.email ?? ""),
    company: sanitizePlainText(body.company ?? "", { maxLength: 160 }),
    phone: sanitizePlainText(body.phone ?? "", { maxLength: 80 }),
    serviceInterest: sanitizePlainText(body.serviceInterest ?? "", { maxLength: 120 }),
    message: sanitizeMultilineText(body.message ?? "", { maxLength: 5000 }),
    sourcePage: sanitizePlainText(body.sourcePage ?? "", { maxLength: 300 }),
  };

  if (!fields.name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  if (!fields.email || !emailPattern.test(fields.email)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  if (!fields.message) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL;
  const fromEmail = process.env.CONTACT_FROM_EMAIL;
  const fallbackReplyToEmail = process.env.CONTACT_REPLY_TO_EMAIL;

  if (!resendApiKey || !toEmail || !fromEmail) {
    return NextResponse.json({ error: "Contact email is not configured." }, { status: 503 });
  }

  const resend = new Resend(resendApiKey);
  const timestamp = new Date().toISOString();
  const replyTo = fields.email || fallbackReplyToEmail;

  try {
    // TODO: Add rate limiting here if the deployment adds a shared store or existing request-throttle utility.
    await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      replyTo,
      subject: "New Deebo contact form submission",
      html: buildEmailHtml(fields, timestamp),
      text: buildEmailText(fields, timestamp),
    });
  } catch (error) {
    console.error("Contact form email failed", error);
    return NextResponse.json({ error: "Unable to send your message right now." }, { status: 502 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
