import { Button } from "@/components/ui/button";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import heroImage from "@/assets/hero-ai-network.jpg";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  const headingRef = useScrollReveal<HTMLHeadingElement>({ threshold: 0.3 });
  const textRef = useScrollReveal<HTMLParagraphElement>({ threshold: 0.25 });
  const ctaRef = useScrollReveal<HTMLDivElement>({ threshold: 0.35 });
  const statsRef = useScrollReveal<HTMLDivElement>({ threshold: 0.2 });

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="AI Neural Network abstraction"
          className="w-full h-full object-cover opacity-40"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background" />
        <div className="absolute inset-x-0 -top-32 h-64 blur-[120px] bg-primary/40 opacity-60" />
      </div>

      <div className="container mx-auto px-4 relative z-10 pt-24 pb-16">
        <div className="max-w-5xl mx-auto text-center space-y-10">
          <h1
            ref={headingRef}
            className="text-5xl md:text-7xl font-bold leading-tight tracking-tight mx-auto reveal-element"
          >
            Build{" "}
            <span className="text-gradient">intelligent experiences</span>{" "}
            that feel human, fast, and effortless.
          </h1>

          <p
            ref={textRef}
            className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto reveal-element"
          >
            DeeboAI designs AI-native platforms that automate audio editing, accelerate healthcare
            workflows, and unlock decision-ready data. We bridge research-grade innovation with
            enduring, production-ready software.
          </p>

          <div ref={ctaRef} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 reveal-element">
            <Button
              asChild
              size="lg"
              className="group hover:shadow-lg hover:shadow-primary/45 transition-all duration-300"
            >
              <Link to="/contact">
                Build With Us
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-2 transition-transform duration-300" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="hover:bg-primary/10 hover:text-primary transition-all duration-300"
            >
              <Link to="/products">Explore Our Products</Link>
            </Button>
          </div>

          <div ref={statsRef} className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 reveal-element">
            {[
              { value: "3+", label: "Active & emerging products across industries" },
              { value: "50+", label: "Languages orchestrated for AI-led audio cleanup" },
              { value: "100%", label: "Deployments powered by ethical, explainable AI" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="group relative overflow-hidden rounded-2xl border border-border/80 bg-secondary/40 px-8 py-6 text-left transition-all duration-300 hover:border-primary/40 hover:bg-secondary/70"
              >
                <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 animated-aurora" />
                <div className="relative space-y-2">
                  <p className="text-3xl font-bold text-primary">{stat.value}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
        <div className="text-xs uppercase tracking-[0.35em] text-muted-foreground/80">Scroll</div>
        <div className="h-16 w-[1px] bg-gradient-to-b from-primary via-primary/40 to-transparent animate-pulse" />
      </div>
    </section>
  );
};

export default Hero;
