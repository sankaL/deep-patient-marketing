import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";

type FooterCtaSectionProps = {
  onBookDemo: () => void;
};

const FooterCtaSection = ({ onBookDemo }: FooterCtaSectionProps) => {
  return (
    <section className="relative py-24 md:py-32 bg-black overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50rem] h-[25rem] bg-brand-sage/10 rounded-full blur-[10rem]" />
      </div>
      <div className="absolute inset-0 bg-noise opacity-20" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative container mx-auto px-4 text-center"
      >
        <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white max-w-4xl mx-auto leading-tight mb-6">
          Ready to transform how your institution{" "}
          <span className="text-brand-sage">trains clinicians?</span>
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10">
          All at a fraction of the cost of live standardized patients.
        </p>
        <button
          type="button"
          onClick={onBookDemo}
          className="inline-flex items-center gap-2 h-14 rounded-full bg-brand-sage px-10 text-base font-semibold text-brand-forest-dark hover:brightness-105 transition-all cursor-pointer shadow-[0_0_40px_hsl(38,92%,76%,0.34)]"
        >
          Book a Demo
          <ArrowRight className="h-5 w-5" />
        </button>
      </motion.div>
    </section>
  );
};

export { FooterCtaSection };
