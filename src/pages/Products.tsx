import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import whiteOnBlack from "@/assets/logos/white_on_black.PNG?url";
import synnovaImage from "@/assets/srx.jpg?url";
import autoflowImage from "@/assets/autoflow.jpg?url";
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";

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
      name: "DeeboAI Studio",
      tagline: "AI Audio Editing Suite",
      status: "In Development",
      description:
        "Revolutionary AI-powered audio processing platform designed to transform how engineers and editors finish mixes. DeeboAI Studio handles censoring, imputation, and lyric suggestions right in the DAW.",
      features: [
        "Context-aware explicit content detection",
        "Timing-preserving audio imputation",
        "Lyric replacement recommendations",
        "Multilingual speech differentiation",
        "DAW-ready automation playlists",
      ],
      technologies: ["Python", "TensorFlow", "PyTorch", "WebAssembly", "Edge Workers"],
      image: whiteOnBlack,
    },
    {
      name: "SynnovaRx",
      tagline: "Healthcare Intelligence Platform",
      status: "In Development",
      description:
        "Bridging the gap between medication management and patient understanding. SynnovaRx integrates directly into EHR systems to provide indication-based, patient-friendly medication lists that enhance transparency and improve health outcomes.",
      features: [
        "EHR system integration",
        "Patient-friendly medication lists",
        "Indication-based organization",
        "Real-time synchronization",
        "HIPAA-compliant architecture",
        "Provider dashboard",
      ],
      technologies: ["React", "PostgreSQL", "FHIR", "HL7", "AWS"],
      image: synnovaImage,
    },
    {
      name: "AutoFlow",
      tagline: "Smart Scheduling & Operations",
      status: "In Negotiation",
      description:
        "Streamlined operations platform designed specifically for automotive service companies. AutoFlow optimizes scheduling, resource allocation, and customer management to drive efficiency and profitability.",
      features: [
        "Intelligent scheduling system",
        "Resource management",
        "Customer portal",
        "Automated reminders",
        "Analytics dashboard",
        "Mobile accessibility",
      ],
      technologies: ["Next.js", "TypeScript", "PostgreSQL", "Redis"],
      image: autoflowImage,
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
              Our <span className="text-gradient">Products</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Flagship software solutions bringing AI innovation to real-world industries
            </p>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="space-y-24">
            {products.map((product, index) => (
              <div key={index} className="max-w-6xl mx-auto">
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
                            Interested in {product.name}? Get in touch to see how it can transform your operations.
                          </p>
                          <Button asChild variant="default" className="w-full">
                            <Link to="/contact">Request Information</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-4xl font-bold">Want to Build Your Own?</h2>
            <p className="text-xl text-muted-foreground">
              We help companies develop custom AI solutions and SaaS platforms
            </p>
            <Button asChild size="lg">
              <Link to="/services">Explore Our Services</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Products;
