import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { Target, Zap, Users } from "lucide-react";

const values = [
  {
    icon: Target,
    title: "Mission-Driven",
    description: "Every build starts with a real operator, clinician, or creative in mind.",
  },
  {
    icon: Zap,
    title: "Innovation First",
    description: "Emerging research moves from lab to production through rapid experimentation.",
  },
  {
    icon: Users,
    title: "People-Centric",
    description: "We ship intuitive tools that scale without sacrificing human context.",
  },
];

const milestones = [
  {
    year: "Nov 2024",
    title: "DeeboAI Studio Prototype",
    description: "Launched our audio automation pilot, helping creators turn explicit edits around in seconds.",
  },
  {
    year: "Mar 2025",
    title: "Impact Challenge Finalists",
    description: "Placed 2nd at Carleton College's Impact Challenge, earning $5K to accelerate product development.",
  },
  {
    year: "Aug 2025",
    title: "Website Consulting",
    description: "Introduced bespoke web design services—bringing brands like Linque Resourcing to market.",
  },
  {
    year: "Oct 2025",
    title: "Healthcare Consulting",
    description: "Expanded into clinical advisory, paving the way for SynnovaRx’s decision-support platform.",
  },
];

const AboutSection = () => {
  const headingRef = useScrollReveal<HTMLDivElement>({ threshold: 0.25 });
  const cardsRef = useScrollReveal<HTMLDivElement>({ threshold: 0.2 });
  const timelineRef = useScrollReveal<HTMLDivElement>({ threshold: 0.2 });

  return (
    <section className="relative py-24 bg-secondary/30 overflow-hidden">
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-background/90 via-transparent to-transparent pointer-events-none" />
      <div className="container mx-auto px-4 relative">
        <div
          ref={headingRef}
          className="max-w-4xl mx-auto text-center space-y-6 mb-20 reveal-element"
        >
          <h2 className="text-4xl md:text-5xl font-bold">
            About <span className="text-gradient">DeeboAI</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Founded by <span className="text-foreground font-medium">Amadou Touré</span> and{" "}
            <span className="text-foreground font-medium">Albert Osakwe</span>, DeeboAI is an AI
            product studio delivering audio innovation, healthcare intelligence, and resilient SaaS
            infrastructure. We combine deep ML research with production-grade engineering to get AI
            where it matters most.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left text-sm text-muted-foreground/90 glass-panel border border-border/80 rounded-2xl p-8">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-primary/70">Audio</p>
              <p>
                AI-native tooling for broadcasters, editors, and artists with lightning-fast
                automation.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-primary/70">Healthcare</p>
              <p>
                Patient-friendly transparency and clinical decision support embedded in existing
                workflows.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-primary/70">Enterprise</p>
              <p>
                Full-stack SaaS, data platforms, and consulting for operators scaling their services.
              </p>
            </div>
          </div>
        </div>

        <div
          ref={cardsRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20 reveal-element"
        >
          {values.map((value) => (
            <div
              key={value.title}
              className="relative overflow-hidden rounded-2xl border border-border bg-card/90 px-8 py-10 transition-all duration-300 hover:border-primary/40"
            >
              <div className="absolute inset-0 opacity-0 transition-opacity duration-300 hover:opacity-100 animated-aurora" />
              <div className="relative space-y-4">
                <div className="inline-flex items-center justify-center rounded-xl bg-primary/10 p-4 text-primary">
                  <value.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-semibold">{value.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{value.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="max-w-5xl mx-auto">
          <div ref={timelineRef} className="reveal-element">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border border-border/70 rounded-3xl px-8 py-10 glass-panel">
              <div className="space-y-3 md:max-w-sm">
                <p className="text-xs uppercase tracking-[0.35em] text-primary/70">Trajectory</p>
                <h3 className="text-2xl font-semibold text-foreground">
                  From audio pioneers to full-spectrum AI builders.
                </h3>
                <p className="text-muted-foreground">
                  Our founding insight: automation must honor craft. Today, the same principle guides
                  AI infrastructure for clinics, garages, and studios alike.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {milestones.map((milestone) => (
                  <div key={milestone.year} className="relative">
                    <div className="absolute left-0 top-0 h-full w-px bg-primary/40 sm:right-0 sm:left-auto sm:w-full sm:h-px sm:top-auto sm:bottom-0 sm:bg-gradient-to-r sm:from-primary/60 sm:via-primary/20 sm:to-transparent" />
                    <div className="space-y-2">
                      <span className="text-sm font-semibold text-primary">{milestone.year}</span>
                      <p className="text-sm font-medium text-foreground">{milestone.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
