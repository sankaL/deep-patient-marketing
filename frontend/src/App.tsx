import { useState } from "react";
import { AdminApp } from "@/admin/admin-app";
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
import { submitDemoRequest } from "@/lib/leads";

function MarketingSite() {
  const [demoRequestId, setDemoRequestId] = useState(0);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const handleBookDemo = () => {
    setIsDemoModalOpen(true);
  };

  const handleDemoSubmit = async (_data: ContactFormData) => {
    await submitDemoRequest(_data, "book_demo");
  };

  return (
    <div className="min-h-screen bg-[hsl(187,21%,10%)]">
      <HeroSection
        onBookDemo={handleBookDemo}
        onWatchDemo={() => setDemoRequestId((id) => id + 1)}
      />
      <IntroVideoSection demoRequestId={demoRequestId} />
      <FeaturesSection />
      <PersonasSection onBookDemo={handleBookDemo} />
      <PricingSection onBookDemo={handleBookDemo} />
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

function App() {
  if (window.location.pathname.startsWith("/admin")) {
    return <AdminApp />;
  }

  return <MarketingSite />;
}

export default App;
