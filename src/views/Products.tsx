"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

const heroImage = "/assets/hero-ai-network.jpg";

// These are the active Deebo product initiatives that should appear as current offerings.
// Historical projects that are no longer owned by Deebo belong in About, not here.
type ProductCard = {
  name: string;
  tagline: string;
  status: string;
  description: string;
  features: string[];
  technologies: string[];
  image: string;
};

const Products = () => {
  const products: ProductCard[] = [
    {
      name: "MyelomaRisk",
      tagline: "Myeloma Risk Calculator",
      status: "Active Collaboration",
      description:
        "MyelomaRisk provides risk stratification and prognosis tooling for myeloma-related clinical, educational, and research-oriented use cases. The collaboration began in 2023 and later became part of Deebo's broader product portfolio.",
      features: [
        "Risk stratification calculators",
        "Prognosis-oriented clinical workflows",
        "Support for myeloma and related plasma cell disorders",
        "Clinician-facing decision support experience",
        "Collaboration with Mayo Clinic hematologists",
        "Focused healthcare UX and deployment",
      ],
      technologies: ["React", "TypeScript", "Clinical Logic", "Risk Modeling", "Healthcare UX"],
      image: heroImage,
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
              Our <span className="text-gradient">Products</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Products and collaborations shaped by real workflow problems, decision support needs, and higher-context software work
            </p>
          </Reveal>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="space-y-24">
            {products.map((product, index) => (
              <Reveal key={index} className="max-w-6xl mx-auto" delayMs={index * 90}>
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                  <div
                    className="relative h-56 w-full bg-cover bg-center border-b border-border"
                    style={{ backgroundImage: `url(${product.image})` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background/85" />
                    <div className="relative flex h-full flex-col justify-between px-10 py-10">
                      <div className="flex items-start">
                        <div>
                          <div className="inline-block px-3 py-1 rounded-full bg-background/50 backdrop-blur-sm text-xs font-medium mb-3">
                            {product.status}
                          </div>
                          <h2 className="text-4xl font-bold mb-2 text-foreground drop-shadow-md">
                            {product.name}
                          </h2>
                          <p className="text-lg text-muted-foreground">{product.tagline}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-xl font-semibold mb-3">Overview</h3>
                          <p className="text-muted-foreground leading-relaxed">
                            {product.description}
                          </p>
                        </div>

                        <div>
                          <h3 className="text-xl font-semibold mb-4">Key Features</h3>
                          <div className="space-y-3">
                            {product.features.map((feature, idx) => (
                              <div key={idx} className="flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                <span className="text-muted-foreground">{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <h3 className="text-xl font-semibold mb-4">Technology Stack</h3>
                          <div className="flex flex-wrap gap-3">
                            {product.technologies.map((tech, idx) => (
                              <div
                                key={idx}
                                className="px-4 py-2 bg-secondary rounded-lg text-sm font-medium hover-lift"
                              >
                                {tech}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-secondary/50 p-6 rounded-xl">
                          <h3 className="text-xl font-semibold mb-3">Learn More</h3>
                          <p className="text-muted-foreground mb-4">
                            Interested in {product.name} or in similar product work? Get in touch to
                            discuss the underlying problem, use case, or workflow need.
                          </p>
                          <Button asChild variant="default" className="w-full">
                            <Link href="/contact">Discuss Similar Product Needs</Link>
                          </Button>
                        </div>
                      </div>
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
            <h2 className="text-4xl font-bold">Want to Build Your Own?</h2>
            <p className="text-xl text-muted-foreground">
              We work with teams that need workflow-specific software, clinical tooling, and more
              technical structure than a standard website project
            </p>
            <Button asChild size="lg">
              <Link href="/services">Explore Our Services</Link>
            </Button>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Products;
