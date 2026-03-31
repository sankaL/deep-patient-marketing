import { Quote } from "lucide-react";
import { motion } from "motion/react";

const TestimonialSection = () => {
  return (
    <section className="relative py-24 md:py-32 bg-[hsl(187,21%,10%)] overflow-hidden">
      {/* Accent glow */}
      <div className="absolute bottom-0 right-0 w-[30rem] h-[20rem] bg-brand-sage/6 rounded-full blur-[8rem]" />

      <div className="relative container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <span className="text-brand-sage text-sm font-semibold uppercase tracking-[0.2em] mb-4 block">
            Trusted by Educators
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-12">
            What Our Clients Say
          </h2>

          <div className="relative rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-sm p-8 md:p-12">
            {/* Quote icon */}
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-sage/10 border border-brand-sage/20 mx-auto mb-8">
              <Quote className="h-6 w-6 text-brand-sage" />
            </div>

            <blockquote className="text-xl md:text-2xl leading-relaxed text-gray-200 font-light italic mb-8">
              "The cost and logistics of our standardized patient program were
              ballooning. DeepPatient provides a scalable, consistent, and
              cost-effective solution our faculty can actually manage."
            </blockquote>

            <div className="flex flex-col items-center gap-1">
              <span className="text-white font-semibold text-lg">
                Mark Reed
              </span>
              <span className="text-gray-500 text-sm">
                Course Director, HRH
              </span>
            </div>

            {/* Decorative lines */}
            <div className="absolute top-0 left-8 w-px h-16 bg-gradient-to-b from-brand-sage/30 to-transparent" />
            <div className="absolute bottom-0 right-8 w-px h-16 bg-gradient-to-t from-brand-sage/30 to-transparent" />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export { TestimonialSection };
