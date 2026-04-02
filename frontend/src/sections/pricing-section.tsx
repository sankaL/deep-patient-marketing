import { useState } from "react";
import {
  Check,
  ChevronDown,
  Send,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const included = [
  "Live AI patient simulation (unlimited sessions, per plan)",
  "Rubric-based post-session feedback with PDF export",
  "Faculty scenario assignment and cohort analytics dashboard",
  "Admin scenario and rubric management",
  "Learner personal dashboard and progress tracking",
  "FERPA-aligned data handling, encryption in transit and at rest, RBAC",
  "Onboarding support and scenario setup assistance",
];

const steps = [
  {
    number: "1",
    title: "Tell us about your program.",
    description:
      "Fill out the form below with your organization size and a bit of context. The more we know, the faster we can get you a relevant proposal.",
  },
  {
    number: "2",
    title: "We\u2019ll reach out within one business day.",
    description:
      "A member of our team will follow up to learn more, answer your questions, and put together a tailored quote.",
  },
  {
    number: "3",
    title: "Get started.",
    description:
      "Once scoped, onboarding is fast. We\u2019ll work with your admin team to configure your scenario library and get your first cohort running.",
  },
];

const orgSizes = [
  "1\u201350",
  "51\u2013150",
  "151\u2013250",
  "251\u2013500",
  "501\u20131,000",
  "1,001\u20132,500",
  "2,500+",
];

const faqs = [
  {
    q: "Is there a free trial or pilot option?",
    a: "We offer structured pilot programs for qualifying institutions. Reach out and let us know you\u2019re interested in a pilot \u2014 we\u2019re happy to discuss what that looks like for your program.",
  },
  {
    q: "How long does onboarding take?",
    a: "Most institutions are up and running within two to four weeks. Our team handles scenario configuration, user onboarding, and initial training for admins and faculty.",
  },
  {
    q: "Can we use our own evaluation rubrics?",
    a: "Yes. Rubric design is entirely yours. Our team can help translate your existing clinical assessment frameworks into the DeepPatient format.",
  },
  {
    q: "Is DeepPatient compatible with our existing LMS?",
    a: "We support integration discussions on a case-by-case basis. Reach out and we\u2019ll let you know what\u2019s possible.",
  },
];

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  institution: string;
  orgSize: string;
  source: string;
  message: string;
};

const emptyForm: FormData = {
  firstName: "",
  lastName: "",
  email: "",
  institution: "",
  orgSize: "",
  source: "",
  message: "",
};

type PricingSectionProps = {
  onBookDemo: () => void;
};

