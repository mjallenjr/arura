import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const signalTransition = { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] as const };
type Tab = "terms" | "privacy";

const Legal = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("terms");

  return (
    <div className="flex h-svh w-full flex-col bg-background">
      <div className="flex items-center justify-between p-4">
        <button onClick={() => navigate(-1)} className="text-muted-foreground">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <p className="label-signal">legal</p>
        <div className="w-5" />
      </div>

      <div className="flex gap-1 px-6 mb-4">
        {(["terms", "privacy"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-full py-2 text-xs font-medium signal-ease ${
              tab === t ? "bg-primary text-primary-foreground" : "signal-surface text-muted-foreground"
            }`}
          >
            {t === "terms" ? "Terms of Service" : "Privacy Policy"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-32">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={signalTransition}
          className="prose-sm text-foreground/80 space-y-4"
        >
          {tab === "terms" ? <TermsContent /> : <PrivacyContent />}
        </motion.div>
      </div>
    </div>
  );
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-sm font-semibold text-foreground mt-6 mb-2">{children}</h2>
);

const P = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs text-muted-foreground leading-relaxed">{children}</p>
);

const TermsContent = () => (
  <>
    <p className="text-[10px] text-muted-foreground/60">Last updated: March 17, 2026</p>
    <SectionTitle>1. Acceptance</SectionTitle>
    <P>By using Arura ("the App"), you agree to these Terms of Service. If you don't agree, please don't use the App.</P>
    <SectionTitle>2. Eligibility</SectionTitle>
    <P>You must be at least 13 years old to use Arura. If you are under 18, you must have parental or guardian consent. By creating an account, you confirm that you meet these age requirements.</P>
    <SectionTitle>3. Your Account</SectionTitle>
    <P>You are responsible for your account credentials and all activity under your account. Keep your password secure.</P>
    <SectionTitle>4. Content & Signals</SectionTitle>
    <P>You retain ownership of content you create. By posting, you grant Arura a non-exclusive license to display your content within the platform. Signals expire after 2 hours (24 hours for Pro subscribers) and media files are permanently deleted upon expiration.</P>
    <SectionTitle>5. Prohibited Conduct</SectionTitle>
    <P>You may not: post illegal, violent, or sexually explicit content involving minors; harass, bully, or threaten others; impersonate another person; use bots or automated scripts; attempt to reverse-engineer the App; or circumvent safety features.</P>
    <SectionTitle>6. Moderation</SectionTitle>
    <P>We may remove content and suspend accounts that violate these Terms. We review reports promptly and aim to respond within 48 hours.</P>
    <SectionTitle>7. Advertisements</SectionTitle>
    <P>Arura may display sponsored content in your feed. We do not sell your personal data to advertisers. Ad targeting is based on your selected interests, not private messages or behavior tracking.</P>
    <SectionTitle>8. Subscriptions & Payments</SectionTitle>
    <P>Arura Pro is a recurring subscription billed monthly at $7.99/month. You may cancel at any time through the subscription management portal — cancellation takes effect at the end of your current billing period. No partial refunds are issued for unused time. If you believe you were charged in error, contact us within 14 days at privacy@arura.app for review.</P>
    <SectionTitle>9. Termination</SectionTitle>
    <P>You may delete your account at any time. We may terminate your account for violations of these Terms. Upon account deletion, all your data is permanently removed.</P>
    <SectionTitle>10. Disclaimers</SectionTitle>
    <P>Arura is provided "as is" without warranties. We are not liable for user-generated content or interactions between users.</P>
    <SectionTitle>11. Governing Law</SectionTitle>
    <P>These Terms are governed by the laws of the United States. Any disputes shall be resolved through binding arbitration.</P>
    <SectionTitle>12. Changes</SectionTitle>
    <P>We may update these Terms. We will notify users of material changes via email or in-app notice. Continued use after changes constitutes acceptance.</P>
    <SectionTitle>13. Contact</SectionTitle>
    <P>For questions about these Terms, contact us at privacy@arura.app.</P>
  </>
);

const PrivacyContent = () => (
  <>
    <p className="text-[10px] text-muted-foreground/60">Last updated: March 17, 2026</p>
    <SectionTitle>1. Data Controller</SectionTitle>
    <P>Arura is the data controller for your personal data. You can reach us at privacy@arura.app for any data-related inquiries.</P>
    <SectionTitle>2. Data We Collect</SectionTitle>
    <P>Account info (email, display name, phone if provided), content you create (signals, stitches, messages), usage data (views, interactions), and device info (browser type, screen size).</P>
    <SectionTitle>3. How We Use Your Data</SectionTitle>
    <P>To provide the service, personalize your experience, show relevant content and ads, ensure safety and prevent abuse, and improve the App.</P>
    <SectionTitle>4. Legal Basis for Processing (GDPR)</SectionTitle>
    <P>We process your data based on: (a) performance of our contract with you (providing the service), (b) legitimate interests (safety, improvement), (c) your consent (marketing, interest-based ads), and (d) legal obligations (compliance with law).</P>
    <SectionTitle>5. Data Sharing & Sub-Processors</SectionTitle>
    <P>We do not sell your personal data. We share data with the following categories of service providers who help operate the App: cloud infrastructure (hosting and database), payment processing (Stripe, for subscriptions and creator payouts), and analytics. We may also share data with law enforcement when legally required, or in connection with a merger or acquisition. All sub-processors are bound by data processing agreements.</P>
    <SectionTitle>6. Ad Targeting</SectionTitle>
    <P>Ads are targeted based on your selected interests only. We do not build behavioral profiles, track you across other apps, or share your data with advertisers.</P>
    <SectionTitle>7. Cookies & Local Storage</SectionTitle>
    <P>Arura uses essential cookies and local storage for authentication and session management. We do not use third-party tracking cookies. By using the App, you consent to essential cookies required for the service to function.</P>
    <SectionTitle>8. Data Retention</SectionTitle>
    <P>Signals expire after 2 hours (24 hours for Pro) and media files are permanently deleted from our servers. Account data is kept until you delete your account. Messages are stored as long as both users have active accounts.</P>
    <SectionTitle>9. Your Rights</SectionTitle>
    <P>You can: access your data via your profile, update or correct your information, delete your account and all associated data, and request a copy of your data by contacting privacy@arura.app.</P>
    <SectionTitle>10. GDPR (EU Users)</SectionTitle>
    <P>If you're in the EU/EEA, you have additional rights under GDPR including the right to erasure, data portability, restriction of processing, and to object to processing. You also have the right to lodge a complaint with your local data protection authority. Contact privacy@arura.app to exercise these rights.</P>
    <SectionTitle>11. CCPA (California Users)</SectionTitle>
    <P>California residents have the right to know what personal information is collected, request deletion, and opt out of the sale of personal information. Arura does not sell personal information.</P>
    <SectionTitle>12. Children's Privacy</SectionTitle>
    <P>Arura is not intended for children under 13. We do not knowingly collect data from children under 13. If we learn we have collected data from a child under 13, we will promptly delete it.</P>
    <SectionTitle>13. International Transfers</SectionTitle>
    <P>Your data may be transferred to and processed in the United States. We ensure appropriate safeguards are in place for international data transfers in compliance with applicable law.</P>
    <SectionTitle>14. Security</SectionTitle>
    <P>We use encryption in transit (TLS) and at rest, row-level security policies, and regular security reviews to protect your data.</P>
    <SectionTitle>15. Changes</SectionTitle>
    <P>We may update this Privacy Policy. We will notify users of material changes via email or in-app notice.</P>
    <SectionTitle>16. Contact</SectionTitle>
    <P>For privacy inquiries, contact our privacy team at privacy@arura.app.</P>
  </>
);

export default Legal;
