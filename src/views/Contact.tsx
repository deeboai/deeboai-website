"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { GoogleAppointmentButton } from "@/components/google-appointment-button";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Calendar, Loader2, Mail, MapPin } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { DEEBOAI_CONTACT_EMAIL } from "@/lib/contact";

type ContactFormData = {
  name: string;
  email: string;
  company: string;
  phone: string;
  serviceInterest: string;
  message: string;
  website: string;
};

type ContactFormErrors = Partial<Record<keyof Pick<ContactFormData, "name" | "email" | "message">, string>>;

const initialFormData: ContactFormData = {
  name: "",
  email: "",
  company: "",
  phone: "",
  serviceInterest: "",
  message: "",
  website: "",
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Contact = () => {
  const [formData, setFormData] = useState<ContactFormData>(initialFormData);
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const validateForm = () => {
    const nextErrors: ContactFormErrors = {};

    if (!formData.name.trim()) {
      nextErrors.name = "Name is required.";
    }

    if (!emailPattern.test(formData.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!formData.message.trim()) {
      nextErrors.message = "Message is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the highlighted fields before sending your message.");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          sourcePage: typeof window === "undefined" ? "/contact" : window.location.href,
        }),
      });

      const result = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to send your message right now.");
      }

      setFormData(initialFormData);
      setSubmitStatus("success");
      toast.success("Your message was sent.");
    } catch (error) {
      setSubmitStatus("error");
      toast.error(error instanceof Error ? error.message : "Unable to send your message right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-background to-secondary/30">
        <div className="container mx-auto px-4">
          <Reveal className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold">
              Talk through your <span className="text-gradient">project</span>, support need, or technical issue
            </h1>
            <p className="text-xl text-muted-foreground">
              Whether you need a website, ongoing support, a digital cleanup, or a more specialized
              software engagement, we can help you identify the right next step.
            </p>
            <div className="mx-auto inline-flex flex-col items-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 px-6 py-4 text-sm sm:flex-row sm:gap-3">
              <span className="text-muted-foreground">
                Scoping a build with a budget and timeline?
              </span>
              <Link href="/start" className="inline-flex items-center font-medium text-primary hover:underline">
                Start a detailed project brief
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 max-w-6xl mx-auto">
            {/* Contact Information */}
            <Reveal className="space-y-8" variant="left">
              <div>
                <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium mb-1">Email</p>
                      <a
                        href={`mailto:${DEEBOAI_CONTACT_EMAIL}`}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        {DEEBOAI_CONTACT_EMAIL}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium mb-1">Location</p>
                      <p className="text-muted-foreground">
                        Minneapolis, MN<br />United States
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium mb-1">Schedule a Call</p>
                      <div className="pt-2">
                        <GoogleAppointmentButton className="w-full sm:w-auto" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card p-6 rounded-xl border border-border">
                <h3 className="font-semibold mb-3">What to Expect</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>We review your current setup, goals, and pain points.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>If a monthly support plan fits, we will tell you.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>If the work needs separate scoping, we will explain why.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>If there is a simpler path, we will recommend that instead.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>You leave with a clearer next step, not just a sales conversation.</span>
                  </li>
                </ul>
              </div>
            </Reveal>

            {/* Contact Form */}
            <Reveal className="lg:col-span-2" variant="right">
              <div className="bg-card p-8 rounded-xl border border-border">
                <h2 className="text-2xl font-bold mb-6">Tell us what you need help with</h2>
                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                  <div className="hidden" aria-hidden="true">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value });
                          setErrors((current) => ({ ...current, name: undefined }));
                        }}
                        aria-invalid={Boolean(errors.name)}
                        aria-describedby={errors.name ? "name-error" : undefined}
                        required
                      />
                      {errors.name && (
                        <p id="name-error" className="text-sm text-destructive">
                          {errors.name}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value });
                          setErrors((current) => ({ ...current, email: undefined }));
                        }}
                        aria-invalid={Boolean(errors.email)}
                        aria-describedby={errors.email ? "email-error" : undefined}
                        required
                      />
                      {errors.email && (
                        <p id="email-error" className="text-sm text-destructive">
                          {errors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        placeholder="Your Company"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="serviceInterest">Service Interest</Label>
                    <Select
                      value={formData.serviceInterest}
                      onValueChange={(value) => setFormData({ ...formData, serviceInterest: value })}
                    >
                      <SelectTrigger id="serviceInterest">
                        <SelectValue placeholder="Select an area" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="managed-presence">Managed Presence</SelectItem>
                        <SelectItem value="website-build">Website Build or Redesign</SelectItem>
                        <SelectItem value="email">Email / Google Workspace Support</SelectItem>
                        <SelectItem value="cleanup">Technical Cleanup or Rescue</SelectItem>
                        <SelectItem value="custom-software">Custom Software / Workflow Tool</SelectItem>
                        <SelectItem value="healthcare">Healthcare Tooling</SelectItem>
                        <SelectItem value="product">Product Inquiry</SelectItem>
                        <SelectItem value="partnership">Partnership Proposal</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us about your project or inquiry..."
                      rows={6}
                      value={formData.message}
                      onChange={(e) => {
                        setFormData({ ...formData, message: e.target.value });
                        setErrors((current) => ({ ...current, message: undefined }));
                      }}
                      aria-invalid={Boolean(errors.message)}
                      aria-describedby={errors.message ? "message-error" : undefined}
                      required
                    />
                    {errors.message && (
                      <p id="message-error" className="text-sm text-destructive">
                        {errors.message}
                      </p>
                    )}
                  </div>

                  {submitStatus === "success" && (
                    <div
                      className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary"
                      role="status"
                    >
                      Thanks for reaching out. We received your message and will review it soon.
                    </div>
                  )}

                  {submitStatus === "error" && (
                    <div
                      className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                      role="alert"
                    >
                      We could not send your message. Please try again or email {DEEBOAI_CONTACT_EMAIL}.
                    </div>
                  )}

                  <Button type="submit" size="lg" className="w-full" disabled={isSubmitting} aria-busy={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Message"
                    )}
                  </Button>
                </form>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
