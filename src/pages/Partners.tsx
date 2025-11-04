import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Handshake, Heart, Globe2 } from "lucide-react";

type Partner = {
  name: string;
  type: string;
  icon: typeof Heart;
  description: string;
  collaboration: string;
  impact: string;
  href?: string;
};

const Partners = () => {
  const partners: Partner[] = [
    {
      name: "SynnovaRx",
      type: "Healthcare Partner",
      icon: Heart,
      description:
        "Our flagship healthcare partnership focused on revolutionizing medication management through intelligent EHR integration.",
      collaboration: "Joint product development and go-to-market strategy",
      impact: "Transforming patient medication transparency",
    },
    {
      name: "Linque Resourcing",
      type: "Website Consulting Client",
      icon: Globe2,
      description:
        "Talent acquisition firm whose new digital presence was designed and developed by our website consulting team.",
      collaboration: "End-to-end UX, copy, and development of linqueresourcing.com",
      impact: "Delivered an accessible, high-performance site that accelerated lead generation.",
      href: "https://linqueresourcing.com",
    },
    {
      name: "Strategic Alliances",
      type: "Industry Collaborators",
      icon: Handshake,
      description:
        "Select technology and creative partners who help us pressure-test ideas and ship resilient products.",
      collaboration: "Joint workshops, pilot deployments, and ongoing feedback loops",
      impact: "Ensuring DeeboAI solutions are grounded in real operational needs.",
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-background to-secondary/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold">
              Our <span className="text-gradient">Partners</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Strategic collaborations driving innovation and delivering exceptional results
            </p>
          </div>
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
                </>
              );

              return partner.href ? (
                <a
                  key={partner.name}
                  href={partner.href}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-card p-8 rounded-xl border border-border hover-lift block"
                >
                  {content}
                </a>
              ) : (
                <div
                  key={partner.name}
                  className="bg-card p-8 rounded-xl border border-border hover-lift"
                >
                  {content}
                </div>
              );
            })}
          </div>

          {/* Partnership Philosophy */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-secondary/50 p-12 rounded-2xl border border-border">
              <h2 className="text-3xl font-bold mb-6 text-center">Partnership Philosophy</h2>
              <div className="space-y-4 text-lg text-muted-foreground">
                <p>
                  At DeeboAI, we believe that the best solutions emerge from collaborative innovation.
                  Our partnerships are built on mutual respect, shared vision, and a commitment to
                  excellence.
                </p>
                <p>
                  We seek partners who share our mission to make AI accessible and practical—companies
                  and organizations that are as passionate about solving real problems as we are.
                </p>
                <p>
                  Whether you're a technology provider, industry leader, or innovative startup, we're
                  always exploring new opportunities to create value together.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-4xl font-bold">Interested in Partnering?</h2>
            <p className="text-xl text-muted-foreground">
              Let's explore how we can build something great together
            </p>
            <Button asChild size="lg">
              <Link to="/contact">Get in Touch</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Partners;
