import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoMark from "@/assets/logos/white_on_black_no_background.png";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const location = useLocation();

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
  }, [location.pathname]);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Services", path: "/services" },
    { name: "Products", path: "/products" },
    { name: "DeeboAI Studio", path: "/deeboai-studio" },
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
        <div className="absolute inset-0 pointer-events-none hidden md:block">
          <div className="h-full w-full animated-aurora opacity-60" />
        </div>

        <div className="container mx-auto px-4 relative">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center space-x-3 group">
              <img
                src={logoMark}
                alt="DeeboAI brand"
                className="h-20 w-auto transition-transform duration-300 group-hover:scale-105"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative text-sm font-medium transition-all duration-200 hover:text-primary ${
                    location.pathname === link.path ? "text-primary" : "text-foreground/80"
                  }`}
                >
                  <span className="relative z-10">{link.name}</span>
                  <span
                    className={`absolute inset-x-0 -bottom-1 h-0.5 rounded-full bg-primary transition-opacity duration-200 ${
                      location.pathname === link.path ? "opacity-100" : "opacity-0 group-hover:opacity-60"
                    }`}
                  />
                </Link>
              ))}
              <Button
                asChild
                variant="default"
                size="sm"
                className="hover:shadow-lg hover:shadow-primary/40 transition-all duration-300"
              >
                <a href="https://calendly.com/etoure33/30min" target="_blank" rel="noreferrer">
                  Request a Consultation
                </a>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background/95 backdrop-blur">
            <div className="container mx-auto px-4 py-4 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block text-sm font-medium transition-colors hover:text-primary ${
                    location.pathname === link.path ? "text-primary" : "text-foreground/80"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <Button asChild variant="default" size="sm" className="w-full">
                <a href="https://calendly.com/etoure33/30min" target="_blank" rel="noreferrer">
                  Request a Consultation
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
