"use client";

import { useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import logoWhite from "@/assets/brand/deeppatient-logo-white.svg";
import { HeroVideo } from "@/components/ui/hero-video";
import { HeroShapes } from "@/components/ui/shape-landing-hero";

type HeroSectionProps = {
  onBookDemo: () => void;
};

const HeroSection = ({ onBookDemo }: HeroSectionProps) => {
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
            className="fixed inset-0 z-50 flex flex-col bg-surface-1/95 p-5 backdrop-blur-xl md:hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={logoWhite} alt="DeepPatient" className="h-8 w-8 brightness-0 opacity-80" />
                <span className="text-xl font-bold text-brand-forest">
                  DeepPatient
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-brand-forest/10 bg-white"
              >
                <X className="h-5 w-5 text-brand-forest" />
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
                  className="h-12 w-full cursor-pointer rounded-full bg-brand-forest px-8 text-base font-semibold text-white shadow-[0_12px_26px_hsl(187,21%,16%,0.18)] transition-[transform,background-color] hover:bg-brand-forest-light active:scale-[0.97]"
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
        className="relative overflow-x-clip overflow-y-hidden bg-surface-1"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_0%,white_0%,hsl(40,43%,98%)_60%,hsl(40,43%,98%)_100%)]" />
        <div className="absolute -right-28 -top-6 z-0 flex flex-col items-end [transform:translateZ(0)] [will-change:transform] sm:-right-44 md:-right-60">
          <div className="z-1 h-[8rem] w-[22rem] rounded-full bg-gradient-to-b from-brand-sage/50 to-brand-cream/20 blur-[3rem] [transform:translateZ(0)] [will-change:transform] sm:h-[9rem] sm:w-[42rem] md:h-[10rem] md:w-[60rem]"></div>
          <div className="z-1 h-[8rem] w-[32rem] rounded-full bg-gradient-to-b from-brand-bark/10 to-feedback-cta/15 blur-[3rem] [transform:translateZ(0)] [will-change:transform] sm:h-[9rem] sm:w-[58rem] md:h-[10rem] md:w-[90rem]"></div>
        </div>
        <div className="absolute inset-0 z-0 bg-noise opacity-40 [mask-image:linear-gradient(to_bottom,black_0%,black_45%,transparent_85%)] [will-change:opacity]"></div>

        <HeroShapes />

        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-surface-1 via-transparent to-white/35"
          style={{ backgroundSize: "100% 100%" }}
        />

        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 z-[2] h-[55%] [mask-image:linear-gradient(to_bottom,black_0%,black_75%,transparent_100%)]"
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface-1/40 to-surface-1" />
          <div className="absolute bottom-12 left-1/2 h-64 w-[26rem] -translate-x-1/2 rounded-full bg-brand-sage/20 blur-[8rem] sm:w-[48rem] md:h-72 md:w-[80rem] md:blur-[10rem]" />
        </div>

        <div className="relative z-10 pt-2 md:pt-4">
          <nav className="container mx-auto flex items-center justify-between px-4 py-5">
            <a href="#top" className="flex items-center gap-3">
              <img src={logoWhite} alt="DeepPatient" className="h-8 w-8 brightness-0 opacity-80" />
              <span className="text-xl font-bold tracking-tight text-brand-forest">
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
                className="h-11 cursor-pointer rounded-full bg-brand-forest px-7 text-sm font-semibold text-white shadow-[0_10px_24px_hsl(187,21%,16%,0.16)] transition-[transform,background-color] hover:bg-brand-forest-light active:scale-[0.97]"
              >
                Book a Demo
              </button>
            </div>

            <button
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-brand-forest/10 bg-white/70 md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Toggle menu</span>
              {mobileMenuOpen ? (
                <X className="h-5 w-5 text-brand-forest" />
              ) : (
                <Menu className="h-5 w-5 text-brand-forest" />
              )}
            </button>
          </nav>

          <div className="mx-auto mt-6 flex max-w-fit items-center justify-center space-x-2 rounded-full border border-brand-forest/10 bg-white/70 px-4 py-2 shadow-sm backdrop-blur-sm sm:px-5 sm:py-2.5">
            <span className="text-center text-xs font-semibold text-brand-bark sm:text-sm">
              More practice. Better feedback.
            </span>
            <ArrowRight className="h-4 w-4 text-brand-bark" />
          </div>

          <div className="container mx-auto mt-5 px-4 text-center sm:mt-7">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 1,
                delay: 0.3,
                ease: [0.25, 0.4, 0.25, 1],
              }}
              className="mx-auto max-w-5xl text-balance text-4xl font-extrabold leading-[1.05] tracking-[-0.045em] text-brand-forest md:text-6xl lg:text-7xl"
            >
              <span>
                Practice Clinical Skills
              </span>{" "}
              <span className="text-brand-bark">
                with an On-Demand
              </span>{" "}
              <span>
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
              className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-brand-forest/65 sm:text-lg"
            >
              DeepPatient lets medical learners interview a lifelike AI patient,
              then shows them what they did well and where they need more work.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 1,
                delay: 0.7,
                ease: [0.25, 0.4, 0.25, 1],
              }}
              className="mt-8 flex items-center justify-center sm:mt-9"
            >
              <button
                type="button"
                onClick={onBookDemo}
                className="h-12 cursor-pointer rounded-full bg-brand-forest px-8 text-base font-semibold text-white shadow-[0_12px_26px_hsl(187,21%,16%,0.18)] transition-[transform,background-color] hover:bg-brand-forest-light active:scale-[0.97]"
              >
                Book a Demo
              </button>
            </motion.div>
          </div>

          <HeroVideo />
        </div>
      </section>
    </>
  );
};

function NavItem({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      className="flex items-center text-sm font-medium text-brand-forest/65 hover:text-brand-forest transition-colors cursor-pointer"
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
      className="flex items-center justify-between border-b border-brand-forest/10 pb-4 text-lg font-medium text-brand-forest cursor-pointer"
    >
      <span>{label}</span>
      <ArrowRight className="h-4 w-4 text-brand-bark" />
    </a>
  );
}

export { HeroSection };