const PricingSection = ({ onBookDemo }: PricingSectionProps) => {
  const [form, setForm] = useState<FormData>(emptyForm);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const set = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    try {
      const res = await fetch("/api/pricing-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus("success");
        setForm(emptyForm);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <section
      id="pricing"
      className="relative overflow-hidden bg-black py-24 scroll-mt-28 md:py-32 md:scroll-mt-32"
    >
      <div className="absolute inset-0 bg-noise opacity-20" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[50rem] h-[25rem] bg-brand-sage/6 rounded-full blur-[12rem]" />

      <div className="relative container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-brand-sage text-sm font-semibold uppercase tracking-[0.2em] mb-4 block">
            Pricing
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Pricing That Scales{" "}
            <span className="text-white/50">With Your Program.</span>
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            DeepPatient is priced based on your institution{"\u2019"}s size and needs not on
            arbitrary tiers. Tell us about your program and we{"\u2019"}ll build a proposal around it.
          </p>
        </motion.div>

        {/* What's included */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-2xl mx-auto mb-20"
        >
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-sm p-8 md:p-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-sage/10 border border-brand-sage/20">
                <Sparkles className="h-5 w-5 text-brand-sage" />
              </div>
              <h3 className="text-xl font-semibold text-white">
                What{"\u2019"}s Always Included
              </h3>
            </div>
            <p className="text-gray-400 text-sm mb-6">
              Every DeepPatient plan includes the full platform {"\u2014"} no feature gating, no upsells:
            </p>
            <ul className="space-y-3">
              {included.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check className="h-4 w-4 text-brand-sage mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="max-w-3xl mx-auto mb-20"
        >
          <h3 className="text-2xl font-bold text-white text-center mb-10">
            How It Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.12 }}
                className="text-center"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-brand-sage/30 bg-brand-sage/10 text-brand-sage font-bold text-lg">
                  {step.number}
                </div>
                <h4 className="text-white font-semibold mb-2">{step.title}</h4>
                <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Pricing Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-2xl mx-auto mb-24"
        >
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-8 md:p-10">
            <h3 className="text-2xl font-bold text-white mb-2 text-center">
              Get a Custom Proposal
            </h3>
            <p className="text-gray-400 text-sm text-center mb-8">
              Tell us about your program and we{"\u2019"}ll put together a tailored quote.
            </p>

            {status === "success" ? (
              <div className="text-center py-8">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/10 border border-success/30">
                  <Check className="h-7 w-7 text-success" />
                </div>
                <h4 className="text-xl font-semibold text-white mb-2">Thank you!</h4>
                <p className="text-gray-400 text-sm">
                  We{"\u2019"}ll review your details and reach out within one business day.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="First name" required>
                    <input
                      type="text"
                      required
                      value={form.firstName}
                      onChange={set("firstName")}
                      className="form-input"
                      placeholder="Jane"
                    />
                  </FormField>
                  <FormField label="Last name" required>
                    <input
                      type="text"
                      required
                      value={form.lastName}
                      onChange={set("lastName")}
                      className="form-input"
                      placeholder="Smith"
                    />
                  </FormField>
                </div>

                <FormField label="Business email" required>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={set("email")}
                    className="form-input"
                    placeholder="jane@university.edu"
                  />
                </FormField>

                <FormField label="Institution / organization name" required>
                  <input
                    type="text"
                    required
                    value={form.institution}
                    onChange={set("institution")}
                    className="form-input"
                    placeholder="University Medical School"
                  />
                </FormField>

                <FormField label="Number of users in your organization" required>
                  <select
                    required
                    value={form.orgSize}
                    onChange={set("orgSize")}
                    className="form-input appearance-none"
                  >
                    <option value="" disabled>Select a range</option>
                    {orgSizes.map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </FormField>

                <FormField label="How did you hear about DeepPatient?">
                  <input
                    type="text"
                    value={form.source}
                    onChange={set("source")}
                    className="form-input"
                    placeholder="Conference, referral, search..."
                  />
                </FormField>

                <FormField label="Anything else we should know?">
                  <textarea
                    value={form.message}
                    onChange={set("message")}
                    rows={3}
                    className="form-input resize-none"
                    placeholder="Tell us about your program, goals, or questions..."
                  />
                </FormField>

                {status === "error" && (
                  <p className="text-destructive text-sm text-center">
                    Something went wrong. Please try again.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="w-full h-12 rounded-full bg-brand-sage text-brand-forest-dark font-semibold text-sm hover:brightness-105 transition-all cursor-pointer disabled:opacity-60 shadow-[0_0_28px_hsl(38,92%,76%,0.3)] flex items-center justify-center gap-2"
                >
                  {status === "submitting" ? (
                    <div className="h-4 w-4 border-2 border-brand-forest-dark/30 border-t-brand-forest-dark rounded-full animate-spin" />
                  ) : (
                    <>
                      Request Pricing
                      <Send className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="max-w-2xl mx-auto mb-20"
        >
          <h3 className="text-2xl font-bold text-white text-center mb-8">
            Frequently Asked Questions
          </h3>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left cursor-pointer"
                >
                  <span className="text-sm font-medium text-white pr-4">{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-4 text-sm text-gray-400 leading-relaxed">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <p className="text-gray-500 text-sm mb-3">Not ready for a proposal yet?</p>
          <button
            type="button"
            onClick={onBookDemo}
            className="inline-flex items-center gap-2 text-brand-sage font-medium text-sm hover:underline underline-offset-4"
          >
            Book a Demo
            <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>
      </div>
    </section>
  );
};

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm text-gray-300 mb-1.5">
        {label}
        {required && <span className="text-brand-sage ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

export { PricingSection };
