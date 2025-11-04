import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Brain, Code, Cloud, CheckCircle2 } from "lucide-react";

type ServiceItem = {
  icon: typeof Brain;
  title: string;
  description: string;
  features: string[];
  technologies: string[];
  caseStudy?: string;
  caseStudyLink?: string;
  products?: { name: string; status: string }[];
};

const Services = () => {
  const services: ServiceItem[] = [
    {
      icon: Brain,
      title: "AI Systems & Product Development",
      description: "Transform your business with enterprise-grade AI solutions.",
      features: [
        "Machine Learning Models",
        "Natural Language Processing",
        "Computer Vision Systems",
        "Predictive Analytics",
        "AI Model Training & Optimization",
        "Custom AI Architecture Design",
      ],
      technologies: ["TensorFlow", "PyTorch", "scikit-learn", "OpenAI", "Hugging Face"],
    },
    {
      icon: Code,
      title: "Website Consulting & Development",
      description: "Launch beautiful, high-performing websites without the complexity of AI.",
      features: [
        "Custom marketing sites & brand storytelling",
        "Responsive design tuned for conversion",
        "Content management & publishing workflows",
        "Performance and accessibility optimization",
        "E-commerce and payments integration",
        "SEO-ready architecture and analytics",
      ],
      technologies: ["Next.js", "Remix", "TypeScript", "Tailwind CSS", "Headless CMS"],
      caseStudy: "Linque Resourcing · linqueresourcing.com",
      caseStudyLink: "https://linqueresourcing.com",
    },
    {
      icon: Cloud,
      title: "SaaS Solutions",
      description: "Full-stack SaaS platforms built for scale.",
      features: [
        "Healthcare Management Systems",
        "Automotive Scheduling Platforms",
        "Enterprise Workflow Automation",
        "Cloud Infrastructure",
        "API Development & Integration",
        "Multi-tenant Architecture",
      ],
      technologies: ["AWS", "PostgreSQL", "Redis", "Docker", "Kubernetes"],
      products: [
        { name: "SynnovaRx", status: "In Development" },
        { name: "AutoFlow", status: "In Negotiation" },
      ],
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
              Our <span className="text-gradient">Services</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Comprehensive AI solutions tailored to solve your most complex challenges
            </p>
          </div>
        </div>
      </section>

      {/* Services Details */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="space-y-24">
            {services.map((service, index) => (
              <div
                key={index}
                className={`flex flex-col ${
                  index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                } gap-12 items-center`}
              >
                <div className="flex-1 space-y-6">
                  <div className="bg-primary/10 w-16 h-16 rounded-xl flex items-center justify-center">
                    <service.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold">{service.title}</h2>
                  <p className="text-lg text-muted-foreground">{service.description}</p>

                  <div className="space-y-3">
                    {service.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {service.caseStudy && (
                    <div className="pt-4">
                      <p className="text-sm font-medium mb-2">Recent Launch:</p>
                      <a
                        href={service.caseStudyLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        {service.caseStudy}
                      </a>
                    </div>
                  )}

                  {service.products && (
                    <div className="pt-4">
                      <p className="text-sm font-medium mb-2">Product Journey:</p>
                      <div className="flex flex-wrap gap-2">
                        {service.products.map((product) => (
                          <span
                            key={product.name}
                            className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium"
                          >
                            {product.name} · {product.status}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="bg-card p-8 rounded-xl border border-border">
                    <h3 className="font-semibold mb-4">Technologies We Use</h3>
                    <div className="flex flex-wrap gap-3">
                      {service.technologies.map((tech, idx) => (
                        <div
                          key={idx}
                          className="px-4 py-2 bg-secondary/50 rounded-lg text-sm font-medium hover-lift"
                        >
                          {tech}
                        </div>
                      ))}
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
            <h2 className="text-4xl font-bold">Ready to Get Started?</h2>
            <p className="text-xl text-muted-foreground">
              Let's build something extraordinary together
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button asChild size="lg">
                <a href="https://calendly.com/etoure33/30min" target="_blank" rel="noreferrer">
                  Request a Consultation
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/products">View Our Products</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Services;
