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

const faqs = [
  {
    q: "What happens after 2 hours?",
    a: "If nobody engages, your signal fades — gone forever. But if people feel it, it gains heat: match → spark → ignite → flame → hot → burning → raging → inferno → star. The hotter it gets, the longer it lives. Reach star status and it stays for a full year. Everything burns — but the best things keep burning.",
  },
  {
    q: "Why only 5 seconds?",
    a: "Because the best moments don't need a script. Five seconds is enough to capture something real — a laugh, a sunset, a vibe. No retakes, no filters, no overthinking.",
  },
  {
    q: "What's 'heat' and how does it work?",
    a: "Heat replaces likes. When people engage with your signal, it gains heat: match → spark → flame → ⭐. It's about collective energy, not individual validation.",
  },
  {
    q: "Why are DMs limited to 10 words?",
    a: "Constraints breed creativity. When you only have 10 words, you say what actually matters. No small talk, no walls of text — just meaning.",
  },
  {
    q: "Is arura free?",
    a: "Yes. Arura is free to use. We believe authentic connection shouldn't have a paywall. Premium features may come later, but the core experience will always be free.",
  },
  {
    q: "What about privacy?",
    a: "Signals expire. We don't sell your data. There's no algorithm profiling you. Your content isn't training an AI. We make money through ethical, transparent ads — not surveillance.",
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
