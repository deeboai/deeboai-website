import { Button } from "@/components/ui/button";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { GOOGLE_APPOINTMENT_SCHEDULING_URL } from "@/lib/contact";
import { ArrowRight, Brain, Cloud, Code } from "lucide-react";
import Link from "next/link";

const services = [
  {
    icon: Brain,
    title: "Managed Presence",
    description: "Ongoing website, domain, forms, and email support for businesses that need technical ownership after launch.",
    features: ["Website upkeep and small updates", "Domain, SSL, DNS, and form support", "Professional email support where applicable"],
    caption: "Built for businesses that want their digital presence maintained, monitored, and easier to trust.",
  },
  {
    icon: Code,
    title: "Website Builds & Technical Cleanup",
    description: "Launch a credible business website, repair broken setups, or clean up the technical issues slowing your business down.",
    features: ["Business websites and landing pages", "Rescue work for forms, email, and domain issues", "Scoped improvements after launch"],
    caption: "Best for businesses that need a stronger online home or a cleaner technical setup.",
  },
  {
    icon: Cloud,
    title: "Custom Systems & Specialized Software",
    description: "For teams that need internal tools, workflow systems, healthcare tooling, or more advanced software support.",
    features: ["Workflow-specific software", "Dashboards, integrations, and internal tools", "Specialized product planning and scoped builds"],
    caption: "Current work spans healthcare tooling, business systems, and more specialized software contexts.",
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
            Clear support paths for businesses that need a stronger online presence, cleaner technical operations, or more specialized software work.
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
            Start With The Right Level Of Support
          </p>
          <h3 className="text-2xl font-semibold">
            Some businesses need a dependable monthly support plan. Others need a scoped website
            build, rescue project, or custom system.
          </h3>
          <p className="text-muted-foreground">
            We help you choose the lowest sensible next step based on your actual needs, current
            setup, and business risk.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/managed-presence">
                Compare Monthly Plans
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="hover:bg-primary/10">
              <a href={GOOGLE_APPOINTMENT_SCHEDULING_URL} target="_blank" rel="noreferrer">
                Talk Through Your Project
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesPreview;
