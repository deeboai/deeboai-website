import {
  sanitizeEmailAddress,
  sanitizeMultilineText,
  sanitizePlainText,
} from "@/lib/input-security";

export const DEEBOAI_CONTACT_EMAIL = "support@deeboai.com";

export const GOOGLE_APPOINTMENT_SCHEDULING_URL =
  "https://calendar.google.com/calendar/appointments/schedules/AcZssZ2-QG9RFTSoUAau6Rh1u79xVafPpywL2B6ZxaQVrU3cx1uT6YUp3KZE18TRgSDb03jCCk0Xs32g?gv=true";

type ContactMailtoInput = {
  name: string;
  email: string;
  company: string;
  inquiryType: string;
  message: string;
};

function formatInquiryType(value: string) {
  if (!value) {
    return "General";
  }

  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function buildContactMailtoHref({
  name,
  email,
  company,
  inquiryType,
  message,
}: ContactMailtoInput) {
  const normalizedInquiryType = formatInquiryType(sanitizePlainText(inquiryType, { maxLength: 80 }));
  const normalizedName = sanitizePlainText(name, { maxLength: 120 }) || "Website visitor";
  const normalizedEmail = sanitizeEmailAddress(email);
  const normalizedCompany = sanitizePlainText(company, { maxLength: 160 });
  const normalizedMessage = sanitizeMultilineText(message, { maxLength: 4000 });

  const subject = `${normalizedInquiryType} inquiry from ${normalizedName}`;
  const bodyLines = [
    `Name: ${normalizedName}`,
    `Email: ${normalizedEmail}`,
    normalizedCompany ? `Company: ${normalizedCompany}` : undefined,
    `Inquiry Type: ${normalizedInquiryType}`,
    "",
    "Message:",
    normalizedMessage,
  ].filter(Boolean) as string[];

  return `mailto:${DEEBOAI_CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
    bodyLines.join("\n"),
  )}`;
}
