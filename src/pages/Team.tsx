import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { teamMembers, type TeamMember } from "@/lib/team-data";
import { Linkedin, Mail, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const TeamMemberCard = ({ member, index }: { member: TeamMember; index: number }) => {
  const cardRef = useScrollReveal<HTMLDivElement>({ threshold: 0.2, rootMargin: "-10% 0px" });
  const isEven = index % 2 === 0;

  return (
    <div
      ref={cardRef}
      data-variant={isEven ? "left" : "right"}
      className="reveal-element grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 lg:items-start"
    >
      <div
        className={`relative flex justify-center self-start ${isEven ? "" : "lg:order-2"}`}
      >
        <div className="pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-primary/40 via-transparent to-accent/30 blur-[80px] opacity-70" />
        <div className="relative w-full max-w-[420px] overflow-hidden rounded-3xl border border-border/70 bg-secondary/40 backdrop-blur">
          <div className="relative aspect-[4/5] w-full">
            <img
              src={member.image}
              alt={member.name}
              className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 hover:scale-105"
              loading="lazy"
            />
          </div>
        </div>
      </div>
      <div
        className={`relative flex flex-col justify-between rounded-3xl border border-border/70 bg-card/90 px-8 py-10 backdrop-blur ${isEven ? "" : "lg:order-1"}`}
      >
        <div className="absolute inset-x-6 top-0 h-40 -translate-y-1/2 rounded-full bg-gradient-to-r from-primary/20 via-accent/20 to-primary/10 blur-[80px]" />
        <div className="relative space-y-6">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-primary/70">{member.roleLabel}</p>
            <h2 className="text-3xl font-bold text-foreground">{member.name}</h2>
            <p className="text-sm text-muted-foreground/80">{member.title}</p>
          </div>
          <p className="text-muted-foreground leading-relaxed">{member.bio}</p>

          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground/80 mb-3">
              Expertise
            </p>
            <div className="flex flex-wrap gap-2">
              {member.expertise.map((skill) => (
                <Badge key={skill} variant="secondary" className="bg-secondary/60 border-none">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border/80 bg-background/50 p-6 space-y-4">
            <div className="flex flex-col gap-1">
              <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground/70">
                Current Role
              </p>
              <p className="font-medium text-foreground">{member.currentRole}</p>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{member.highlight}</p>
            <ul className="space-y-2 text-sm text-muted-foreground/80">
              {member.focus.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <blockquote className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary/10 p-6 text-sm text-primary">
            <Sparkles className="absolute -top-5 -left-5 h-12 w-12 text-primary/30" />
            <p>{member.quote}</p>
          </blockquote>
        </div>

        <div className="relative flex flex-wrap items-center gap-3 pt-6">
          {member.linkedin && (
            <a
              href={member.linkedin}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/50 px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </a>
          )}
          {member.email && (
            <a
              href={`mailto:${member.email}`}
              className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/50 px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Mail className="h-4 w-4" />
              Email
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

const Team = () => {
  const heroRef = useScrollReveal<HTMLDivElement>({ threshold: 0.2 });
  const cultureRef = useScrollReveal<HTMLDivElement>({ threshold: 0.2 });
  const ctaRef = useScrollReveal<HTMLDivElement>({ threshold: 0.2 });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20">
      <Navbar />

      <section className="relative overflow-hidden pt-36 pb-20">
        <div className="absolute inset-0">
          <div className="absolute inset-0 animated-aurora opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/60 to-background" />
        </div>
        <div className="container mx-auto px-4 relative">
          <div
            ref={heroRef}
            className="reveal-element max-w-4xl mx-auto text-center space-y-6"
          >
            <div className="inline-flex items-center gap-3 rounded-full border border-border/60 bg-background/60 px-5 py-2 text-xs uppercase tracking-[0.35em] text-muted-foreground">
              <span className="inline-flex h-2 w-2 rounded-full bg-primary animate-ping" />
              DeeboAI Leadership
            </div>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              Builders who blend{" "}
              <span className="text-gradient">engineering rigor</span> with creative empathy.
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We are technologists, musicians, and operators obsessed with removing friction from
              complex workflows. Our founders design AI systems that feel fluid for everyone—from
              mix engineers to clinical teams.
            </p>
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="container mx-auto px-4 space-y-20">
          {teamMembers.map((member, index) => (
            <TeamMemberCard key={member.id} member={member} index={index} />
          ))}
        </div>
      </section>

      <section className="pb-24">
        <div className="container mx-auto px-4">
          <div
            ref={cultureRef}
            className="reveal-element grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-10 rounded-3xl border border-border/70 bg-secondary/40 px-10 py-12 backdrop-blur"
          >
            <div className="space-y-6">
              <h2 className="text-3xl font-semibold">How We Operate</h2>
              <p className="text-muted-foreground leading-relaxed">
                AI should be invisible until the moment it adds value. We prototype fast, validate
                in real environments, and harden systems with measurable success criteria. From
                studio desks to hospital floors, we engage frontline teams to co-design the future.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    label: "Discovery",
                    detail: "Field research and operator interviews inform every roadmap.",
                  },
                  {
                    label: "Build",
                    detail: "Launch-ready infrastructure with compliance-top-of-mind.",
                  },
                  {
                    label: "Scale",
                    detail: "Data loops and training keep AI aligned post-deployment.",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-border/80 bg-background/50 p-5 text-sm text-muted-foreground"
                  >
                    <p className="text-xs uppercase tracking-[0.35em] text-primary/70 mb-2">
                      {item.label}
                    </p>
                    <p>{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-primary/20 bg-primary/10 p-8 space-y-5 text-sm text-primary">
              <p>
                “We keep the feedback loop tight: ideas move from whiteboard to user tests in days.
                The goal is trust—AI should feel like an intuitive teammate, not a black box.”
              </p>
              <div className="flex items-center gap-4 text-foreground">
                <div className="flex flex-col">
                  <span className="font-medium">Amadou & Albert</span>
                  <span className="text-xs text-primary/70 tracking-[0.35em] uppercase">
                    Co-Founders · DeeboAI
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-28 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div
            ref={ctaRef}
            className="reveal-element max-w-4xl mx-auto text-center rounded-3xl border border-border/70 bg-background/60 px-10 py-14 backdrop-blur space-y-6"
          >
            <p className="text-xs uppercase tracking-[0.35em] text-primary/70">
              Collaborate With Us
            </p>
            <h2 className="text-3xl font-semibold">
              Want to build with the founding team? Let's architect something extraordinary.
            </h2>
            <p className="text-muted-foreground">
              From strategic advisory to product co-creation, we partner with leaders who want to
              embed AI seamlessly into their workflows.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg">
                <Link to="/contact">Start a conversation</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="hover:bg-primary/10">
                <Link to="/services">View our capabilities</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Team;
