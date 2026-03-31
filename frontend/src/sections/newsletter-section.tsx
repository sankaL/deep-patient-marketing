import { useState } from "react";
import { Send, CheckCircle, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const NewsletterSection = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }

    // Reset status after a while
    setTimeout(() => setStatus("idle"), 4000);
  };

  return (
    <section className="relative py-16 bg-[hsl(187,21%,10%)] border-t border-white/5">
      <div className="container mx-auto px-4">
        <div className="max-w-xl mx-auto text-center">
          <h3 className="text-xl font-semibold text-white mb-2">
            Stay in the loop
          </h3>
          <p className="text-gray-400 text-sm mb-6">
            Stay up to date on clinical education, AI in medicine, and
            DeepPatient product news.
          </p>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3"
          >
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 h-12 rounded-full border border-white/10 bg-white/5 px-5 text-white
                         placeholder:text-gray-500 focus:outline-none focus:border-brand-sage/50
                         focus:ring-2 focus:ring-brand-sage/20 transition-all text-sm"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="h-12 rounded-full bg-brand-sage px-6 text-sm font-semibold text-brand-forest-dark
                         hover:brightness-105 transition-all cursor-pointer disabled:opacity-60
                         flex items-center justify-center gap-2 min-w-[130px]"
            >
              {status === "loading" ? (
                <div className="h-4 w-4 border-2 border-brand-forest-dark/30 border-t-brand-forest-dark rounded-full animate-spin" />
              ) : (
                <>
                  Subscribe
                  <Send className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Status feedback */}
          <AnimatePresence>
            {status === "success" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 inline-flex items-center gap-2 text-sm text-green-400"
              >
                <CheckCircle className="h-4 w-4" />
                You're subscribed! Check your inbox.
              </motion.div>
            )}
            {status === "error" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 inline-flex items-center gap-2 text-sm text-red-400"
              >
                <AlertCircle className="h-4 w-4" />
                Something went wrong. Try again.
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export { NewsletterSection };
