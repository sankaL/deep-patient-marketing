import { useState } from "react";
import {
  GraduationCap,
  BarChart3,
  Search,
  BookOpen,
  FileText,
  LineChart,
  Shield,
  FileCode,
  Users,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const personas = [
  {
    id: "faculty",
    label: "For Faculty",
    headline: "Assign cases and see where the class needs help.",
    icon: GraduationCap,
    color: "faculty-pill",
    items: [
      {
        icon: BookOpen,
        text: "Assign scenarios from your institution's content library",
      },
      {
        icon: BarChart3,
        text: "Review results across a class or cohort",
      },
      {
        icon: Search,
        text: "Spot communication skills that need more practice",
      },
    ],
  },
  {
    id: "learners",
    label: "For Learners",
    headline: "Practise when you are ready. Get feedback right away.",
    icon: BookOpen,
    color: "feedback-cta",
    items: [
      {
        icon: FileText,
        text: "Practice cases assigned directly by faculty",
      },
      {
        icon: FileCode,
        text: "Review session transcripts, scores, and written feedback",
      },
      {
        icon: LineChart,
        text: "Track improvement on a personal dashboard",
      },
    ],
  },
  {
    id: "admins",
    label: "For Admins",
    headline: "Keep your scenarios and scoring standards in your hands.",
    icon: Shield,
    color: "brand-bark",
    items: [
      {
        icon: FileText,
        text: "Create and edit patient scenarios",
      },
      {
        icon: FileCode,
        text: "Use custom rubrics for automated scoring",
      },
      {
        icon: Users,
        text: "Manage learner and faculty accounts in one place",
      },
    ],
  },
];

const tabColorMap: Record<string, string> = {
  "faculty-pill": "bg-faculty-pill text-brand-forest-dark",
  "feedback-cta": "bg-feedback-cta text-brand-forest-dark",
  "brand-bark": "bg-brand-bark text-white",
};

const inactiveTabMap: Record<string, string> = {
  "faculty-pill": "text-faculty-pill border-faculty-pill/30 hover:bg-faculty-pill/10",
  "feedback-cta":
    "text-feedback-cta border-feedback-cta/30 hover:bg-feedback-cta/10",
  "brand-bark": "text-brand-bark border-brand-bark/30 hover:bg-brand-bark/10",
};

const iconColorMap: Record<string, string> = {
  "faculty-pill": "text-faculty-pill bg-faculty-pill/10 border-faculty-pill/20",
  "feedback-cta":
    "text-feedback-cta bg-feedback-cta/10 border-feedback-cta/20",
  "brand-bark": "text-brand-bark bg-brand-bark/10 border-brand-bark/20",
};

type PersonasSectionProps = {
  onBookDemo: () => void;
};

const PersonasSection = ({ onBookDemo }: PersonasSectionProps) => {
  const [active, setActive] = useState("faculty");
  const current = personas.find((p) => p.id === active)!;

  return (
    <section className="relative py-24 md:py-32 bg-black">
      <div className="absolute inset-0 bg-noise opacity-20" />

      <div className="relative container mx-auto px-4">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-14"
        >
          <span className="text-brand-sage text-sm font-semibold uppercase tracking-[0.2em] mb-4 block">
            For Your Team
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            One platform, different jobs.
          </h2>
          <p className="text-gray-400 text-lg">
            Faculty, learners, and administrators each get the tools they need.
          </p>
        </motion.div>

        {/* Tab pills */}
        <div className="flex justify-center gap-3 mb-12 flex-wrap">
          {personas.map((p) => (
            <button
              key={p.id}
              onClick={() => setActive(p.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 border cursor-pointer ${
                active === p.id
                  ? tabColorMap[p.color]
                  : inactiveTabMap[p.color]
              }`}
            >
              <p.icon className="h-4 w-4" />
              {p.label}
            </button>
          ))}
        </div>

        {/* Content panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35 }}
            className="max-w-2xl mx-auto"
          >
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-8 backdrop-blur-sm md:p-10">
              <h3 className="text-2xl font-bold text-white mb-6">
                {current.headline}
              </h3>

              <ul className="space-y-5">
                {current.items.map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border ${iconColorMap[current.color]}`}
                    >
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="text-gray-300 pt-2 leading-relaxed">
                      {item.text}
                    </span>
                  </motion.li>
                ))}
              </ul>

              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={onBookDemo}
                  className="inline-flex items-center gap-2 h-11 rounded-full bg-brand-sage px-7 text-sm font-semibold text-brand-forest-dark hover:brightness-105 transition-all cursor-pointer shadow-[0_0_24px_hsl(38,92%,76%,0.26)]"
                >
                  Book a Demo
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export { PersonasSection };
