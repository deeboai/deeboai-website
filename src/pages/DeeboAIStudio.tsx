import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import heroVideo from "@/assets/deeboai_page/deebo_ai_cover.mov";
import dawImage from "@/assets/deeboai_page/daw_picture.jpg";
import rapperImage from "@/assets/deeboai_page/rapper_in_studio.jpg";
import writingImage from "@/assets/deeboai_page/writing_lyrics.jpg";
import djBackground from "@/assets/deeboai_page/dj_in_studio.jpg";
import kendrickExplicit from "@/assets/deeboai_page/kendrick-explicit.mov";
import kendrickClean from "@/assets/deeboai_page/kendrick_clean.mov";
import coleExplicit from "@/assets/deeboai_page/j.-cole.clean.mov";
import coleClean from "@/assets/deeboai_page/j.-cole-clean.mov";
import { Sparkles } from "lucide-react";

const services = [
  {
    title: "AI-powered Audio Censoring",
    description:
      "Instantly detect and intelligently mute explicit phrases without disrupting the mix. Our models understand context across 50+ languages and dialects.",
    image: dawImage,
  },
  {
    title: "AI Imputation Technology",
    description:
      "Seamless interpolation fills gaps created by censoring, preserving timing, emotion, and clarity so audiences hear the intended performance.",
    image: rapperImage,
  },
  {
    title: "Dynamic Lyric Generation",
    description:
      "Suggest clean lyric alternatives on the fly, tuned to the artist’s cadence and delivery so teams ship clean edits faster.",
    image: writingImage,
  },
];

const demonstrationTracks = [
  {
    title: "Not Like Us",
    artist: "Kendrick Lamar",
    explicit: kendrickExplicit,
    clean: kendrickClean,
  },
  {
    title: "1985",
    artist: "J. Cole",
    explicit: coleExplicit,
    clean: coleClean,
  },
];

const testimonialPlaceholders = [
  {
    quote:
      "“All I have to say is that I am amazed that there are no automatic censor plugins already available in the market. This is something we do quite often for albums and it’s not at all uncommon to see.”",
    role: "David Toledo · Producer, Chicago IL",
    image: dawImage,
  },
];

