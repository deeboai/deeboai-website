"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GOOGLE_APPOINTMENT_SCHEDULING_URL } from "@/lib/contact";

const logoMark = "/assets/logos/white_on_black_no_background.png";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const pathname = usePathname() ?? "/";

  // Nested Academy pages should keep the top-level Academy link active while the user moves
  // through pricing, FAQ, legal, and intake routes.
  const isLinkActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }

    if (path === "/services") {
      return pathname === "/services" || pathname.startsWith("/services/") || pathname === "/managed-presence";
    }

    return pathname === path || pathname.startsWith(`${path}/`);
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min(currentScroll / docHeight, 1) : 0;
      setIsScrolled(currentScroll > 48);
      setScrollProgress(progress);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Services", path: "/services" },
    { name: "Products", path: "/products" },
    { name: "Partners", path: "/partners" },
    { name: "Team", path: "/team" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-[60]">
      <div
        className={`relative transition-all duration-300 ${
          isScrolled
            ? "bg-background/90 backdrop-blur-xl border-b border-border shadow-lg shadow-primary/10"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4 relative">
          <div className="flex min-h-16 items-center justify-between py-3 sm:min-h-[4.5rem] md:min-h-20">
            <Link href="/" className="flex items-center space-x-3 group">
              <img
                src={logoMark}
                alt="Deebo brand"
                className="h-10 w-auto transition-transform duration-300 group-hover:scale-105 sm:h-11 md:h-14"
              />
            </Link>

            {/* Keep the compact mobile drawer through tablet widths so the nav never feels crowded. */}
            <div className="hidden lg:flex items-center space-x-8">
              {navLinks.map((link) => {
                const isActive = isLinkActive(link.path);
                const className = `relative text-sm font-medium transition-all duration-200 hover:text-primary ${
                  isActive ? "text-primary" : "text-foreground/80"
                }`;

                return (
                  <Link key={link.path} href={link.path} className={className}>
                    <span className="relative z-10">{link.name}</span>
                    <span
                      className={`absolute inset-x-0 -bottom-1 h-0.5 rounded-full bg-primary transition-opacity duration-200 ${
                        isActive ? "opacity-100" : "opacity-0 group-hover:opacity-60"
                      }`}
                    />
                  </Link>
                );
              })}
              <Button asChild variant="outline" size="sm">
                <a href={GOOGLE_APPOINTMENT_SCHEDULING_URL} target="_blank" rel="noreferrer">
                  Book a Call
                </a>
              </Button>
              <Button
                asChild
                variant="default"
                size="sm"
                className="hover:shadow-lg hover:shadow-primary/40 transition-all duration-300"
              >
                <Link href="/start">Start a Project</Link>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="rounded-full border border-border/70 bg-background/70 p-2 lg:hidden"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-background/95 backdrop-blur">
            <div className="container mx-auto space-y-4 px-4 py-4">
              {navLinks.map((link) => {
                const className = `block rounded-2xl px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary/60 hover:text-primary ${
                  isLinkActive(link.path) ? "text-primary" : "text-foreground/80"
                }`;

                return (
                  <Link key={link.path} href={link.path} className={className}>
                    {link.name}
                  </Link>
                );
              })}
              <Button asChild variant="default" size="sm" className="w-full">
                <Link href="/start">Start a Project</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="w-full">
                <a href={GOOGLE_APPOINTMENT_SCHEDULING_URL} target="_blank" rel="noreferrer">
                  Book a Call
                </a>
              </Button>
            </div>
          </div>
        )}
      </div>
      <div
        className="h-[2px] bg-gradient-to-r from-primary via-accent to-primary/60 origin-left transition-transform duration-300 ease-out"
        style={{ transform: `scaleX(${Math.max(scrollProgress, 0.02)})` }}
      />
    </nav>
  );
};

export default Navbar;
