import { Link } from "react-router-dom";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import logoHeader from "@/assets/logo-header.svg";

const Disclaimer = () => {
  const lastUpdated = "April 8, 2026";

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-14 px-6">
          <Link to="/" className="flex items-center gap-2" aria-label="Back to home">
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            <img src={logoHeader} alt="cvZen" className="h-7 w-auto" />
          </Link>
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5 text-primary" />
            Disclaimer
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-12 max-w-3xl" role="main">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-2">Disclaimer</h1>
          <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
        </div>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground/85">

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. General Disclaimer</h2>
            <p className="text-sm">
              The information, tools, and services provided by cvZen are offered on an "as is" and "as available" basis. While we strive for accuracy and reliability, we make no warranties or representations, express or implied, regarding the completeness, accuracy, reliability, suitability, or availability of the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. AI & Automated Processing Disclaimer</h2>
            <div className="bg-muted rounded-lg p-4 text-sm space-y-2">
              <p><strong>Important:</strong> cvZen uses artificial intelligence and machine learning for resume parsing, ATS scoring, and generating improvement suggestions. You acknowledge that:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>AI-generated suggestions are <strong>advisory only</strong> and do not constitute professional career counseling, recruitment advice, or legal advice.</li>
                <li>ATS scores are <strong>indicative</strong> and may not reflect the scoring methodology of specific employer ATS systems.</li>
                <li>AI may occasionally produce inaccurate, incomplete, or biased results.</li>
                <li>You are solely responsible for reviewing, verifying, and deciding whether to act on AI-generated content.</li>
                <li>Improvement suggestions should be adapted to your specific context and career goals.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. No Employment Guarantee</h2>
            <p className="text-sm">
              cvZen does not guarantee any employment outcomes, job placements, interview invitations, or hiring decisions. The Platform is a tool to assist in resume optimization and talent discovery. Employment decisions remain solely with the hiring organizations and candidates.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Accuracy of Information</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-sm">
              <li>Resume parsing accuracy depends on document format, quality, and structure. We do not guarantee 100% accuracy in data extraction.</li>
              <li>Users are responsible for verifying the accuracy of parsed data in their digital profiles.</li>
              <li>Keyword analysis and skill matching are based on NLP models and may not capture every nuance of your expertise.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Third-Party Services</h2>
            <p className="text-sm">
              cvZen integrates with third-party services for payment processing, cloud hosting, and AI capabilities. We are not responsible for the availability, accuracy, or policies of third-party services. Your use of third-party services is subject to their respective terms and policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Financial Disclaimer</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-sm">
              <li>Payment processing is handled by PCI-DSS compliant third-party processors.</li>
              <li>cvZen is not a financial institution and does not provide financial advice.</li>
              <li>All financial transactions are subject to applicable regulations including RBI guidelines (India), PSD2 (EU), and relevant US federal/state regulations.</li>
              <li>Currency conversion rates are provided by payment processors and may differ from market rates.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Jurisdiction-Specific Disclaimers</h2>
            <h3 className="text-base font-semibold text-foreground mt-4 mb-2">India</h3>
            <p className="text-sm">
              This disclaimer is subject to the Consumer Protection Act, 2019, the Consumer Protection (E-Commerce) Rules, 2020, and the Information Technology Act, 2000. Nothing in this disclaimer overrides the statutory rights available to consumers under Indian law.
            </p>
            <h3 className="text-base font-semibold text-foreground mt-4 mb-2">European Union</h3>
            <p className="text-sm">
              For EU consumers, this disclaimer does not affect mandatory consumer protection rights under the Consumer Rights Directive 2011/83/EU, the Unfair Commercial Practices Directive 2005/29/EC, or applicable national laws. EU consumers may contact their national consumer protection authority.
            </p>
            <h3 className="text-base font-semibold text-foreground mt-4 mb-2">United States</h3>
            <p className="text-sm">
              This disclaimer is provided in compliance with applicable US federal and state consumer protection laws. Some states do not allow exclusion of implied warranties, so certain limitations may not apply to you. You may have additional rights that vary by state.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">8. Limitation of Liability</h2>
            <p className="text-sm">
              Under no circumstances shall cvZen, its directors, employees, or agents be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform, including but not limited to loss of data, loss of employment opportunities, or reliance on AI-generated content.
            </p>
            <p className="text-sm mt-2">
              This limitation applies to the fullest extent permitted by applicable law in your jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">9. Indemnification</h2>
            <p className="text-sm">
              You agree to indemnify and hold harmless cvZen from any claims, losses, or damages arising from: (a) your use of the Platform, (b) your violation of these terms, (c) your violation of any third-party rights, or (d) any content you upload to the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">10. External Links</h2>
            <p className="text-sm">
              The Platform may contain links to external websites. We do not endorse, control, or assume responsibility for the content or practices of any third-party websites. Accessing external links is at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">11. Force Majeure</h2>
            <p className="text-sm">
              cvZen shall not be liable for any failure or delay in performance due to circumstances beyond our reasonable control, including natural disasters, wars, pandemics, government actions, internet outages, or third-party service failures.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">12. Severability</h2>
            <p className="text-sm">
              If any provision of this disclaimer is found to be unenforceable or invalid under applicable law, such unenforceability shall not affect the validity of the remaining provisions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">13. Contact</h2>
            <div className="bg-muted rounded-lg p-4 text-sm">
              <p><strong>cvZen Legal</strong></p>
              <p>Email: legal@cvzen.ai</p>
              <p>For questions about this disclaimer, please contact us before using the Platform.</p>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-border flex flex-wrap gap-4 text-xs text-muted-foreground">
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
        </div>
      </main>
    </div>
  );
};

export default Disclaimer;
