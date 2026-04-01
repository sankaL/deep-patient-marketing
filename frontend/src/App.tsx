import { useState } from "react";
import {
  ContactModal,
  type ContactFormData,
} from "@/components/live-session/contact-modal";
import { HeroSection } from "@/components/ui/hero-section";
import { IntroVideoSection } from "@/sections/intro-video-section";
import { FeaturesSection } from "@/sections/features-section";
import { PersonasSection } from "@/sections/personas-section";
import { PricingSection } from "@/sections/pricing-section";
import { FooterCtaSection } from "@/sections/footer-cta-section";
import { Footer } from "@/sections/footer";

function App() {
  const [demoRequestId, setDemoRequestId] = useState(0);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const handleBookDemo = () => {
    setIsDemoModalOpen(true);
  };

  const handleDemoSubmit = async (_data: ContactFormData) => {
    void _data;
    await Promise.resolve();
  };

  return (
    <div className="min-h-screen bg-black">
      <HeroSection
        onBookDemo={handleBookDemo}
        onWatchDemo={() => setDemoRequestId((id) => id + 1)}
      />
      {/* Bridge gradient */}
      <div
        className="relative -mt-48 h-48 pointer-events-none z-10 bg-gradient-to-b from-transparent to-[hsl(187,21%,10%)]"
        aria-hidden="true"
      />
      <IntroVideoSection demoRequestId={demoRequestId} />
      <FeaturesSection />
      <PersonasSection onBookDemo={handleBookDemo} />
      <PricingSection />
      <FooterCtaSection onBookDemo={handleBookDemo} />
      <Footer />
      <ContactModal
        open={isDemoModalOpen}
        title="Book a Demo"
        description="Share a few details so this demo flow can capture the right contact context for your program."
        onClose={() => setIsDemoModalOpen(false)}
        onSubmit={handleDemoSubmit}
        submitLabel="Book a Demo"
        submittingLabel="Saving..."
        submitButtonClassName="bg-brand-sage text-brand-forest-dark shadow-[0_0_28px_hsl(38,92%,76%,0.32)]"
        showSuccessState
        successTitle="Thanks for sharing your details."
        successMessage="Your demo information was captured in this preview flow. You can keep exploring DeepPatient or close this window."
        successButtonLabel="Done"
      />
    </div>
  );
}

export default App;
