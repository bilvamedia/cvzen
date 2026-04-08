import { Link } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import logoHeader from "@/assets/logo-header.svg";

const Privacy = () => {
  const lastUpdated = "April 8, 2026";

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-14 px-6">
          <Link to="/" className="flex items-center gap-2" aria-label="Back to home">
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            <img src={logoHeader} alt="cvZen" className="h-7 w-auto" />
          </Link>
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Shield className="h-3.5 w-3.5 text-primary" />
            Privacy Policy
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-12 max-w-3xl" role="main">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Effective across India (DPDP Act 2023), EU (GDPR), and United States (CCPA/CPRA).
          </p>
        </div>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground/85">

          <section aria-labelledby="intro">
            <h2 id="intro" className="text-xl font-semibold text-foreground mb-3">1. Introduction</h2>
            <p>
              cvZen ("we", "our", "us") operates the cvZen platform — an Intelligent Hiring OS. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal data when you use our website and services.
            </p>
            <p>
              We are committed to compliance with the <strong>Digital Personal Data Protection Act, 2023 (India)</strong>, the <strong>General Data Protection Regulation (EU GDPR)</strong>, the <strong>California Consumer Privacy Act (CCPA/CPRA)</strong>, and other applicable data protection laws.
            </p>
          </section>

          <section aria-labelledby="data-collected">
            <h2 id="data-collected" className="text-xl font-semibold text-foreground mb-3">2. Data We Collect</h2>
            <h3 className="text-base font-semibold text-foreground mt-4 mb-2">2.1 Information You Provide</h3>
            <ul className="list-disc pl-5 space-y-1.5 text-sm">
              <li><strong>Account Data:</strong> Name, email address, password (hashed), role (candidate/recruiter).</li>
              <li><strong>Profile Data:</strong> Phone number, address, bio, headline, social links, avatar photo.</li>
              <li><strong>Resume Data:</strong> Uploaded resumes (PDF, DOCX), parsed content including education, work experience, skills, certifications, and projects.</li>
              <li><strong>Payment Data:</strong> Billing address, payment method details processed via third-party payment processors (Razorpay for India, Stripe for international). We do not store full card numbers.</li>
            </ul>
            <h3 className="text-base font-semibold text-foreground mt-4 mb-2">2.2 Automatically Collected Data</h3>
            <ul className="list-disc pl-5 space-y-1.5 text-sm">
              <li><strong>Usage Data:</strong> Pages visited, features used, ATS scores generated, sections improved.</li>
              <li><strong>Device Data:</strong> IP address, browser type, operating system, device identifiers.</li>
              <li><strong>Cookies:</strong> Essential cookies for authentication and session management. Analytics cookies (with consent).</li>
            </ul>
          </section>

          <section aria-labelledby="purpose">
            <h2 id="purpose" className="text-xl font-semibold text-foreground mb-3">3. Purpose of Processing</h2>
            <p className="text-sm">We process your personal data for the following lawful purposes:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-sm mt-2">
              <li><strong>Service Delivery:</strong> Resume parsing, ATS scoring, digital profile creation, job matching.</li>
              <li><strong>AI Processing:</strong> Using machine learning models to analyze resume content, generate improvement suggestions, and perform semantic search. AI processing is performed on our secure infrastructure.</li>
              <li><strong>Communication:</strong> Service updates, security alerts, and (with consent) marketing communications.</li>
              <li><strong>Legal Compliance:</strong> Tax records, fraud prevention, law enforcement requests.</li>
              <li><strong>Payment Processing:</strong> Subscription management, invoicing, refund processing.</li>
            </ul>
          </section>

          <section aria-labelledby="legal-basis">
            <h2 id="legal-basis" className="text-xl font-semibold text-foreground mb-3">4. Legal Basis for Processing</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-muted">
                    <th className="text-left p-3 font-semibold text-foreground">Jurisdiction</th>
                    <th className="text-left p-3 font-semibold text-foreground">Legal Basis</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border">
                    <td className="p-3 font-medium">India (DPDP Act 2023)</td>
                    <td className="p-3">Consent of the Data Principal; Legitimate Uses under Section 7</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="p-3 font-medium">EU (GDPR)</td>
                    <td className="p-3">Consent (Art. 6(1)(a)); Contract performance (Art. 6(1)(b)); Legitimate Interest (Art. 6(1)(f))</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="p-3 font-medium">USA (CCPA/CPRA)</td>
                    <td className="p-3">Business purposes as defined; Right to opt-out of sale; Right to delete</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="data-sharing">
            <h2 id="data-sharing" className="text-xl font-semibold text-foreground mb-3">5. Data Sharing & Transfers</h2>
            <p className="text-sm">We share personal data only as described below:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-sm mt-2">
              <li><strong>Recruiters:</strong> When you opt to make your digital profile visible, recruiters on the platform may view your parsed profile data.</li>
              <li><strong>Service Providers:</strong> Cloud hosting (encrypted at rest and in transit), AI model providers (data processed ephemerally, not used for model training), payment processors.</li>
              <li><strong>Legal Obligations:</strong> Government authorities when required by law, court orders, or regulatory requirements.</li>
              <li><strong>Cross-Border Transfers:</strong> Data may be transferred to servers outside your jurisdiction. For EU data subjects, we rely on Standard Contractual Clauses (SCCs). For Indian data subjects, we comply with cross-border transfer provisions under the DPDP Act.</li>
            </ul>
            <p className="text-sm mt-3"><strong>We do not sell your personal data.</strong></p>
          </section>

          <section aria-labelledby="data-retention">
            <h2 id="data-retention" className="text-xl font-semibold text-foreground mb-3">6. Data Retention</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-sm">
              <li><strong>Account Data:</strong> Retained while your account is active. Deleted within 90 days of account deletion request.</li>
              <li><strong>Resume Data:</strong> Retained while your account is active. Permanently deleted upon account deletion.</li>
              <li><strong>Payment Records:</strong> Retained for 8 years as required by Indian tax laws (Income Tax Act, GST Act) and applicable regulations.</li>
              <li><strong>Logs & Analytics:</strong> Anonymized after 24 months.</li>
            </ul>
          </section>

          <section aria-labelledby="your-rights">
            <h2 id="your-rights" className="text-xl font-semibold text-foreground mb-3">7. Your Rights</h2>
            <h3 className="text-base font-semibold text-foreground mt-4 mb-2">Under DPDP Act 2023 (India)</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Right to access personal data held about you</li>
              <li>Right to correction and erasure of inaccurate data</li>
              <li>Right to withdraw consent at any time</li>
              <li>Right to grievance redressal</li>
              <li>Right to nominate (in case of death or incapacity)</li>
            </ul>
            <h3 className="text-base font-semibold text-foreground mt-4 mb-2">Under GDPR (EU)</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Right of access (Art. 15), Rectification (Art. 16), Erasure (Art. 17)</li>
              <li>Right to restriction of processing (Art. 18)</li>
              <li>Right to data portability (Art. 20)</li>
              <li>Right to object (Art. 21)</li>
              <li>Right not to be subject to automated decision-making (Art. 22)</li>
            </ul>
            <h3 className="text-base font-semibold text-foreground mt-4 mb-2">Under CCPA/CPRA (USA)</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Right to know what personal information is collected</li>
              <li>Right to delete personal information</li>
              <li>Right to opt-out of sale or sharing of personal information</li>
              <li>Right to non-discrimination for exercising rights</li>
              <li>Right to correct inaccurate personal information</li>
            </ul>
          </section>

          <section aria-labelledby="security">
            <h2 id="security" className="text-xl font-semibold text-foreground mb-3">8. Security Measures</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-sm">
              <li>AES-256 encryption at rest; TLS 1.3 in transit</li>
              <li>Role-based access control with audit logging</li>
              <li>Regular security assessments and penetration testing</li>
              <li>Secure password hashing (bcrypt/argon2)</li>
              <li>Multi-factor authentication support</li>
              <li>SOC 2 Type II aligned infrastructure</li>
            </ul>
          </section>

          <section aria-labelledby="children">
            <h2 id="children" className="text-xl font-semibold text-foreground mb-3">9. Children's Privacy</h2>
            <p className="text-sm">
              cvZen is not intended for use by individuals under 18 years of age. We do not knowingly collect personal data from minors. If you believe a minor has provided data, contact us immediately for deletion.
            </p>
          </section>

          <section aria-labelledby="cookies">
            <h2 id="cookies" className="text-xl font-semibold text-foreground mb-3">10. Cookies & Tracking</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-sm">
              <li><strong>Essential Cookies:</strong> Required for authentication, security, and core functionality. Cannot be disabled.</li>
              <li><strong>Analytics Cookies:</strong> Used to understand usage patterns. Enabled only with explicit consent.</li>
              <li><strong>Marketing Cookies:</strong> Not used. We do not serve third-party advertisements.</li>
            </ul>
          </section>

          <section aria-labelledby="grievance">
            <h2 id="grievance" className="text-xl font-semibold text-foreground mb-3">11. Grievance Officer (India)</h2>
            <p className="text-sm">
              In accordance with the Information Technology Act, 2000 and DPDP Act, 2023, the Grievance Officer can be contacted at:
            </p>
            <div className="bg-muted rounded-lg p-4 mt-2 text-sm">
              <p><strong>Grievance Officer:</strong> cvZen Data Protection Team</p>
              <p><strong>Email:</strong> privacy@cvzen.ai</p>
              <p><strong>Response Time:</strong> Within 72 hours of receipt; resolution within 30 days.</p>
            </div>
          </section>

          <section aria-labelledby="dpo">
            <h2 id="dpo" className="text-xl font-semibold text-foreground mb-3">12. Data Protection Officer (EU)</h2>
            <p className="text-sm">
              For GDPR-related inquiries, contact our Data Protection Officer at <strong>dpo@cvzen.ai</strong>. You also have the right to lodge a complaint with your local supervisory authority.
            </p>
          </section>

          <section aria-labelledby="changes">
            <h2 id="changes" className="text-xl font-semibold text-foreground mb-3">13. Changes to This Policy</h2>
            <p className="text-sm">
              We may update this Privacy Policy periodically. Material changes will be communicated via email and/or prominent notice on the platform at least 30 days before taking effect. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section aria-labelledby="contact">
            <h2 id="contact" className="text-xl font-semibold text-foreground mb-3">14. Contact Us</h2>
            <div className="bg-muted rounded-lg p-4 text-sm">
              <p><strong>cvZen</strong></p>
              <p>Email: privacy@cvzen.ai</p>
              <p>For Indian users: privacy-in@cvzen.ai</p>
              <p>For EU users: dpo@cvzen.ai</p>
            </div>
          </section>
        </div>

        {/* Footer links */}
        <div className="mt-12 pt-6 border-t border-border flex flex-wrap gap-4 text-xs text-muted-foreground">
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          <Link to="/disclaimer" className="hover:text-foreground transition-colors">Disclaimer</Link>
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
        </div>
      </main>
    </div>
  );
};

export default Privacy;
