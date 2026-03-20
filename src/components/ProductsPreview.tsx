import { Button } from "@/components/ui/button";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import synnovaImage from "@/assets/srx.jpg?url";
import heroImage from "@/assets/hero-ai-network.jpg";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

// Homepage product preview stays intentionally small: current flagship products plus a clear
// services CTA in the third slot so the section does not imply a nonexistent third flagship.
const products = [
  {
    name: "ZynthRx",
    tagline: "Medication Intelligence",
    description:
      "Patient-friendly medication intelligence layered into care workflows with clearer indications, context, and decision support.",
    status: "In Development",
    image: synnovaImage,
  },
  {
    name: "MyelomaRisk",
    tagline: "Clinical Risk Assessment",
    description:
      "Risk stratification and prognosis tooling for multiple myeloma and related plasma cell disorders, carried into DeeboAI in 2026 after the collaboration began in 2023.",
    status: "Active Collaboration",
    image: heroImage,
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

        <div ref={cardsRef} className="grid grid-cols-1 lg:grid-cols-3 gap-8 reveal-element">
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

          <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-border/70 bg-card/80 p-8">
            <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 animated-aurora" />
            <div className="relative space-y-6">
              <div className="inline-flex items-center gap-3 text-[0.65rem] uppercase tracking-[0.35em] text-muted-foreground/70">
                <span className="rounded-full bg-background/70 px-3 py-1">Custom Builds</span>
                <span>Services</span>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-foreground">Need something purpose-built?</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We partner with teams that need custom AI software, clinical workflow tools, and
                  operator-ready systems rather than off-the-shelf demos.
                </p>
              </div>
            </div>
            <Button asChild variant="ghost" className="relative justify-start px-0 text-primary">
              <Link to="/services">
                Explore our services
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
              </Link>
            </Button>
          </div>
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
