import {
  MessageSquare,
  ClipboardCheck,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";

const pillars = [
  {
    icon: MessageSquare,
    title: "Lifelike AI Conversations",
    description:
      "Engage in real-time interviews with adaptive AI patients designed to behave like the real thing.",
    gradient: "from-brand-sage/20 to-transparent",
  },
  {
    icon: ClipboardCheck,
    title: "Rubric-Based Feedback",
    description:
      "Get instant, objective evaluations powered by LLMs, built on rubrics your faculty define.",
    gradient: "from-brand-bark/20 to-transparent",
  },
  {
    icon: TrendingUp,
    title: "Scalable & Cost-Effective",
    description:
      "Dramatically reduce the cost and logistics of standardized patient programs without sacrificing quality.",
    gradient: "from-brand-forest-light/20 to-transparent",
  },
];

const FeaturesSection = () => {
  return (
    <section className="relative py-24 md:py-32 bg-[hsl(187,21%,10%)]">
      {/* Top smudge — overlaps hero and fades from transparent so the section bleeds in gradually */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-transparent to-[hsl(187,21%,10%)] pointer-events-none z-0" aria-hidden="true" />

      {/* Subtle glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40rem] h-[20rem] bg-brand-sage/8 rounded-full blur-[8rem]" />

      <div className="relative container mx-auto px-4">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-brand-sage text-sm font-semibold uppercase tracking-[0.2em] mb-4 block">
            Platform
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            What is DeepPatient?
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            A complete clinical skills training platform built for every role at
            your institution — from secure scenario creation to cohort-level
            analytics.
          </p>
        </motion.div>

        {/* 3 pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pillars.map((pillar, i) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="group relative rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-sm p-8 hover:border-brand-sage/30 transition-all duration-300"
            >
              {/* Gradient overlay on hover */}
              <div
                className={`absolute inset-0 rounded-2xl bg-gradient-to-b ${pillar.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              />

              <div className="relative z-10">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-sage/10 border border-brand-sage/20">
                  <pillar.icon className="h-6 w-6 text-brand-sage" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {pillar.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA link */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="text-center mt-12"
        >
          <a
            href="#"
            className="inline-flex items-center gap-2 text-brand-sage font-medium hover:underline underline-offset-4"
          >
            See All Features
            <TrendingUp className="h-4 w-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export { FeaturesSection };
