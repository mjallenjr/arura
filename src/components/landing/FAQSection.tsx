import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const ease = [0.2, 0.8, 0.2, 1] as const;

const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, ease, delay }} className={className}>
      {children}
    </motion.div>
  );
};

const faqCategories = [
  {
    label: "The basics",
    items: [
      {
        q: "What is arura?",
        a: "Arura is a presence-based social platform where you share raw, unedited 5-second moments called Flares. There are no likes, no follower counts, and no infinite scroll. Content expires, connections are real, and every interaction is designed around being present — not performing.",
      },
      {
        q: "How is arura different from other social apps?",
        a: "Most platforms optimize for attention and engagement metrics. Arura optimizes for presence. There's no algorithm deciding what you see, no public follower counts, no like buttons, and no permanent content. Your feed is chronological, ranked by heat and aura — not by what keeps you scrolling longest.",
      },
      {
        q: "Is arura free?",
        a: "Yes. Arura is completely free to use. The core experience — shooting Flares, feeling signals, stitching words, sending DMs — will always be free. We sustain the platform through ethical, non-invasive advertising. An optional arura Pro tier offers extended signal duration (24 hours) and other perks, but nothing essential is locked behind a paywall.",
      },
      {
        q: "What platforms does arura work on?",
        a: "Arura is a progressive web app (PWA), which means it works in any modern browser on any device — iOS, Android, desktop. You can install it to your home screen for a native app experience without going through an app store. No downloads, no updates to manage.",
      },
    ],
  },
  {
    label: "Flares & signals",
    items: [
      {
        q: "What's a Flare?",
        a: "A Flare is a 5-second video or photo that captures a raw, unfiltered moment. No retakes, no filters, no editing — just you. You can pair it with a music clip and a stitch word. Think of it as shooting a signal into the sky: brief, bright, and honest.",
      },
      {
        q: "Why only 5 seconds?",
        a: "Because the best moments don't need a script. Five seconds is enough to capture something real — a laugh, a skyline, a vibe. The constraint removes the pressure to perform and keeps content authentic. You're not producing content; you're sharing a moment.",
      },
      {
        q: "What happens after 2 hours?",
        a: "If nobody engages with your Flare, it fades — gone forever. No archive, no memories tab. But if people feel it, it gains heat and climbs through 9 tiers: match → spark → ignite → flame → hot → burning → raging → inferno → star. The hotter it gets, the longer it lives. Reach star status and it persists for a full year. Everything burns — but the best things keep burning.",
      },
      {
        q: "Can I save or download my Flares?",
        a: "No, and that's intentional. Arura is built on impermanence. The magic of a moment is that it passes. If you could save everything, the urgency and authenticity would disappear. Live it, share it, let it go.",
      },
    ],
  },
  {
    label: "Heat & engagement",
    items: [
      {
        q: "What's 'heat' and how does it work?",
        a: "Heat is arura's engagement system — it replaces likes entirely. When people interact with your Flare (feeling it, stitching a word, rekindling it), it gains heat and progresses through 9 tiers: match, spark, ignite, flame, hot, burning, raging, inferno, and star. Heat reflects collective energy, not individual validation. You never see who specifically 'liked' your content — you see how much it resonated.",
      },
      {
        q: "What is 'aura'?",
        a: "Aura is your presence score. It's calculated from the heat your Flares generate, how early you engage with others' content, and the quality of your connections. It's not a follower count or a vanity metric — it's a measure of how present and genuine you are in the community. People on your People screen are ranked by aura, not alphabetically.",
      },
      {
        q: "What does 'feel it' mean?",
        a: "Feeling a signal is arura's version of reacting. Instead of tapping a heart or thumbs up, you tap to 'feel' it — contributing heat energy to the Flare. It's anonymous and collective: the creator sees the heat rise, not a list of names. It's about energy, not ego.",
      },
      {
        q: "What's a 'stitch'?",
        a: "A stitch lets you overlay a single word on someone else's Flare — your personal mark on their moment. It appears floating over the video for everyone to see. It's a creative, minimalist way to respond without a full comment. One word. Make it count.",
      },
      {
        q: "What's 'rekindle'?",
        a: "When a Flare is close to expiring, you can rekindle it — extending its life by 1 hour and adding +10 heat. It's a way of saying 'this deserves more time.' You're actively choosing to keep someone's moment alive.",
      },
    ],
  },
  {
    label: "Communication",
    items: [
      {
        q: "Why are DMs limited to 10 words?",
        a: "Constraints breed meaning. Most DMs are noise — walls of text, small talk, messages that sit unread. With 10 words, you say what actually matters. Every word carries weight. Conversations become deliberate and memorable instead of disposable.",
      },
      {
        q: "Can I send photos or links in DMs?",
        a: "No. DMs are text-only, 10 words maximum. This keeps conversations focused, prevents spam, and eliminates the anxiety of managing media-heavy inboxes. If you want to share a visual moment, shoot a Flare.",
      },
    ],
  },
  {
    label: "Privacy & safety",
    items: [
      {
        q: "What about my privacy?",
        a: "Privacy is foundational, not an afterthought. Your Flares expire automatically — we don't hoard your content. We don't sell your data. There's no algorithm profiling your behavior. Your content is never used to train AI models. We sustain the platform through transparent, ethical advertising — not surveillance capitalism.",
      },
      {
        q: "Can I block or report someone?",
        a: "Yes. You can block any user instantly, which prevents them from seeing your Flares or sending you DMs. You can also report inappropriate content or behavior. Our moderation team reviews reports and takes action to keep the community safe. We have zero tolerance for harassment.",
      },
      {
        q: "Is my content end-to-end encrypted?",
        a: "DMs are encrypted in transit and at rest. Flares are public by nature (visible to your connections), but they're automatically deleted from our servers when they expire. We retain no content after expiration — when it's gone, it's truly gone.",
      },
      {
        q: "Can I delete my account?",
        a: "Yes, at any time. Account deletion is immediate and permanent. All your data, Flares, DMs, and profile information are wiped from our servers. No 30-day grace period, no hidden retention. Gone is gone.",
      },
    ],
  },
  {
    label: "Creators & monetization",
    items: [
      {
        q: "Can I make money on arura?",
        a: "Yes. Creators earn a share of ad revenue based on the heat their Flares generate. The more your content resonates, the more you earn. We use Stripe Connect for payouts, so getting paid is straightforward and transparent. No sponsorship deals needed — just create moments people feel.",
      },
      {
        q: "What is arura Pro?",
        a: "arura Pro is an optional subscription that extends your Flare duration to 24 hours (regardless of heat level), removes ads from your feed, and unlocks creator analytics. The core experience remains free — Pro is for power users who want more flexibility.",
      },
    ],
  },
  {
    label: "Technical",
    items: [
      {
        q: "Do I need to download an app?",
        a: "No. Arura is a progressive web app (PWA). Visit arura.app in your browser, and you can install it directly to your home screen. It works offline, sends push notifications, and feels native — without app store gatekeeping or mandatory updates.",
      },
      {
        q: "Does arura work offline?",
        a: "Partially. Your feed is cached locally with a 5-minute TTL, so recently viewed Flares are available offline. You can browse cached content, but you'll need a connection to shoot new Flares or interact with signals. The app gracefully handles connectivity changes with an offline indicator.",
      },
      {
        q: "Why a PWA instead of a native app?",
        a: "PWAs offer the best of both worlds: instant access via a URL, no app store approval delays, automatic updates, and cross-platform compatibility — all while supporting push notifications, offline mode, and home screen installation. It means we can ship faster and you get updates immediately.",
      },
    ],
  },
];

const FAQSection = () => (
  <section className="py-24 px-6 border-t border-border/50">
    <div className="max-w-2xl mx-auto">
      <FadeIn>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary text-center mb-4">Questions</p>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.04em] text-center mb-12">
          You're wondering…
        </h2>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border border-border/30 rounded-2xl px-5 bg-card/30 data-[state=open]:border-primary/20 transition-colors">
              <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline py-4">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </FadeIn>
    </div>
  </section>
);

export default FAQSection;
