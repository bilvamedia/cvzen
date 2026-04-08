import { Link } from "react-router-dom";
import { ArrowLeft, Check, X, Shield, Download, AlertTriangle } from "lucide-react";
import logoHeader from "@/assets/logo-header.svg";
import logoMain from "@/assets/logo-main.svg";
import brandIcon from "@/assets/brand-icon.png";
import brandMockup1 from "@/assets/brand-mockup1.png";
import brandMockup2 from "@/assets/brand-mockup2.png";

const BrandGuidelines = () => {
  const brandColors = [
    { name: "Background / Navy", hex: "#0a0a37", hsl: "240° 70% 13%", usage: "Primary backgrounds, dark surfaces" },
    { name: "Main / Azure", hex: "#1891db", hsl: "203° 76% 48%", usage: "CTAs, links, interactive elements" },
    { name: "Auxiliary 1 / Ice", hex: "#cfe2f3", hsl: "210° 56% 88%", usage: "Light backgrounds, cards, borders" },
    { name: "Auxiliary 2 / Deep Navy", hex: "#0a0a37", hsl: "240° 70% 13%", usage: "Text on light surfaces, accents" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back</span>
          </Link>
          <div className="h-5 w-px bg-border" />
          <img src={logoHeader} alt="cvZen" className="h-8 w-auto" />
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-16 space-y-24">
        {/* Hero */}
        <section className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Brand Guidelines</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Official usage standards for the cvZen brand identity. Follow these guidelines to maintain consistency across all touchpoints.
          </p>
          <p className="text-xs text-muted-foreground/60 uppercase tracking-widest">Version 1.0 · April 2026</p>
        </section>

        {/* Logo */}
        <section className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-2">Logo</h2>
            <p className="text-muted-foreground">The cvZen logo consists of the wordmark "cv" + the Z icon + "en". The logo must always be used as a single unit — never separate the icon from the text.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl p-12 flex items-center justify-center" style={{ background: '#0a0a37' }}>
              <img src={logoHeader} alt="cvZen on dark" className="h-12 w-auto" />
            </div>
            <div className="rounded-2xl border border-border p-12 flex items-center justify-center bg-white">
              <img src={logoMain} alt="cvZen on light" className="h-12 w-auto" />
            </div>
          </div>

          {/* Icon */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Brand Icon</h3>
            <p className="text-muted-foreground text-sm">The Z icon may be used independently as an app icon, favicon, or avatar only. Maintain spacing of at least r around the icon, where r = 1/3 the unit square.</p>
            <div className="flex gap-6 items-center">
              <div className="rounded-2xl p-8 flex items-center justify-center" style={{ background: '#0a0a37' }}>
                <img src={brandIcon} alt="cvZen icon" className="h-20 w-20 rounded-xl" />
              </div>
            </div>
          </div>
        </section>

        {/* Colors */}
        <section className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-2">Color Palette</h2>
            <p className="text-muted-foreground">These are the only approved brand colors. All digital and print materials must use this palette exclusively.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {brandColors.map((c) => (
              <div key={c.name} className="rounded-xl border border-border overflow-hidden">
                <div className="h-28" style={{ background: c.hex }} />
                <div className="p-4 space-y-1">
                  <p className="font-semibold text-sm">{c.name}</p>
                  <p className="text-xs font-mono text-muted-foreground">{c.hex}</p>
                  <p className="text-xs font-mono text-muted-foreground">{c.hsl}</p>
                  <p className="text-xs text-muted-foreground mt-2">{c.usage}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Typography */}
        <section className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-2">Typography</h2>
            <p className="text-muted-foreground">Consistent type creates a professional, trustworthy presence.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-border p-8 space-y-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Logo Font</p>
              <p className="text-3xl font-bold" style={{ fontFamily: "'Russo One', sans-serif" }}>Russo One</p>
              <p className="text-sm text-muted-foreground">Used exclusively in the cvZen logotype. Do not use for body text or UI elements.</p>
            </div>
            <div className="rounded-xl border border-border p-8 space-y-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Body Font</p>
              <p className="text-3xl font-bold">Plus Jakarta Sans</p>
              <p className="text-sm text-muted-foreground">Primary typeface for all UI, marketing, and documentation. Variable weight from 200–800.</p>
            </div>
          </div>
        </section>

        {/* Brand in Use */}
        <section className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-2">Brand in Use</h2>
            <p className="text-muted-foreground">Examples of approved brand applications across merchandise and print collateral.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <img src={brandMockup1} alt="cvZen brand merchandise" className="rounded-2xl w-full object-cover border border-border" />
            <img src={brandMockup2} alt="cvZen business card" className="rounded-2xl w-full object-cover border border-border" />
          </div>
        </section>

        {/* Do's and Don'ts */}
        <section className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-2">Usage Rules</h2>
            <p className="text-muted-foreground">Follow these rules to protect brand integrity.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Do's */}
            <div className="rounded-xl border border-border p-8 space-y-5">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Check className="h-4 w-4 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold text-green-600">Do</h3>
              </div>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> Use the logo in approved colors only (full-color, white, or navy)</li>
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> Maintain minimum clear space (r = 1/3 icon width) around the logo</li>
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> Use the icon independently only for app icons, favicons, or avatars</li>
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> Place the logo on solid backgrounds with sufficient contrast</li>
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> Use Plus Jakarta Sans for all body and UI text</li>
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> Refer to the product as "cvZen" (lowercase "cv", uppercase "Z")</li>
              </ul>
            </div>

            {/* Don'ts */}
            <div className="rounded-xl border border-border p-8 space-y-5">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center">
                  <X className="h-4 w-4 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-red-600">Don't</h3>
              </div>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><X className="h-4 w-4 text-red-500 mt-0.5 shrink-0" /> Alter, rotate, stretch, or distort the logo in any way</li>
                <li className="flex items-start gap-2"><X className="h-4 w-4 text-red-500 mt-0.5 shrink-0" /> Change logo colors or apply gradients, shadows, or effects</li>
                <li className="flex items-start gap-2"><X className="h-4 w-4 text-red-500 mt-0.5 shrink-0" /> Place the logo on busy, patterned, or low-contrast backgrounds</li>
                <li className="flex items-start gap-2"><X className="h-4 w-4 text-red-500 mt-0.5 shrink-0" /> Separate the icon from the wordmark in marketing materials</li>
                <li className="flex items-start gap-2"><X className="h-4 w-4 text-red-500 mt-0.5 shrink-0" /> Use "CVZEN", "CvZen", "Cvzen", or any other capitalization</li>
                <li className="flex items-start gap-2"><X className="h-4 w-4 text-red-500 mt-0.5 shrink-0" /> Recreate the logo using any typeface, including Russo One</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Permissions & Conditions */}
        <section className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-2">Permissions & Conditions</h2>
            <p className="text-muted-foreground">Usage of cvZen brand assets is governed by the following terms.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-border p-6 space-y-4">
              <Shield className="h-8 w-8 text-primary" />
              <h3 className="font-semibold">Trademark Protection</h3>
              <p className="text-sm text-muted-foreground">
                "cvZen", the Z icon, and "Intelligent Hiring OS" are registered trademarks of cvZen Technologies. All rights reserved. Unauthorized use constitutes infringement under the Trade Marks Act, 1999 (India), EU Trademark Regulation, and the Lanham Act (US).
              </p>
            </div>

            <div className="rounded-xl border border-border p-6 space-y-4">
              <Download className="h-8 w-8 text-primary" />
              <h3 className="font-semibold">Permitted Use</h3>
              <p className="text-sm text-muted-foreground">
                Partners, media, and integrators may use cvZen brand assets solely for accurate, factual references (e.g., press articles, integration pages). Prior written approval is required for all commercial use. Assets must not be modified and must link back to cvzen.ai.
              </p>
            </div>

            <div className="rounded-xl border border-border p-6 space-y-4">
              <AlertTriangle className="h-8 w-8 text-primary" />
              <h3 className="font-semibold">Prohibited Use</h3>
              <p className="text-sm text-muted-foreground">
                Do not use cvZen marks to imply endorsement, sponsorship, or affiliation without written consent. Do not incorporate into third-party product names, domain names, social handles, or merchandise. Violation may result in legal action.
              </p>
            </div>
          </div>
        </section>

        {/* Anti-Misuse */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold">Avoiding Misuse</h2>
          <div className="rounded-xl border border-border p-8 space-y-6">
            <div className="space-y-4 text-sm text-muted-foreground">
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">1. No Implied Endorsement</h3>
                <p>Never use the cvZen name, logo, or brand elements in a manner that suggests partnership, endorsement, or sponsorship unless a formal agreement exists.</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">2. No Derivative Works</h3>
                <p>Creating logos, icons, or brand marks that are confusingly similar to cvZen assets is strictly prohibited. This includes parodies that may damage brand reputation.</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">3. No Misleading Context</h3>
                <p>Do not present cvZen marks alongside competing products in a way that implies equivalence or interoperability without written consent.</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">4. Digital Compliance</h3>
                <p>Do not use cvZen trademarks in meta tags, ad keywords, SEO content, or domain names to mislead search engines or consumers. This includes cybersquatting under ICANN's UDRP.</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">5. Reporting Misuse</h3>
                <p>If you discover unauthorized use of cvZen brand assets, please report it to <span className="text-primary font-medium">legal@cvzen.ai</span>. We take brand protection seriously and will pursue appropriate legal remedies.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Jurisdiction */}
        <section className="rounded-xl border border-border p-8 space-y-4">
          <h2 className="text-xl font-bold">Governing Jurisdiction</h2>
          <p className="text-sm text-muted-foreground">
            These brand guidelines and all associated intellectual property rights are governed by Indian law (Trade Marks Act 1999, Copyright Act 1957), EU Intellectual Property Office (EUIPO) regulations, and United States Patent and Trademark Office (USPTO) standards. Any disputes arising from misuse shall be subject to the exclusive jurisdiction of the courts in New Delhi, India, with recognition of applicable international treaties including the Madrid Protocol and Paris Convention.
          </p>
        </section>

        {/* Contact */}
        <section className="text-center space-y-4 pb-8">
          <h2 className="text-xl font-bold">Need Brand Assets?</h2>
          <p className="text-muted-foreground text-sm">
            For press kits, high-resolution logos, or brand partnership inquiries, contact us at{" "}
            <a href="mailto:brand@cvzen.ai" className="text-primary hover:underline">brand@cvzen.ai</a>
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} cvZen Technologies. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="/disclaimer" className="hover:text-foreground transition-colors">Disclaimer</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BrandGuidelines;
