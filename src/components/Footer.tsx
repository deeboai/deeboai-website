import Link from "next/link";

const logoMark = "/assets/logos/white_on_black_no_background.png";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        {/* Two columns at mid widths prevent the footer columns from collapsing into cramped text blocks. */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
          {/* Company Info */}
          <div className="space-y-4">
            <img src={logoMark} alt="DeeboAI brand" className="h-20 w-auto" loading="lazy" />
            <p className="text-sm text-muted-foreground">
              Building AI systems that work where it matters.
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Minneapolis, MN ·{" "}
              <a
                href="mailto:support@deeboai.com"
                className="break-all underline underline-offset-2 hover:text-primary transition-colors"
              >
                support@deeboai.com
              </a>
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <a
                  href="https://academy.deeboai.com"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Academy
                </a>
              </li>
              <li>
                <Link href="/team" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Team
                </Link>
              </li>
              <li>
                <Link href="/partners" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Partners
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold mb-4">Services</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/services" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  AI Systems
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Website Consulting
                </Link>
              </li>
              <li>
                <Link
                  href="/managed-presence"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Managed Presence
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  SaaS Solutions
                </Link>
              </li>
            </ul>
          </div>

          {/* Products */}
          <div>
            <h4 className="font-semibold mb-4">Products</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/products" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  ZynthRx
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  MyelomaRisk
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Custom AI Solutions
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} DeeboAI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
