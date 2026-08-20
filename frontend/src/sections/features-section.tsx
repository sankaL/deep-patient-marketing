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
    tagline: "A patient who responds in the moment.",
    description:
      "Learners speak with a lifelike AI patient over live video. The patient responds to what they ask, so the encounter feels like a conversation instead of a script.",
    gradient: "from-brand-sage/20 to-transparent",
    iconBg: "bg-brand-sage/10 border-brand-sage/20",
    iconColor: "text-[#8B5E3C]",
  },
  {
    number: "02",
    icon: FileCheck,
    title: "Rubric-Based Feedback",
    tagline: "Clear feedback while the case is still fresh.",
    description:
      "After each session, DeepPatient scores the learner against your rubric and explains the result in plain language. Reports can be exported as PDFs.",
    gradient: "from-feedback-cta/20 to-transparent",
    iconBg: "bg-feedback-cta/10 border-feedback-cta/20",
    iconColor: "text-[#8B5E3C]",
  },
  {
    number: "03",
    icon: Settings,
    title: "Scenario Control",
    tagline: "Build the curriculum your program actually needs.",
    description:
      "Create patient scenarios, set the clinical context and patient behaviour, then attach the rubric your program already uses. No coding required.",
    gradient: "from-brand-bark/20 to-transparent",
    iconBg: "bg-brand-bark/10 border-brand-bark/20",
    iconColor: "text-[#8B5E3C]",
  },
  {
    number: "04",
    icon: Users,
    title: "Faculty & Cohort Management",
    tagline: "See where a cohort is getting stuck.",
    description:
      "Assign scenarios to learners or cohorts. Faculty can review completion rates and spot skills that need more attention across the class.",
    gradient: "from-faculty-pill/20 to-transparent",
    iconBg: "bg-faculty-pill/10 border-faculty-pill/20",
    iconColor: "text-faculty-pill",
  },
  {
    number: "05",
    icon: LayoutDashboard,
    title: "Learner Dashboard",
    tagline: "Every case and report in one place.",
    description:
      "Learners can see assigned cases, check feedback, and revisit past transcripts and evaluation reports from one dashboard.",
    gradient: "from-subscribe-cta/20 to-transparent",
    iconBg: "bg-subscribe-cta/10 border-subscribe-cta/20",
    iconColor: "text-subscribe-cta",
  },
  {
    number: "06",
    icon: Shield,
    title: "Security & FERPA Alignment",
    tagline: "Student data stays in the right hands.",
    description:
      "DeepPatient is designed for FERPA-aligned use, with encryption in transit and at rest. Role-based access limits what each user can see.",
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

const featureTableColumns =
  "grid-cols-[minmax(0,1.75fr)_repeat(3,minmax(0,0.85fr))] sm:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,0.9fr))]";

const FeaturesSection = () => {
  return (
    <section
      id="features"
      className="relative overflow-hidden bg-surface-1 py-24 scroll-mt-28 md:py-32 md:scroll-mt-32"
    >
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[22rem] w-[46rem] -translate-x-1/2 rounded-full bg-brand-sage/12 blur-[9rem] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
        aria-hidden="true"
      />

      <div className="relative container mx-auto px-4">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <span className="text-brand-bark text-sm font-semibold uppercase tracking-[0.2em] mb-4 block">
            Platform
          </span>
          <h2 className="text-balance text-3xl md:text-5xl font-bold tracking-tight text-brand-forest mb-6">
            Clinical practice without the scheduling bottleneck.
          </h2>
          <p className="text-pretty text-brand-forest/60 text-lg leading-relaxed">
            Learners get more chances to practise. Faculty get consistent scoring
            without having to observe every encounter live.
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
              className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-[0_1px_2px_hsl(187,21%,16%,0.05),0_12px_32px_hsl(187,21%,16%,0.06)] ring-1 ring-brand-forest/8 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_2px_3px_hsl(187,21%,16%,0.06),0_20px_44px_hsl(187,21%,16%,0.1)]"
            >
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-b ${feat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-5">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${feat.iconBg}`}>
                    <feat.icon className={`h-6 w-6 ${feat.iconColor}`} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-[0.25em] text-brand-forest/25">
                    {feat.number}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-brand-forest mb-2">
                  {feat.title}
                </h3>
                <p className="text-brand-bark text-sm font-medium mb-3">
                  {feat.tagline}
                </p>
                <p className="text-brand-forest/58 leading-relaxed text-sm">
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
          className="mx-auto max-w-4xl"
        >
          <h3 className="text-2xl font-bold text-brand-forest text-center mb-8">
            Who Gets What
          </h3>
          <div className="overflow-hidden rounded-2xl bg-white shadow-[0_12px_36px_hsl(187,21%,16%,0.06)] ring-1 ring-brand-forest/8">
            <div className={`grid ${featureTableColumns} gap-3 border-b border-brand-forest/8 bg-brand-cream-dark/55 px-4 py-4 sm:gap-4 sm:px-6`}>
              <div className="text-xs font-semibold text-brand-forest/65 sm:text-sm">
                Feature
              </div>
              <div className="text-center text-xs font-semibold text-brand-forest/65 sm:text-sm">
                Admins
              </div>
              <div className="text-center text-xs font-semibold text-brand-forest/65 sm:text-sm">
                Faculty
              </div>
              <div className="text-center text-xs font-semibold text-brand-forest/65 sm:text-sm">
                Learners
              </div>
            </div>
            {tableRows.map((row, i) => (
              <div
                key={row.feature}
                className={`grid ${featureTableColumns} gap-3 px-4 py-3.5 sm:gap-4 sm:px-6 ${i < tableRows.length - 1 ? "border-b border-brand-forest/6" : ""}`}
              >
                <div className="text-sm leading-6 text-brand-forest/70">{row.feature}</div>
                <div className="flex justify-center">
                  {row.admins && <Check className="h-4 w-4 text-brand-bark" />}
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
