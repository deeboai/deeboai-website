"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Heart, Globe2, ShoppingBag, Stethoscope } from "lucide-react";

type Partner = {
  name: string;
  type: string;
  icon: typeof Heart;
  description: string;
  collaboration: string;
  impact: string;
  tags?: string[];
  href?: string;
};

const Partners = () => {
  // This page is reserved for external collaborators and partner categories rather than DeeboAI's
  // own product lineup. If a product is listed here, it should be because the collaboration itself
  // is part of the story, not because the product exists.
  const partners: Partner[] = [
    {
      name: "MyelomaRisk",
      type: "Clinical Product Collaboration",
      icon: Heart,
      description:
        "MyelomaRisk is a medical risk assessment calculator focused on multiple myeloma and related plasma cell disorders. The project supports risk stratification, prognosis calculations, education, and research-oriented use cases for clinicians, researchers, and medical learners.",
      collaboration:
        "Clinical workflow translation, product design, and software development spanning a collaboration that began in 2023",
      impact:
        "Supporting careful risk assessment, educational use, and research-oriented clinical collaboration without replacing clinician judgment.",
      tags: ["Medical Calculator", "Healthcare Technology", "Risk Assessment", "Research Tool"],
      href: "https://myelomarisk.com",
    },
    {
      name: "Linque Resourcing",
      type: "Client Website / Business Website",
      icon: Globe2,
      description:
        "Linque Resourcing is a people-solutions and HR consulting brand focused on strategic HR support, talent acquisition, recruiting operations, and HR technology solutions. The website positions the company as a practical partner for organizations that need smarter hiring, people operations, and workforce systems.",
      collaboration: "Business website strategy, positioning, UX, copy support, and web development",
      impact:
        "Created a credible digital presence for strategic HR consulting, talent acquisition, and people-operations support.",
      tags: ["HR Consulting", "Talent Acquisition", "People Operations", "Business Website"],
      href: "https://linqueresourcing.com",
    },
    {
      name: "Bigue Allure",
      type: "E-Commerce / Consumer Brand",
      icon: ShoppingBag,
      description:
        "Bigue Allure is a Senegalese beauty and self-care brand offering bath, body, fragrance, and shea butter essentials inspired by traditional self-care rituals. The brand blends cultural heritage, natural beauty practices, and modern e-commerce presentation.",
      collaboration: "Consumer brand web presence and e-commerce presentation support",
      impact:
        "Presented a Senegalese beauty and self-care brand with bath, body, fragrance, and shea butter essentials rooted in traditional care rituals.",
      tags: ["E-Commerce", "Beauty & Self-Care", "Senegalese Brand", "Consumer Website"],
      href: "https://bigusallure.com",
    },
    {
      name: "Clinical Collaborators",
      type: "Advisory & Domain Expertise",
      icon: Stethoscope,
      description:
        "Physicians, specialists, and healthcare domain experts who help pressure-test product assumptions and keep clinical software grounded in real care settings.",
      collaboration: "Advisory input, workflow validation, and domain expertise across healthcare-facing products",
      impact: "Improving the precision, safety, and usability of the tools DeeboAI brings to market.",
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
              Selected <span className="text-gradient">Collaborations</span> and client work
            </h1>
            <p className="text-xl text-muted-foreground">
              From business websites to healthcare-oriented software collaborations, our work reflects a focus on practical outcomes, technical clarity, and workflow fit
            </p>
          </Reveal>
        </div>
      </section>

      {/* Partners Grid */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-16">
            {partners.map((partner) => {
              const content = (
                <>
                  <div className="flex items-start gap-4 mb-6">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <partner.icon className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-1">{partner.name}</h3>
                      <p className="text-sm text-primary">{partner.type}</p>
                    </div>
                  </div>

                  <p className="text-muted-foreground mb-6">{partner.description}</p>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-1">Collaboration</p>
                      <p className="text-sm text-muted-foreground">{partner.collaboration}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Impact</p>
                      <p className="text-sm text-muted-foreground">{partner.impact}</p>
                    </div>
                  </div>

                  {partner.tags && (
                    <div className="mt-6 flex flex-wrap gap-2">
                      {partner.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              );

              return partner.href ? (
                <Reveal
                  key={partner.name}
                  className="h-full"
                >
                  <a
                    href={partner.href}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-card p-8 rounded-xl border border-border hover-lift block h-full"
                  >
                    {content}
                  </a>
                </Reveal>
              ) : (
                <Reveal
                  key={partner.name}
                  className="bg-card p-8 rounded-xl border border-border hover-lift"
                >
                  {content}
                </Reveal>
              );
            })}
          </div>

          {/* Partnership Philosophy */}
          <Reveal className="max-w-4xl mx-auto">
            <div className="bg-secondary/50 p-12 rounded-2xl border border-border">
              <h2 className="text-3xl font-bold mb-6 text-center">Partnership Philosophy</h2>
              <div className="space-y-4 text-lg text-muted-foreground">
                <p>
                  At DeeboAI, the best work comes from close collaboration with domain experts,
                  operators, and businesses dealing with real constraints.
                </p>
                <p>
                  We look for partnerships where precision, usability, credibility, and operational
                  fit matter more than surface-level polish alone.
                </p>
                <p>
                  Whether the work is a clinical tool, a business website, or a more specialized
                  software system, the collaboration works best when it is hands-on and outcome-driven.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <Reveal className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-4xl font-bold">Interested in Partnering?</h2>
            <p className="text-xl text-muted-foreground">
              Let&apos;s talk through the business context, the technical need, and what a useful
              collaboration would look like
            </p>
            <Button asChild size="lg">
              <Link href="/contact">Get in Touch</Link>
            </Button>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Partners;
