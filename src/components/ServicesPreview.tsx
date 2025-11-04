import { Button } from "@/components/ui/button";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { ArrowRight, Brain, Cloud, Code } from "lucide-react";
import { Link } from "react-router-dom";

const services = [
  {
    icon: Brain,
    title: "AI Systems & Product Development",
    description: "End-to-end ML product teams delivering automation, NLP, and predictive analytics.",
    features: ["Model architecture & training", "MLOps, monitoring, compliance", "Applied research sprints"],
    caption: "From zero to production with measurable ROI in weeks, not quarters.",
  },
  {
    icon: Code,
    title: "Experiential Web & Digital Platforms",
    description: "High-impact marketing and corporate websites handcrafted without relying on AI.",
    features: ["Dynamic storytelling websites", "Headless CMS + marketing ops", "Accessibility + performance audits"],
    caption: "Recent launch: Linque Resourcing — a hiring firm now booking more leads through linqueresourcing.com.",
  },
  {
    icon: Cloud,
    title: "Industry SaaS & Integrations",
    description: "Regulated-ready SaaS for healthcare, automotive, and media operators.",
    features: ["HIPAA/HITRUST-aligned infrastructure", "Event-driven integrations", "Analytics & business intelligence"],
    caption: "Proven playbooks refined in real clinics, shops, and studios.",
  },
];

const ServicesPreview = () => {
  const headingRef = useScrollReveal<HTMLDivElement>({ threshold: 0.2 });
  const cardsRef = useScrollReveal<HTMLDivElement>({ threshold: 0.2 });
  const calloutRef = useScrollReveal<HTMLDivElement>({ threshold: 0.2 });

  return (
    <section className="relative py-28">
      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-primary/10 via-transparent to-transparent opacity-70 pointer-events-none" />
      <div className="container mx-auto px-4 relative">
        <div
          ref={headingRef}
          className="max-w-3xl mx-auto text-center space-y-4 mb-20 reveal-element"
        >
          <h2 className="text-4xl md:text-5xl font-bold">
            Our <span className="text-gradient">Services</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Strategic partners for teams shipping AI-first experiences from prototype to production.
          </p>
        </div>

        <div
          ref={cardsRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 reveal-element"
        >
          {services.map((service) => (
            <div
              key={service.title}
              className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/90 p-8 transition-all duration-300 hover:border-primary/40"
            >
              <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 animated-aurora" />
              <div className="relative space-y-6">
                <div className="inline-flex items-center justify-center rounded-xl bg-primary/10 p-4 text-primary">
                  <service.icon className="h-7 w-7" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold">{service.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{service.description}</p>
                </div>
                <ul className="space-y-2">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative mt-8 rounded-xl border border-border/60 bg-background/40 p-4 text-xs text-muted-foreground">
                {service.caption}
              </div>
            </div>
          ))}
        </div>

        <div
          ref={calloutRef}
          className="reveal-element max-w-4xl mx-auto glass-panel border border-border/80 rounded-3xl px-10 py-12 text-center space-y-6"
        >
          <p className="text-sm uppercase tracking-[0.35em] text-primary/70">
            Workshop To Launch
          </p>
          <h3 className="text-2xl font-semibold">
            Plug our founders directly into your product lifecycle for rapid discovery, design
            sprints, and technical validation.
          </h3>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg">
              <Link to="/services">
                View All Services
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="hover:bg-primary/10">
              <a href="https://calendly.com/etoure33/30min" target="_blank" rel="noreferrer">
                Book a discovery call
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesPreview;
