import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { Target, Zap, Users } from "lucide-react";

// Keep this section aligned with the current company narrative. Historical entries may include
// pre-incorporation work when it directly explains today's DeeboAI products and positioning.
const values = [
  {
    icon: Target,
    title: "Practical By Default",
    description: "We prioritize solutions businesses can actually use, maintain, and trust.",
  },
  {
    icon: Zap,
    title: "Workflow-Aware",
    description: "We build around real operating conditions instead of idealized assumptions.",
  },
  {
    icon: Users,
    title: "Technically Grounded",
    description: "From website reliability to specialized software, the work is structured to hold up over time.",
  },
];

const milestones = [
  {
    year: "2023",
    title: "MyelomaRisk Collaboration Begins",
    description: "The underlying MyelomaRisk collaboration started before DeeboAI existed, laying the foundation for later clinical risk tooling work.",
  },
  {
    year: "2024",
    title: "Applied AI Product Work",
    description: "Early work on products including Deebo Studio sharpened our approach to workflow-native AI and rapid product iteration.",
  },
  {
    year: "2025",
    title: "Healthcare Focus Deepened",
    description: "Expanded clinical advisory and product discovery efforts around medication transparency and decision support.",
  },
  {
    year: "2025",
    title: "ZynthRx Platform Direction",
    description: "Refined our medication intelligence platform around patient-friendly understanding, provider context, and workflow fit.",
  },
  {
    year: "2026",
    title: "MyelomaRisk Joins DeeboAI",
    description: "The ongoing MyelomaRisk work was brought into DeeboAI's portfolio, connecting a 2023 clinical collaboration to the company's healthcare product direction.",
  },
  {
    year: "2026",
    title: "Deebo Academy Launches",
    description: "Deebo Academy launched as a separate education vertical for structured tutoring, extending the company's systems-oriented operating model into academic support.",
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
            Founded by <span className="text-foreground font-medium">Amadou Touré</span>, DeeboAI
            is a founder-led technology company focused on practical software, digital operations
            support, and workflow-oriented product development. We help businesses build and
            maintain the systems they depend on, and we bring deeper product capability when the
            work requires more than routine web support.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left text-sm text-muted-foreground/90 glass-panel border border-border/80 rounded-2xl p-8">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-primary/70">Clinical AI</p>
              <p>
                Higher-context product work around medication understanding, risk support, and
                software built for real healthcare workflows.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-primary/70">Managed Support</p>
              <p>
                Website, domain, forms, and professional email support for businesses that need
                ongoing technical ownership.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-primary/70">Enterprise</p>
              <p>
                Full-stack software, workflow systems, and custom tooling for operators managing
                more specialized needs.
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
                  From experimental AI builds to focused healthcare products and adjacent verticals.
                </h3>
                <p className="text-muted-foreground">
                  Our throughline has stayed the same: build software around the actual workflow.
                  That lesson carried from early product work into today&apos;s healthcare,
                  decision-support, and structured service platforms.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {milestones.map((milestone) => (
                  <div key={`${milestone.year}-${milestone.title}`} className="relative">
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