const DeeboAIStudio = () => {
  const heroBadgeRef = useScrollReveal<HTMLSpanElement>({ threshold: 0.1 });
  const heroHeadingRef = useScrollReveal<HTMLHeadingElement>({ threshold: 0.1 });
  const heroSubtitleRef = useScrollReveal<HTMLHeadingElement>({ threshold: 0.1 });
  const heroParagraphRef = useScrollReveal<HTMLParagraphElement>({ threshold: 0.1 });
  const heroCtaRef = useScrollReveal<HTMLDivElement>({ threshold: 0.1 });
  const servicesHeadingRef = useScrollReveal<HTMLDivElement>({ threshold: 0.2 });
  const servicesRef = useScrollReveal<HTMLDivElement>({ threshold: 0.2 });
  const demoHeadingRef = useScrollReveal<HTMLDivElement>({ threshold: 0.2 });
  const demoRef = useScrollReveal<HTMLDivElement>({ threshold: 0.2 });
  const testimonialsHeadingRef = useScrollReveal<HTMLDivElement>({ threshold: 0.15 });
  const carouselRef = useScrollReveal<HTMLDivElement>({ threshold: 0.15 });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24">
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-70"
          src={heroVideo}
          autoPlay
          loop
          muted
          playsInline
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/75 to-background" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <span
              ref={heroBadgeRef}
              className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-background/70 px-5 py-2 text-xs uppercase tracking-[0.35em] text-primary/80"
            >
              <Sparkles className="h-4 w-4" />
              DeeboAI Studio
            </span>
            <h1
              ref={heroHeadingRef}
              className="text-4xl md:text-6xl font-bold leading-tight"
            >
              Revolutionizing
            </h1>
            <h1
              ref={heroHeadingRef}
              className="text-4xl md:text-6xl font-bold leading-tight"
            >
              <span className="text-gradient">AI-powered Audio Editing</span>
            </h1>
            <h2
              ref={heroSubtitleRef}
              className="text-2xl md:text-3xl text-muted-foreground"
            >
              Right in Your DAW
            </h2>
            <p ref={heroParagraphRef} className="text-lg text-muted-foreground leading-relaxed">
              DeeboAI Studio automates explicit content editing, reconstructs pristine audio, and keeps
              your creative intent front and center—whether you are prepping for broadcast, sync, or
              global streaming.
            </p>
            <div
              ref={heroCtaRef}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button size="lg" className="hover:shadow-lg hover:shadow-primary/40">
                Request Early Access
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="hover:bg-primary/10 hover:text-primary"
              >
                View Product Roadmap
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div
            ref={servicesHeadingRef}
            className="max-w-3xl mx-auto text-center space-y-4 mb-16"
          >
            <h3 className="text-3xl font-semibold">Precision tooling for modern audio teams</h3>
            <p className="text-muted-foreground">
              Each capability is crafted with mixers, editors, and compliance teams embedded in our
              build loop.
            </p>
          </div>

          <div
            ref={servicesRef}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {services.map((service) => (
              <div
                key={service.title}
                className="group relative overflow-hidden rounded-3xl border border-border/70 bg-card/90 backdrop-blur"
              >
                <div className="h-48 overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="space-y-4 px-7 py-8">
                  <h4 className="text-xl font-semibold text-foreground">{service.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4 space-y-12">
          <div
            ref={demoHeadingRef}
            className="max-w-3xl mx-auto text-center space-y-4"
          >
            <h3 className="text-3xl font-semibold">
              Cut an <span className="text-destructive font-bold">hour</span> of work down to{" "}
              <span className="text-primary font-bold">15 seconds</span> with 50+ languages.
            </h3>
            <p className="text-muted-foreground text-base">
              See DeeboAI Studio transform explicit tracks into clean releases—maintaining energy,
              timing, and clarity automatically.
            </p>
          </div>

          <div ref={demoRef} className="space-y-12">
            <div className="space-y-4">
              <p className="text-lg font-semibold text-center text-muted-foreground">
                Start with an{" "}
                <span className="font-semibold text-destructive uppercase tracking-wide">explicit</span>{" "}
                version.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {demonstrationTracks.map((track) => (
                  <div
                    key={`${track.title}-explicit`}
                    className="rounded-3xl border border-border/60 bg-secondary/40 p-5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground/70">
                          {track.artist}
                        </p>
                        <p className="font-semibold text-sm">{track.title}</p>
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-[0.35em] text-destructive">
                        Explicit
                      </span>
                    </div>
                    <video
                      className="w-full rounded-2xl border border-border/50"
                      controls
                      preload="metadata"
                      playsInline
                    >
                      <source src={track.explicit} type="video/mp4" />
                    </video>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-lg font-semibold text-center text-muted-foreground">
                Make it{" "}
                <span className="font-semibold text-primary uppercase tracking-wide">clean</span>{" "}
                with a single pass.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {demonstrationTracks.map((track) => (
                  <div
                    key={`${track.title}-clean`}
                    className="rounded-3xl border border-border/60 bg-secondary/40 p-5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground/70">
                          {track.artist}
                        </p>
                        <p className="font-semibold text-sm">{track.title}</p>
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">
                        Clean
                      </span>
                    </div>
                    <video
                      className="w-full rounded-2xl border border-border/50"
                      controls
                      preload="metadata"
                      playsInline
                    >
                      <source src={track.clean} type="video/mp4" />
                    </video>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-sm text-muted-foreground/80 text-center pt-4">
              Credits: “Not Like Us” by Kendrick Lamar · “1985” by J. Cole.
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-24">
        <div className="absolute inset-0">
          <img
            src={djBackground}
            alt="DJ in studio background"
            className="h-full w-full object-cover opacity-40"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/80 to-background" />
        </div>
        <div className="container mx-auto px-4 relative">
          <div
            ref={testimonialsHeadingRef}
            className="max-w-3xl mx-auto text-center space-y-4 mb-12"
          >
            <h3 className="text-3xl font-semibold text-foreground">Testimonials</h3>
            <p className="text-muted-foreground">
              Drop real-world feedback from your engineers, editors, and label partners.
            </p>
          </div>

          <div ref={carouselRef}>
            <Carousel className="relative">
              <CarouselContent className="-ml-4">
                {testimonialPlaceholders.map((testimonial, index) => (
                  <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                    <div className="relative h-full overflow-hidden rounded-3xl border border-border/60">
                      <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${testimonial.image})` }}
                      />
                      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
                      <div className="relative h-full p-6 text-left flex flex-col justify-between">
                        <p className="text-sm leading-relaxed text-muted-foreground mb-4">
                          {testimonial.quote}
                        </p>
                        <p className="text-xs uppercase tracking-[0.35em] text-primary/70">
                          {testimonial.role}
                        </p>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex" />
              <CarouselNext className="hidden md:flex" />
            </Carousel>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default DeeboAIStudio;
