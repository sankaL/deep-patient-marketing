import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";

type FooterCtaSectionProps = {
  onBookDemo: () => void;
};

const FooterCtaSection = ({ onBookDemo }: FooterCtaSectionProps) => {
  return (
    <section className="relative overflow-hidden bg-brand-sage/35 py-24 md:py-32">
      {/* Background glow */}
      <div className="absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[25rem] w-[50rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70 blur-[10rem]" />
      </div>
      <div className="absolute inset-0 bg-noise opacity-20" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative container mx-auto px-4 text-center"
      >
        <h2 className="mx-auto mb-6 max-w-4xl text-balance text-3xl font-bold leading-tight tracking-tight text-brand-forest md:text-5xl lg:text-6xl">
          Give learners more time with patients,
          <span className="text-brand-bark"> without adding more schedules.</span>
        </h2>
        <p className="text-brand-forest/62 text-lg max-w-2xl mx-auto mb-10">
          See how DeepPatient could fit into your clinical training program.
        </p>
        <button
          type="button"
          onClick={onBookDemo}
          className="inline-flex h-14 cursor-pointer items-center gap-2 rounded-full bg-brand-forest px-10 text-base font-semibold text-white shadow-[0_14px_30px_hsl(187,21%,16%,0.2)] transition-[transform,background-color] hover:bg-brand-forest-light active:scale-[0.97]"
        >
          Book a Demo
          <ArrowRight className="h-5 w-5" />
        </button>
      </motion.div>
    </section>
  );
};

export { FooterCtaSection };
