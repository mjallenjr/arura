import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface QuickReplyProps {
  open: boolean;
  signalUserId: string;
  signalUserName: string;
  currentUserId: string;
  onClose: () => void;
}

const MAX_WORDS = 10;
const MAX_CHARS = 120;

const QuickReply = ({ open, signalUserId, signalUserName, currentUserId, onClose }: QuickReplyProps) => {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setText("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const isValid = text.trim().length > 0 && wordCount <= MAX_WORDS && text.length <= MAX_CHARS;

  const handleSend = async () => {
    if (!isValid || sending) return;
    setSending(true);
    try {
      const { error } = await supabase.from("direct_messages").insert({
        sender_id: currentUserId,
        receiver_id: signalUserId,
        word: text.trim(),
      });
      if (error) {
        if (error.message.includes("follows")) {
          toast.error("Spark with them first to reply");
        } else {
          toast.error("Couldn't send reply");
        }
      } else {
        toast.success(`Sent to ${signalUserName}`);
        onClose();
      }
    } catch {
      toast.error("Couldn't send reply");
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
          className="absolute bottom-20 left-4 right-4 z-30"
        >
          <div className="rounded-2xl bg-background/90 backdrop-blur-lg border border-border/40 p-3 shadow-lg">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                placeholder={`reply to ${signalUserName}…`}
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                maxLength={MAX_CHARS}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              <button
                onClick={handleSend}
                disabled={!isValid || sending}
                className="rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-40 transition-opacity"
              >
                {sending ? "…" : "send"}
              </button>
            </div>
            <p className={`text-[10px] mt-1.5 ${wordCount > MAX_WORDS ? "text-destructive" : "text-muted-foreground"}`}>
              {wordCount}/{MAX_WORDS} words
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QuickReply;
