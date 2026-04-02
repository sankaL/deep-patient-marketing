"use client";

import { useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import logoWhite from "@/assets/brand/deeppatient-logo-white.svg";
import { LiveSessionPreview } from "@/components/live-session/live-session-preview";
import { HeroShapes } from "@/components/ui/shape-landing-hero";

type HeroSectionProps = {
  onBookDemo: () => void;
  onWatchDemo: () => void;
};

const HeroSection = ({ onBookDemo, onWatchDemo }: HeroSectionProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex flex-col bg-black/95 p-4 backdrop-blur-xl md:hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={logoWhite} alt="DeepPatient" className="h-8 w-8" />
                <span className="text-xl font-bold text-white">
                  DeepPatient
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="cursor-pointer"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="mt-8 flex flex-col space-y-6">
              <MobileNavItem
                label="Features"
                href="#features"
                onNavigate={() => setMobileMenuOpen(false)}
              />
              <MobileNavItem
                label="Pricing"
                href="#pricing"
                onNavigate={() => setMobileMenuOpen(false)}
              />
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onBookDemo();
                  }}
                  className="h-12 w-full cursor-pointer rounded-full bg-brand-sage px-8 text-base font-semibold text-brand-forest-dark shadow-[0_0_24px_hsl(38,92%,76%,0.28)] transition-all hover:brightness-105"
                >
                  Book a Demo
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <section
        id="top"
        className="relative min-h-[780px] overflow-x-clip overflow-y-hidden bg-[#030303] md:min-h-[860px] lg:min-h-[900px]"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(38,92%,76%)]/[0.04] via-transparent to-[hsl(26,40%,39%)]/[0.04]" />
        <div className="absolute -right-28 -top-6 z-0 flex flex-col items-end [transform:translateZ(0)] [will-change:transform] sm:-right-44 md:-right-60">
          <div className="z-1 h-[8rem] w-[22rem] rounded-full bg-gradient-to-b from-[hsl(38,92%,76%)]/30 to-[hsl(187,21%,16%)]/20 blur-[3rem] [transform:translateZ(0)] [will-change:transform] sm:h-[9rem] sm:w-[42rem] md:h-[10rem] md:w-[60rem]"></div>
          <div className="z-1 h-[8rem] w-[32rem] rounded-full bg-gradient-to-b from-[hsl(26,40%,39%)]/30 to-[hsl(40,89%,55%)]/20 blur-[3rem] [transform:translateZ(0)] [will-change:transform] sm:h-[9rem] sm:w-[58rem] md:h-[10rem] md:w-[90rem]"></div>
          <div className="z-1 h-[8rem] w-[22rem] rounded-full bg-gradient-to-b from-[hsl(40,89%,55%)]/30 to-[hsl(187,21%,22%)]/20 blur-[3rem] [transform:translateZ(0)] [will-change:transform] sm:h-[9rem] sm:w-[42rem] md:h-[10rem] md:w-[60rem]"></div>
        </div>
        <div className="absolute inset-0 z-0 bg-noise opacity-30 [will-change:opacity]"></div>

        <HeroShapes />

        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-[hsl(187,21%,10%)] via-[hsl(187,21%,10%)]/20 to-[#030303]/80"
          style={{ backgroundSize: "100% 100%" }}
        />

        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 z-[2] h-[55%]"
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[hsl(187,30%,10%)]/40 to-[hsl(187,21%,10%)]" />
          <div className="absolute bottom-0 left-1/2 h-64 w-[26rem] -translate-x-1/2 rounded-full bg-[hsl(187,60%,25%)]/12 blur-[8rem] sm:w-[48rem] md:h-72 md:w-[80rem] md:blur-[10rem]" />
          <div className="absolute bottom-8 left-1/2 h-32 w-[18rem] -translate-x-1/2 rounded-full bg-[hsl(187,70%,40%)]/6 blur-[6rem] sm:w-[30rem] md:h-40 md:w-[40rem] md:blur-[8rem]" />
        </div>

        <div className="relative z-10 pt-2 md:pt-4">
          <nav className="container mx-auto flex items-center justify-between px-4 py-4">
            <a href="#top" className="flex items-center gap-3">
              <img src={logoWhite} alt="DeepPatient" className="h-8 w-8" />
              <span className="text-xl font-bold tracking-tight text-white">
                DeepPatient
              </span>
            </a>

            <div className="hidden items-center space-x-6 md:flex">
              <div className="flex items-center space-x-6">
                <NavItem label="Features" href="#features" />
                <NavItem label="Pricing" href="#pricing" />
              </div>
              <button
                type="button"
                onClick={onBookDemo}
                className="h-11 cursor-pointer rounded-full bg-brand-sage px-7 text-sm font-semibold text-brand-forest-dark shadow-[0_0_24px_hsl(38,92%,76%,0.28)] transition-all hover:brightness-105"
              >
                Book a Demo
              </button>
            </div>

            <button
              className="cursor-pointer md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Toggle menu</span>
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-white" />
              ) : (
                <Menu className="h-6 w-6 text-white" />
              )}
            </button>
          </nav>

          <div className="mx-auto mt-2 flex max-w-fit items-center justify-center space-x-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 backdrop-blur-sm sm:px-5 sm:py-2.5">
            <span className="text-center text-xs font-medium text-brand-sage sm:text-sm">
              Scalable practice. Measurable outcomes.
            </span>
            <ArrowRight className="h-4 w-4 text-brand-sage" />
          </div>

          <div className="container mx-auto mt-6 px-4 text-center sm:mt-8">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 1,
                delay: 0.3,
                ease: [0.25, 0.4, 0.25, 1],
              }}
              className="mx-auto max-w-5xl text-4xl font-extrabold leading-[1.1] tracking-tight md:text-6xl lg:text-7xl"
            >
              <span className="bg-gradient-to-b from-white to-white/80 bg-clip-text text-transparent">
                Master Clinical Skills
              </span>{" "}
              <span className="bg-gradient-to-r from-brand-sage via-white/90 to-brand-sage bg-clip-text text-transparent">
                with an On-Demand
              </span>{" "}
              <span className="bg-gradient-to-b from-white to-white/80 bg-clip-text text-transparent">
                AI Patient
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 1,
                delay: 0.5,
                ease: [0.25, 0.4, 0.25, 1],
              }}
              className="mx-auto mt-6 max-w-2xl text-base font-light leading-relaxed tracking-wide text-white/40 sm:text-lg"
            >
              DeepPatient gives medical learners safe, repeatable, and interactive
              patient encounters, with instant, rubric-based feedback on
              communication and diagnostic skills.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 1,
                delay: 0.7,
                ease: [0.25, 0.4, 0.25, 1],
              }}
              className="mt-8 flex flex-col items-center justify-center space-y-4 sm:mt-10 sm:flex-row sm:space-x-4 sm:space-y-0"
            >
              <button
                type="button"
                onClick={onBookDemo}
                className="h-12 cursor-pointer rounded-full bg-brand-sage px-8 text-base font-semibold text-brand-forest-dark shadow-[0_0_32px_hsl(38,92%,76%,0.32)] transition-all hover:brightness-105"
              >
                Book a Demo
              </button>
              <button
                type="button"
                onClick={onWatchDemo}
                className="h-12 cursor-pointer rounded-full border border-gray-600 px-8 text-base font-medium text-white transition-all hover:bg-white/5"
              >
                Watch Demo
              </button>
            </motion.div>
            <LiveSessionPreview />
          </div>
        </div>
      </section>
    </>
  );
};

function NavItem({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      className="flex items-center text-sm text-gray-300 hover:text-white transition-colors cursor-pointer"
    >
      <span>{label}</span>
    </a>
  );
}

function MobileNavItem({
  label,
  href,
  onNavigate,
}: {
  label: string;
  href: string;
  onNavigate?: () => void;
}) {
  return (
    <a
      href={href}
      onClick={onNavigate}
      className="flex items-center justify-between border-b border-gray-800 pb-2 text-lg text-white cursor-pointer"
    >
      <span>{label}</span>
      <ArrowRight className="h-4 w-4 text-gray-400" />
    </a>
  );
}

export { HeroSection };
