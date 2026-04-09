import { Link } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import logoHeader from "@/assets/logo-header.svg";

const Terms = () => {
  const lastUpdated = "April 8, 2026";

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-white/[0.08]" style={{ background: 'hsl(240 55% 16%)' }}>
        <div className="container mx-auto flex items-center justify-between h-16 px-6">
          <Link to="/" className="flex items-center gap-2" aria-label="Back to home">
            <ArrowLeft className="h-4 w-4 text-white/60" />
            <img src={logoHeader} alt="cvZen" className="h-10 w-auto" />
          </Link>
          <div className="flex items-center gap-1.5 text-xs font-medium text-white/60">
            <FileText className="h-3.5 w-3.5 text-primary" />
            Terms of Service
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-12 max-w-3xl" role="main">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Governed by the laws of India. Applicable globally.
          </p>
        </div>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground/85">

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p className="text-sm">
              By accessing or using cvZen ("Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, you must not use the Platform. These Terms constitute a legally binding agreement between you and cvZen.
            </p>
            <p className="text-sm mt-2">
              These Terms are governed by the <strong>Indian Contract Act, 1872</strong>, the <strong>Information Technology Act, 2000</strong>, and applicable rules thereunder, while also respecting EU and US consumer protection standards.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. Eligibility</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-sm">
              <li>You must be at least 18 years of age to use the Platform.</li>
              <li>By using the Platform, you represent that you have the legal capacity to enter into these Terms.</li>
              <li>If using on behalf of an organization, you represent that you have authority to bind that organization.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. Services</h2>
            <p className="text-sm">cvZen provides:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-sm mt-2">
              <li>AI-powered resume parsing and digital profile creation</li>
              <li>ATS (Applicant Tracking System) scoring with section-wise analysis</li>
              <li>AI-generated resume improvement suggestions</li>
              <li>Semantic candidate search for recruiters</li>
              <li>Job posting and talent pipeline management</li>
            </ul>
            <p className="text-sm mt-2">
              We reserve the right to modify, suspend, or discontinue any feature with 30 days prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. User Accounts</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-sm">
              <li>You are responsible for maintaining the confidentiality of your credentials.</li>
              <li>You must provide accurate, current, and complete information during registration.</li>
              <li>You must notify us immediately of any unauthorized access or security breach.</li>
              <li>One person or entity may not maintain multiple accounts without prior written approval.</li>
              <li>We may suspend or terminate accounts that violate these Terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. User Content & Intellectual Property</h2>
            <h3 className="text-base font-semibold text-foreground mt-4 mb-2">5.1 Your Content</h3>
            <p className="text-sm">
              You retain ownership of all content you upload (resumes, profile information, etc.). By uploading content, you grant cvZen a limited, non-exclusive, royalty-free license to process, store, and display your content solely for providing the Services.
            </p>
            <h3 className="text-base font-semibold text-foreground mt-4 mb-2">5.2 Platform IP</h3>
            <p className="text-sm">
              The Platform, its design, features, AI models, algorithms, and all related intellectual property are owned by cvZen. You may not copy, modify, reverse-engineer, or create derivative works from any part of the Platform.
            </p>
            <h3 className="text-base font-semibold text-foreground mt-4 mb-2">5.3 AI-Generated Content</h3>
            <p className="text-sm">
              Improvement suggestions and AI-generated content provided by the Platform are tools to assist you. You are responsible for reviewing and using such content at your own discretion. cvZen does not guarantee the accuracy or suitability of AI-generated suggestions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Payments, Subscriptions & Taxes</h2>
            <h3 className="text-base font-semibold text-foreground mt-4 mb-2">6.1 Pricing</h3>
            <ul className="list-disc pl-5 space-y-1.5 text-sm">
              <li>Prices are displayed in the applicable currency (INR for Indian users, USD/EUR for international users).</li>
              <li>All prices for Indian users are inclusive of GST (18%) as per the Goods and Services Tax Act, 2017.</li>
              <li>International pricing excludes local taxes where applicable.</li>
            </ul>
            <h3 className="text-base font-semibold text-foreground mt-4 mb-2">6.2 Payment Processing</h3>
            <ul className="list-disc pl-5 space-y-1.5 text-sm">
              <li><strong>India:</strong> Payments processed via RBI-regulated payment gateways (UPI, Net Banking, Cards, Wallets). Compliant with RBI guidelines on digital payments.</li>
              <li><strong>International:</strong> Payments processed via PCI-DSS Level 1 compliant processors.</li>
              <li>Auto-renewal: Subscriptions auto-renew unless cancelled at least 24 hours before the renewal date.</li>
            </ul>
            <h3 className="text-base font-semibold text-foreground mt-4 mb-2">6.3 Invoicing</h3>
            <p className="text-sm">
              Tax invoices will be issued in compliance with GST regulations for Indian users and applicable tax laws for international users. Invoices are available in your account dashboard.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Refund & Cancellation Policy</h2>
            <div className="bg-muted rounded-lg p-4 text-sm space-y-3">
              <h3 className="font-semibold text-foreground">India (Consumer Protection Act, 2019 & E-Commerce Rules, 2020)</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Full refund within <strong>7 days</strong> of purchase if no services have been consumed.</li>
                <li>Pro-rata refund within <strong>30 days</strong> if service quality is materially deficient.</li>
                <li>Refunds processed to original payment method within <strong>5-7 business days</strong>.</li>
                <li>GST refunds handled as per GST Act provisions.</li>
              </ul>

              <h3 className="font-semibold text-foreground mt-3">EU (Consumer Rights Directive 2011/83/EU)</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>14-day cooling-off period</strong> for digital services (right of withdrawal).</li>
                <li>If you consented to immediate performance and acknowledged loss of withdrawal right, partial refund may apply.</li>
                <li>Refunds processed within <strong>14 days</strong> of withdrawal request.</li>
              </ul>

              <h3 className="font-semibold text-foreground mt-3">United States</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Full refund within <strong>30 days</strong> of purchase — no questions asked.</li>
                <li>After 30 days, pro-rata refund for unused subscription period.</li>
                <li>Refunds processed within <strong>5-10 business days</strong>.</li>
              </ul>

              <p className="mt-3 text-xs text-muted-foreground">
                To request a refund, email <strong>billing@cvzen.ai</strong> with your account details and reason for refund.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">8. Prohibited Activities</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-sm">
              <li>Uploading false, misleading, or fraudulent resume information.</li>
              <li>Scraping, crawling, or automated data extraction from the Platform.</li>
              <li>Attempting to reverse-engineer AI models or algorithms.</li>
              <li>Uploading malicious files, viruses, or harmful content.</li>
              <li>Using the Platform for any unlawful purpose.</li>
              <li>Impersonating another person or misrepresenting your affiliation.</li>
              <li>Circumventing rate limits, access controls, or security measures.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">9. Limitation of Liability</h2>
            <p className="text-sm">
              To the maximum extent permitted by applicable law:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-sm mt-2">
              <li>cvZen shall not be liable for indirect, incidental, special, or consequential damages.</li>
              <li>Our total liability shall not exceed the amount paid by you in the 12 months preceding the claim.</li>
              <li>We do not guarantee employment outcomes, interview selections, or hiring decisions based on the use of our Platform.</li>
              <li>AI-generated suggestions are advisory only and do not constitute professional career advice.</li>
            </ul>
            <p className="text-sm mt-2">
              <strong>For Indian users:</strong> This clause is subject to the Consumer Protection Act, 2019, and does not limit liability for gross negligence or willful misconduct.
            </p>
            <p className="text-sm mt-1">
              <strong>For EU users:</strong> Nothing in these Terms limits liability for death, personal injury caused by negligence, fraud, or fraudulent misrepresentation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">10. Dispute Resolution</h2>
            <h3 className="text-base font-semibold text-foreground mt-4 mb-2">10.1 Governing Law</h3>
            <p className="text-sm">
              These Terms are governed by the laws of India. For EU users, mandatory consumer protection laws of your country of residence also apply.
            </p>
            <h3 className="text-base font-semibold text-foreground mt-4 mb-2">10.2 Arbitration (India)</h3>
            <p className="text-sm">
              Disputes shall be resolved through arbitration under the Arbitration and Conciliation Act, 1996, seated in Bengaluru, India. The language of arbitration shall be English.
            </p>
            <h3 className="text-base font-semibold text-foreground mt-4 mb-2">10.3 Consumer Forums</h3>
            <p className="text-sm">
              Indian consumers retain the right to approach the appropriate Consumer Dispute Redressal Commission under the Consumer Protection Act, 2019. EU consumers may use the EU Online Dispute Resolution platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">11. Termination</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-sm">
              <li>You may terminate your account at any time from your account settings.</li>
              <li>We may suspend or terminate your account for violation of these Terms with prior notice (except in cases of fraud or illegal activity).</li>
              <li>Upon termination, your data will be handled as described in our Privacy Policy.</li>
              <li>Provisions on IP, liability, and dispute resolution survive termination.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">12. Changes to Terms</h2>
            <p className="text-sm">
              We may update these Terms with 30 days prior notice via email or platform notification. Continued use after the effective date constitutes acceptance. Material changes require explicit consent for Indian and EU users.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">13. Contact</h2>
            <div className="bg-muted rounded-lg p-4 text-sm">
              <p><strong>cvZen Legal</strong></p>
              <p>Email: legal@cvzen.ai</p>
              <p>For billing disputes: billing@cvzen.ai</p>
              <p>For Indian consumer grievances: grievance@cvzen.ai</p>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-border flex flex-wrap gap-4 text-xs text-muted-foreground">
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <Link to="/disclaimer" className="hover:text-foreground transition-colors">Disclaimer</Link>
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
        </div>
      </main>
    </div>
  );
};

export default Terms;
