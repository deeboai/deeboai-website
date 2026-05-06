"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { GOOGLE_APPOINTMENT_SCHEDULING_URL } from "@/lib/contact";
import Link from "next/link";
import { ArrowRight, Brain, CheckCircle2, Cloud, Code } from "lucide-react";

type ServiceItem = {
  icon: typeof Code;
  title: string;
  description: string;
  features: string[];
  technologies: string[];
  caseStudy?: string;
  caseStudyLink?: string;
  products?: { name: string; status: string }[];
  serviceLink?: string;
  serviceLinkLabel?: string;
  featured?: boolean;
};

const Services = () => {
  const services: ServiceItem[] = [
    {
      icon: Code,
      title: "Managed Presence & Website Consulting",
      description:
        "Build, maintain, and protect the digital front door of your business: website, domain, forms, email, and ongoing support in one practical service path.",
      featured: true,
      features: [
        "Custom marketing sites & brand storytelling",
        "Website maintenance, small updates, and reliability checks",
        "Domain, SSL, DNS, and form-deliverability support",
        "Google Workspace setup and basic managed inbox administration",
        "Responsive design tuned for trust, conversion, and credibility",
        "SEO-ready architecture, analytics foundations, and performance cleanup",
      ],
      technologies: ["Next.js", "TypeScript", "Tailwind CSS", "Google Workspace", "Netlify", "DNS"],
      caseStudy: "Linque Resourcing · linqueresourcing.com",
      caseStudyLink: "https://linqueresourcing.com",
      serviceLink: "/managed-presence",
      serviceLinkLabel: "View Managed Presence plans",
    },
    {
      icon: Brain,
      title: "AI Systems & Product Development",
      description: "Design and ship AI products that solve specific workflow problems, not generic demos.",
      features: [
        "Machine Learning Models",
        "Natural Language Processing",
        "Computer Vision Systems",
        "Predictive Analytics",
        "AI Model Training & Optimization",
        "Custom AI Architecture Design",
      ],
      technologies: ["TensorFlow", "PyTorch", "scikit-learn", "OpenAI", "Hugging Face"],
    },
    {
      icon: Cloud,
      title: "SaaS Solutions",
      description: "Full-stack software platforms built for regulated, operational, and healthcare contexts.",
      features: [
        "Healthcare decision-support products",
        "Risk calculators and clinical tools",
        "Enterprise workflow automation",
        "Cloud infrastructure",
        "API development and integration",
        "Multi-tenant architecture",
      ],
      technologies: ["AWS", "PostgreSQL", "FHIR", "Docker", "TypeScript"],
      products: [
        { name: "ZynthRx", status: "In Development" },
        { name: "MyelomaRisk", status: "Active Collaboration" },
      ],
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-background to-secondary/30">
        <div className="container mx-auto px-4">
          <Reveal className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold">
              Our <span className="text-gradient">Services</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Digital presence, product strategy, engineering, and applied AI for teams solving real business problems
            </p>
          </Reveal>
        </div>
      </section>

      {/* Managed Presence Highlight */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Reveal className="mx-auto max-w-6xl rounded-2xl border border-primary/30 bg-card p-8 shadow-lg shadow-primary/10">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div className="space-y-5">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
                  Featured service
                </p>
                <h2 className="text-3xl font-bold md:text-4xl">
                  Managed Presence is our website consulting service after launch.
                </h2>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  Website consulting and Managed Presence are part of the same service path: build the site, connect the
                  systems, keep the domain/email/forms working, and give the business one technical owner to contact
                  when something needs attention.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-secondary/40 p-6">
                <p className="mb-4 font-semibold">Best for businesses that need:</p>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {[
                    "A credible website or landing page",
                    "Domain, SSL, DNS, and form reliability",
                    "Google Workspace/email setup or support",
                    "Ongoing small updates after launch",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-6 w-full">
                  <Link href="/managed-presence">
                    View Managed Presence plans
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Services Details */}
      <section className="py-24 pt-8">
        <div className="container mx-auto px-4">
          <div className="space-y-24">
            {services.map((service, index) => (
              <Reveal
                key={service.title}
                delayMs={index * 80}
                variant={index % 2 === 0 ? "left" : "right"}
                className={`flex flex-col ${
                  index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                } gap-12 items-center`}
              >
                <div className="flex-1 space-y-6">
                  <div className="bg-primary/10 w-16 h-16 rounded-xl flex items-center justify-center">
                    <service.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    {service.featured && (
                      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                        Website consulting + managed support
                      </p>
                    )}
                    <h2 className="text-3xl md:text-4xl font-bold">{service.title}</h2>
                  </div>
                  <p className="text-lg text-muted-foreground">{service.description}</p>

                  <div className="space-y-3">
                    {service.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center">
                    {service.serviceLink && (
                      <Button asChild>
                        <Link href={service.serviceLink}>{service.serviceLinkLabel ?? "Learn more"}</Link>
                      </Button>
                    )}

                    {service.caseStudy && (
                      <a
                        href={service.caseStudyLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        Recent launch: {service.caseStudy}
                      </a>
                    )}
                  </div>

                  {service.products && (
                    <div className="pt-4">
                      <p className="text-sm font-medium mb-2">Product Journey:</p>
                      <div className="flex flex-wrap gap-2">
                        {service.products.map((product) => (
                          <span
                            key={product.name}
                            className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium"
                          >
                            {product.name} · {product.status}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div
                    className={`bg-card p-8 rounded-xl border ${
                      service.featured ? "border-primary/40 shadow-lg shadow-primary/10" : "border-border"
                    }`}
                  >
                    <h3 className="font-semibold mb-4">
                      {service.featured ? "Systems We Support" : "Technologies We Use"}
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {service.technologies.map((tech) => (
                        <div
                          key={tech}
                          className="px-4 py-2 bg-secondary/50 rounded-lg text-sm font-medium hover-lift"
                        >
                          {tech}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <Reveal className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-4xl font-bold">Ready to Get Started?</h2>
            <p className="text-xl text-muted-foreground">
              Let&apos;s choose the right service path for your website, workflow, or product.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button asChild size="lg">
                <a href={GOOGLE_APPOINTMENT_SCHEDULING_URL} target="_blank" rel="noreferrer">
                  Book an Appointment
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/managed-presence">View Managed Presence</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Services;
