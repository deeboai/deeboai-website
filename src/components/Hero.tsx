import { Button } from "@/components/ui/button";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const heroImage = "/assets/hero-ai-network.jpg";

const Hero = () => {
  const headingRef = useScrollReveal<HTMLHeadingElement>({ threshold: 0.3 });
  const textRef = useScrollReveal<HTMLParagraphElement>({ threshold: 0.25 });
  const ctaRef = useScrollReveal<HTMLDivElement>({ threshold: 0.35 });
  const statsRef = useScrollReveal<HTMLDivElement>({ threshold: 0.2 });

  return (
    <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="AI Neural Network abstraction"
          className="w-full h-full object-cover opacity-40"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background" />
        <div className="absolute inset-x-0 -top-32 h-64 blur-[120px] bg-primary/25 opacity-50" />
      </div>

      <div className="container relative z-10 mx-auto px-4 pb-16 pt-28 sm:pt-32">
        <div className="max-w-5xl mx-auto text-center space-y-10">
          <h1
            ref={headingRef}
            className="mx-auto text-4xl font-bold leading-tight tracking-tight reveal-element sm:text-5xl md:text-7xl"
          >
            Websites, email, and{" "}
            <span className="text-gradient">digital systems</span>{" "}
            that keep your business reachable.
          </h1>

          <p
            ref={textRef}
            className="mx-auto max-w-3xl text-lg text-muted-foreground reveal-element sm:text-xl md:text-2xl"
          >
            Deebo helps businesses build, manage, and support the website, domain, forms, and
            professional email systems they rely on, with deeper software and product capability
            when the work requires more than a standard website.
          </p>

          <div
            ref={ctaRef}
            className="flex flex-col items-stretch justify-center gap-4 pt-2 reveal-element sm:flex-row sm:items-center"
          >
            <Button
              asChild
              size="lg"
              className="group hover:shadow-lg hover:shadow-primary/45 transition-all duration-300"
            >
              <Link href="/managed-presence">
                View Managed Presence Plans
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-2 transition-transform duration-300" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="hover:bg-primary/10 hover:text-primary transition-all duration-300"
            >
              <Link href="/services">Explore Our Services</Link>
            </Button>
          </div>

          {/* Long stat labels need more breathing room on tablets before expanding to three columns. */}
          <div ref={statsRef} className="grid grid-cols-1 gap-6 pt-6 reveal-element sm:grid-cols-2 xl:grid-cols-3">
            {[
              { value: "Websites & email", label: "Built, maintained, and supported so your business stays reachable and credible." },
              { value: "Custom software", label: "Workflow tools, dashboards, and integrations for when off-the-shelf falls short." },
              { value: "Healthcare-grade", label: "Product work shaped by real clinical and high-context software experience." },
            ].map((stat) => (
              <div
                key={stat.label}
                className="group relative overflow-hidden rounded-2xl border border-border/80 bg-secondary/40 px-8 py-6 text-left transition-all duration-300 hover:border-primary/40 hover:bg-secondary/70"
              >
                <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 animated-aurora" />
                <div className="relative space-y-2">
                  <p className="text-lg font-semibold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 sm:flex">
        <div className="text-xs uppercase tracking-[0.35em] text-muted-foreground/80">Scroll</div>
        <div className="h-16 w-[1px] bg-gradient-to-b from-primary via-primary/40 to-transparent animate-pulse" />
      </div>
    </section>
  );
};

export default Hero;
