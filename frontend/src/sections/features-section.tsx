import {
  Video,
  FileCheck,
  Settings,
  Users,
  LayoutDashboard,
  Shield,
  Check,
} from "lucide-react";
import { motion } from "motion/react";

const features = [
  {
    number: "01",
    icon: Video,
    title: "Live AI Patient Simulation",
    tagline: "The encounter that feels real.",
    description:
      "Learners engage in a real-time, live video call with a lifelike AI-simulated patient. Adaptive AI responses ensure each simulation feels dynamic and realistic, not scripted.",
    gradient: "from-brand-sage/20 to-transparent",
    iconBg: "bg-brand-sage/10 border-brand-sage/20",
    iconColor: "text-brand-sage",
  },
  {
    number: "02",
    icon: FileCheck,
    title: "Rapid Rubric-Based Feedback",
    tagline: "Objective scores. Actionable insight. No waiting.",
    description:
      "After each session, our evaluator AI agent assesses performance against a custom-defined rubric \u2014 producing an objective score and written narrative. Reports are exportable as PDF.",
    gradient: "from-feedback-cta/20 to-transparent",
    iconBg: "bg-feedback-cta/10 border-feedback-cta/20",
    iconColor: "text-feedback-cta",
  },
  {
    number: "03",
    icon: Settings,
    title: "Admin & Scenario Control",
    tagline: "Build the curriculum your program actually needs.",
    description:
      "Create scenarios from scratch, define patient backstories, set behavioral parameters, and attach custom evaluation rubrics \u2014 all without writing a line of code.",
    gradient: "from-brand-bark/20 to-transparent",
    iconBg: "bg-brand-bark/10 border-brand-bark/20",
    iconColor: "text-brand-bark",
  },
  {
    number: "04",
    icon: Users,
    title: "Faculty & Cohort Management",
    tagline: "See the full picture. Act on what matters.",
    description:
      "Assign scenarios to individuals, groups, or entire cohorts. A high-level analytics dashboard aggregates results \u2014 surfacing class-wide learning gaps and tracking completion rates.",
    gradient: "from-faculty-pill/20 to-transparent",
    iconBg: "bg-faculty-pill/10 border-faculty-pill/20",
    iconColor: "text-faculty-pill",
  },
  {
    number: "05",
    icon: LayoutDashboard,
    title: "Learner Dashboard",
    tagline: "Practice. Review. Improve. Repeat.",
    description:
      "Every learner gets a dedicated personal dashboard \u2014 view assigned cases, check pending feedback, and browse complete history of transcripts and evaluation reports.",
    gradient: "from-subscribe-cta/20 to-transparent",
    iconBg: "bg-subscribe-cta/10 border-subscribe-cta/20",
    iconColor: "text-subscribe-cta",
  },
  {
    number: "06",
    icon: Shield,
    title: "Security & FERPA Alignment",
    tagline: "Student data protected. Full stop.",
    description:
      "FERPA alignment is built in. All data encrypted in transit and at rest. Strict Role-Based Access Control ensures users only see what they\u2019re supposed to see.",
    gradient: "from-success/20 to-transparent",
    iconBg: "bg-success/10 border-success/20",
    iconColor: "text-success",
  },
];

const tableRows = [
  { feature: "Create & edit scenarios", admins: true, faculty: false, learners: false },
  { feature: "Define evaluation rubrics", admins: true, faculty: false, learners: false },
  { feature: "Manage user accounts", admins: true, faculty: false, learners: false },
  { feature: "Assign scenarios to cohorts", admins: false, faculty: true, learners: false },
  { feature: "View aggregated analytics", admins: false, faculty: true, learners: false },
  { feature: "Run live AI patient simulations", admins: false, faculty: false, learners: true },
  { feature: "Receive rubric-based feedback", admins: false, faculty: false, learners: true },
  { feature: "Access session transcripts & reports", admins: false, faculty: false, learners: true },
  { feature: "Track personal progress over time", admins: false, faculty: false, learners: true },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="relative py-24 md:py-32 bg-[hsl(187,21%,10%)] scroll-mt-16">
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-transparent to-[hsl(187,21%,10%)] pointer-events-none z-0" aria-hidden="true" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40rem] h-[20rem] bg-brand-sage/8 rounded-full blur-[8rem]" />

      <div className="relative container mx-auto px-4">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <span className="text-brand-sage text-sm font-semibold uppercase tracking-[0.2em] mb-4 block">
            Platform
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Everything Your Program Needs.{" "}
            <span className="text-white/50">Nothing It Doesn{"\u2019"}t.</span>
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            DeepPatient is an end-to-end platform for clinical skills training {"\u2014"} built to be
            lifelike for learners, powerful for faculty, and manageable for admins.
          </p>
        </motion.div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-24">
          {features.map((feat, i) => (
            <motion.div
              key={feat.number}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group relative rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-sm p-8 hover:border-white/15 transition-all duration-300"
            >
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-b ${feat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-5">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${feat.iconBg}`}>
                    <feat.icon className={`h-6 w-6 ${feat.iconColor}`} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-[0.25em] text-white/25">
                    {feat.number}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feat.title}
                </h3>
                <p className="text-brand-sage/80 text-sm font-medium mb-3">
                  {feat.tagline}
                </p>
                <p className="text-gray-400 leading-relaxed text-sm">
                  {feat.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Feature summary table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto"
        >
          <h3 className="text-2xl font-bold text-white text-center mb-8">
            Who Gets What
          </h3>
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
            <div className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-white/8 bg-white/[0.03]">
              <div className="text-sm font-semibold text-white/60">Feature</div>
              <div className="text-center text-sm font-semibold text-white/60">Admins</div>
              <div className="text-center text-sm font-semibold text-white/60">Faculty</div>
              <div className="text-center text-sm font-semibold text-white/60">Learners</div>
            </div>
            {tableRows.map((row, i) => (
              <div
                key={row.feature}
                className={`grid grid-cols-4 gap-4 px-6 py-3.5 ${i < tableRows.length - 1 ? "border-b border-white/5" : ""}`}
              >
                <div className="text-sm text-gray-300">{row.feature}</div>
                <div className="flex justify-center">
                  {row.admins && <Check className="h-4 w-4 text-brand-sage" />}
                </div>
                <div className="flex justify-center">
                  {row.faculty && <Check className="h-4 w-4 text-faculty-pill" />}
                </div>
                <div className="flex justify-center">
                  {row.learners && <Check className="h-4 w-4 text-feedback-cta" />}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export { FeaturesSection };
