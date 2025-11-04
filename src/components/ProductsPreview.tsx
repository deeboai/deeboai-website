import { Button } from "@/components/ui/button";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import whiteOnBlack from "@/assets/logos/white_on_black.PNG?url";
import synnovaImage from "@/assets/srx.jpg?url";
import autoflowImage from "@/assets/autoflow.jpg?url";
import { Link } from "react-router-dom";

const products = [
  {
    name: "DeeboAI Studio",
    tagline: "AI Audio Automation",
    description:
      "Studio-grade audio editing accelerated by speech isolation, profanity detection, and timeline-aware automation.",
    status: "In Development",
    image: whiteOnBlack,
  },
  {
    name: "SynnovaRx",
    tagline: "Healthcare Intelligence",
    description:
      "Patient-friendly medication intelligence layered into EHRs with indication-based insights and adherence analytics.",
    status: "In Development",
    image: synnovaImage,
  },
  {
    name: "AutoFlow",
    tagline: "Smart Scheduling & Ops",
    description:
      "Adaptive scheduling and workflows empowering automotive service teams with real-time availability and demand forecasting.",
    status: "In Negotiation",
    image: autoflowImage,
  },
];

const ProductsPreview = () => {
  const headingRef = useScrollReveal<HTMLDivElement>({ threshold: 0.2 });
  const cardsRef = useScrollReveal<HTMLDivElement>({ threshold: 0.2 });

  return (
    <section className="py-28 bg-secondary/20 relative">
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background/70 via-transparent to-transparent pointer-events-none" />
      <div className="container mx-auto px-4 relative">
        <div
          ref={headingRef}
          className="max-w-3xl mx-auto text-center space-y-4 mb-16 reveal-element"
        >
          <h2 className="text-4xl md:text-5xl font-bold">
            Featured <span className="text-gradient">Products</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Crafting intelligent solutions that free teams to focus on what matters.
          </p>
        </div>

        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-8 reveal-element">
          {products.map((product) => (
            <div
              key={product.name}
              className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border/70 bg-card"
            >
              <div
                className="relative h-44 w-full bg-cover bg-center"
                style={{ backgroundImage: `url(${product.image})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background/80" />
                <div className="relative flex h-full flex-col justify-end px-8 py-6">
                  <div className="space-y-2 text-left">
                    <div className="inline-flex items-center gap-3 text-[0.65rem] uppercase tracking-[0.35em]">
                      <span className="rounded-full bg-background/70 px-3 py-1 text-muted-foreground">
                        {product.status}
                      </span>
                      <span className="text-muted-foreground/70">{product.tagline}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-foreground drop-shadow-md">
                      {product.name}
                    </h3>
                  </div>
                </div>
              </div>
              <div className="flex flex-1 flex-col justify-between gap-6 px-8 py-8 bg-card/90">
                <p className="text-muted-foreground leading-relaxed">{product.description}</p>
                <Button asChild variant="ghost" className="justify-start px-0 text-primary">
                  <Link to="/products">
                    Explore the roadmap
                    <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1.5">
                      →
                    </span>
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <Button asChild size="lg">
            <Link to="/products">Discover All Products</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ProductsPreview;
