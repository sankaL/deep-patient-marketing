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
    <div id="top" className="relative min-h-[820px] overflow-hidden bg-[#030303] md:min-h-[860px] lg:min-h-[900px]">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(38,92%,76%)]/[0.04] via-transparent to-[hsl(26,40%,39%)]/[0.04]" />
      <div className="flex flex-col items-end absolute -right-60 -top-10 z-0 [will-change:transform] [transform:translateZ(0)]">
        <div className="h-[10rem] rounded-full w-[60rem] z-1 bg-gradient-to-b blur-[3rem] from-[hsl(38,92%,76%)]/30 to-[hsl(187,21%,16%)]/20 [will-change:transform] [transform:translateZ(0)]"></div>
        <div className="h-[10rem] rounded-full w-[90rem] z-1 bg-gradient-to-b blur-[3rem] from-[hsl(26,40%,39%)]/30 to-[hsl(40,89%,55%)]/20 [will-change:transform] [transform:translateZ(0)]"></div>
        <div className="h-[10rem] rounded-full w-[60rem] z-1 bg-gradient-to-b blur-[3rem] from-[hsl(40,89%,55%)]/30 to-[hsl(187,21%,22%)]/20 [will-change:transform] [transform:translateZ(0)]"></div>
      </div>
      <div className="absolute inset-0 z-0 bg-noise opacity-30 [will-change:opacity]"></div>

      <HeroShapes />

      <div className="absolute inset-0 bg-gradient-to-t from-[hsl(187,21%,10%)] via-[hsl(187,21%,10%)]/20 to-[#030303]/80 pointer-events-none z-[1]" style={{backgroundSize:'100% 100%'}} />

      <div className="absolute bottom-0 left-0 right-0 h-[55%] pointer-events-none z-[2]" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[hsl(187,30%,10%)]/40 to-[hsl(187,21%,10%)]" />
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[80rem] h-72 bg-[hsl(187,60%,25%)]/12 blur-[10rem] rounded-full" />
        <div className="absolute left-1/2 -translate-x-1/2 bottom-8 w-[40rem] h-40 bg-[hsl(187,70%,40%)]/6 blur-[8rem] rounded-full" />
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="container mx-auto flex items-center justify-between px-4 py-4 mt-6">
          <div className="flex items-center gap-3">
            <img src={logoWhite} alt="DeepPatient" className="h-8 w-8" />
            <span className="text-xl font-bold text-white tracking-tight">
              DeepPatient
            </span>
          </div>

          {/* Desktop */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-6">
              <NavItem label="Features" href="#features" />
              <NavItem label="Pricing" href="#pricing" />
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onBookDemo}
                className="h-11 rounded-full bg-brand-sage px-7 text-sm font-semibold text-brand-forest-dark hover:brightness-105 transition-all cursor-pointer shadow-[0_0_24px_hsl(38,92%,76%,0.28)]"
              >
                Book a Demo
              </button>
            </div>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden cursor-pointer"
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

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ y: "-100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-100%" }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-50 flex flex-col p-4 bg-black/95 backdrop-blur-xl md:hidden"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={logoWhite} alt="DeepPatient" className="h-8 w-8" />
                  <span className="text-xl font-bold text-white">
                    DeepPatient
                  </span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="cursor-pointer">
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
              <div className="mt-8 flex flex-col space-y-6">
                <MobileNavItem label="Features" href="#features" onNavigate={() => setMobileMenuOpen(false)} />
                <MobileNavItem label="Pricing" href="#pricing" onNavigate={() => setMobileMenuOpen(false)} />
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onBookDemo();
                    }}
                    className="w-full h-12 rounded-full bg-brand-sage px-8 text-base font-semibold text-brand-forest-dark hover:brightness-105 transition-all cursor-pointer shadow-[0_0_24px_hsl(38,92%,76%,0.28)]"
                  >
                    Book a Demo
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Badge */}
        <div className="mx-auto mt-8 flex max-w-fit items-center justify-center space-x-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-5 py-2.5 backdrop-blur-sm">
          <span className="text-sm font-medium text-brand-sage">
            Scalable practice. Measurable outcomes.
          </span>
          <ArrowRight className="h-4 w-4 text-brand-sage" />
        </div>

        {/* Hero Copy */}
        <div className="container mx-auto mt-10 px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
            className="mx-auto max-w-5xl text-4xl font-extrabold leading-[1.1] md:text-6xl lg:text-7xl tracking-tight"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80">
              Master Clinical Skills
            </span>{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-sage via-white/90 to-brand-sage">
              with an On-Demand
            </span>{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80">
              AI Patient
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/40 font-light tracking-wide"
          >
            DeepPatient gives medical learners safe, repeatable, and interactive
            patient encounters, with instant, rubric-based feedback on
            communication and diagnostic skills.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
            className="mt-10 flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0"
          >
            <button
              type="button"
              onClick={onBookDemo}
              className="h-12 rounded-full bg-brand-sage px-8 text-base font-semibold text-brand-forest-dark hover:brightness-105 transition-all cursor-pointer shadow-[0_0_32px_hsl(38,92%,76%,0.32)]"
            >
              Book a Demo
            </button>
            <button
              type="button"
              onClick={onWatchDemo}
              className="h-12 rounded-full border border-gray-600 px-8 text-base font-medium text-white hover:bg-white/5 transition-all cursor-pointer"
            >
              Watch Demo
            </button>
          </motion.div>
          <LiveSessionPreview />
        </div>
      </div>
    </div>
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
