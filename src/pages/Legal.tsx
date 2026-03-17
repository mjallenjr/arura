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
    <P>You must be at least 13 years old to use Arura. If you are under 18, you must have parental consent.</P>
    <SectionTitle>3. Your Account</SectionTitle>
    <P>You are responsible for your account credentials and all activity under your account. Keep your password secure.</P>
    <SectionTitle>4. Content & Signals</SectionTitle>
    <P>You retain ownership of content you create. By posting, you grant Arura a non-exclusive license to display your content within the platform. Signals expire after 2 hours and are not permanently stored.</P>
    <SectionTitle>5. Prohibited Conduct</SectionTitle>
    <P>You may not: post illegal, violent, or sexually explicit content involving minors; harass, bully, or threaten others; impersonate another person; use bots or automated scripts; attempt to reverse-engineer the App; or circumvent safety features.</P>
    <SectionTitle>6. Moderation</SectionTitle>
    <P>We may remove content and suspend accounts that violate these Terms. We review reports promptly and aim to respond within 48 hours.</P>
    <SectionTitle>7. Advertisements</SectionTitle>
    <P>Arura may display sponsored content in your feed. We do not sell your personal data to advertisers. Ad targeting is based on your selected interests, not private messages or behavior tracking.</P>
    <SectionTitle>8. Termination</SectionTitle>
    <P>You may delete your account at any time. We may terminate your account for violations of these Terms.</P>
    <SectionTitle>9. Disclaimers</SectionTitle>
    <P>Arura is provided "as is" without warranties. We are not liable for user-generated content or interactions between users.</P>
    <SectionTitle>10. Changes</SectionTitle>
    <P>We may update these Terms. Continued use after changes constitutes acceptance.</P>
  </>
);

const PrivacyContent = () => (
  <>
    <p className="text-[10px] text-muted-foreground/60">Last updated: March 17, 2026</p>
    <SectionTitle>1. Data We Collect</SectionTitle>
    <P>Account info (email, display name, phone if provided), content you create (signals, stitches, messages), usage data (views, interactions), and device info (browser type, screen size).</P>
    <SectionTitle>2. How We Use Your Data</SectionTitle>
    <P>To provide the service, personalize your experience, show relevant content and ads, ensure safety and prevent abuse, and improve the App.</P>
    <SectionTitle>3. Data Sharing</SectionTitle>
    <P>We do not sell your personal data. We may share data with: service providers who help operate the App, law enforcement when legally required, or in connection with a merger or acquisition.</P>
    <SectionTitle>4. Ad Targeting</SectionTitle>
    <P>Ads are targeted based on your selected interests only. We do not build behavioral profiles, track you across other apps, or share your data with advertisers.</P>
    <SectionTitle>5. Data Retention</SectionTitle>
    <P>Signals expire after 2 hours and media is deleted. Account data is kept until you delete your account. Messages are stored as long as both users have active accounts.</P>
    <SectionTitle>6. Your Rights</SectionTitle>
    <P>You can: access your data via your profile, update or correct your information, delete your account and all associated data, and request a copy of your data by contacting us.</P>
    <SectionTitle>7. GDPR (EU Users)</SectionTitle>
    <P>If you're in the EU, you have additional rights under GDPR including the right to erasure, portability, and to object to processing. Contact us to exercise these rights.</P>
    <SectionTitle>8. Children's Privacy</SectionTitle>
    <P>Arura is not intended for children under 13. We do not knowingly collect data from children under 13.</P>
    <SectionTitle>9. Security</SectionTitle>
    <P>We use encryption in transit and at rest, row-level security policies, and regular security audits to protect your data.</P>
    <SectionTitle>10. Contact</SectionTitle>
    <P>For privacy inquiries, contact us through the App or email our privacy team.</P>
  </>
);

export default Legal;
