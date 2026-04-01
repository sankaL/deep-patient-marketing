import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface ContactFormData {
  name: string;
  email: string;
  institution?: string;
  teamSize?: string;
}

interface ContactModalProps {
  open: boolean;
  title: string;
  description: string;
  submitLabel: string;
  submittingLabel?: string;
  submitButtonClassName: string;
  onClose: () => void;
  onSubmit: (data: ContactFormData) => void | Promise<void>;
  showSuccessState?: boolean;
  successTitle?: string;
  successMessage?: string;
  successButtonLabel?: string;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function ContactModal({
  open,
  title,
  description,
  submitLabel,
  submittingLabel,
  submitButtonClassName,
  onClose,
  onSubmit,
  showSuccessState = false,
  successTitle = "Thanks for sharing your details.",
  successMessage = "Your information was captured in this preview flow.",
  successButtonLabel = "Close",
}: ContactModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [institution, setInstitution] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const resetState = () => {
    setName("");
    setEmail("");
    setInstitution("");
    setTeamSize("");
    setErrors({});
    setIsSubmitting(false);
    setIsSuccess(false);
    setSubmitError(null);
  };

  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: { name?: string; email?: string } = {};
    if (!name.trim()) next.name = "Name is required.";
    if (!email.trim()) next.email = "Email is required.";
    else if (!isValidEmail(email)) next.email = "Enter a valid email address.";
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim(),
        institution: institution.trim() || undefined,
        teamSize: teamSize.trim() || undefined,
      });

      if (showSuccessState) {
        setIsSuccess(true);
      }
    } catch (error) {
      setSubmitError(
        error instanceof Error && error.message
          ? error.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 14 }}
            transition={{ duration: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
            className="w-full max-w-md rounded-2xl border border-black/8 bg-white shadow-[0_24px_48px_-12px_rgba(0,0,0,0.3)]"
          >
            <div className="flex items-center justify-between border-b border-black/5 px-6 py-4">
              <h2 className="text-base font-semibold text-brand-forest">{title}</h2>
              <button
                type="button"
                onClick={handleClose}
                className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-brand-forest/8"
              >
                <X className="h-4 w-4 text-brand-forest/50" />
              </button>
            </div>

            {isSuccess ? (
              <div className="space-y-5 px-6 py-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-cream-dark/80">
                  <CheckCircle2 className="h-7 w-7 text-brand-forest" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-brand-forest">{successTitle}</h3>
                  <p className="text-sm leading-6 text-brand-forest/60">{successMessage}</p>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="h-11 w-full rounded-full border border-brand-forest/12 text-sm font-medium text-brand-forest transition-all hover:bg-brand-forest/5"
                >
                  {successButtonLabel}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-4 px-6 py-5">
                <p className="text-sm leading-6 text-brand-forest/60">{description}</p>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-brand-forest/50">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setErrors((previous) => ({ ...previous, name: undefined }));
                    }}
                    placeholder="Your full name"
                    className="w-full rounded-xl border border-brand-forest/12 bg-brand-cream-dark/40 px-4 py-2.5 text-sm text-brand-forest placeholder:text-brand-forest/30 focus:border-[#F2B027]/60 focus:outline-none focus:ring-2 focus:ring-[#F2B027]/20"
                  />
                  {errors.name ? <p className="text-xs text-red-600">{errors.name}</p> : null}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-brand-forest/50">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors((previous) => ({ ...previous, email: undefined }));
                    }}
                    placeholder="you@institution.edu"
                    className="w-full rounded-xl border border-brand-forest/12 bg-brand-cream-dark/40 px-4 py-2.5 text-sm text-brand-forest placeholder:text-brand-forest/30 focus:border-[#F2B027]/60 focus:outline-none focus:ring-2 focus:ring-[#F2B027]/20"
                  />
                  {errors.email ? <p className="text-xs text-red-600">{errors.email}</p> : null}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-brand-forest/50">
                    Institution{" "}
                    <span className="font-normal normal-case tracking-normal text-brand-forest/30">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="University or organization"
                    className="w-full rounded-xl border border-brand-forest/12 bg-brand-cream-dark/40 px-4 py-2.5 text-sm text-brand-forest placeholder:text-brand-forest/30 focus:border-[#F2B027]/60 focus:outline-none focus:ring-2 focus:ring-[#F2B027]/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-brand-forest/50">
                    Team Size{" "}
                    <span className="font-normal normal-case tracking-normal text-brand-forest/30">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value)}
                    placeholder="e.g. 10–50 learners"
                    className="w-full rounded-xl border border-brand-forest/12 bg-brand-cream-dark/40 px-4 py-2.5 text-sm text-brand-forest placeholder:text-brand-forest/30 focus:border-[#F2B027]/60 focus:outline-none focus:ring-2 focus:ring-[#F2B027]/20"
                  />
                </div>

                {submitError ? (
                  <p className="text-sm text-red-600">{submitError}</p>
                ) : null}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="h-11 flex-1 rounded-full border border-brand-forest/12 text-sm font-medium text-brand-forest transition-all hover:bg-brand-forest/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`h-11 flex-1 rounded-full text-sm font-semibold transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-65 ${submitButtonClassName}`}
                  >
                    {isSubmitting ? submittingLabel ?? submitLabel : submitLabel}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
