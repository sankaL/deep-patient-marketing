import { useState } from "react";
import {
  ContactModal,
  type ContactFormData,
} from "@/components/contact-modal";
import { HeroSection } from "@/components/ui/hero-section";
import { FeaturesSection } from "@/sections/features-section";
import { PersonasSection } from "@/sections/personas-section";
import { PricingSection } from "@/sections/pricing-section";
import { FooterCtaSection } from "@/sections/footer-cta-section";
import { Footer } from "@/sections/footer";
import { submitDemoRequest } from "@/lib/leads";

function MarketingSite() {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const handleBookDemo = () => {
    setIsDemoModalOpen(true);
  };

  const handleDemoSubmit = async (_data: ContactFormData) => {
    await submitDemoRequest(_data);
  };

  return (
    <div className="min-h-screen bg-[hsl(187,21%,10%)]">
      <HeroSection onBookDemo={handleBookDemo} />
      <FeaturesSection />
      <PersonasSection onBookDemo={handleBookDemo} />
      <PricingSection onBookDemo={handleBookDemo} />
      <FooterCtaSection onBookDemo={handleBookDemo} />
      <Footer />
      <ContactModal
        open={isDemoModalOpen}
        title="Book a Demo"
        description="Tell us a little about your program. We’ll follow up to arrange a useful, focused demo."
        onClose={() => setIsDemoModalOpen(false)}
        onSubmit={handleDemoSubmit}
        submitLabel="Book a Demo"
        submittingLabel="Saving..."
        submitButtonClassName="bg-brand-sage text-brand-forest-dark shadow-[0_0_28px_hsl(38,92%,76%,0.32)]"
        showSuccessState
        successTitle="Thanks. We’ll be in touch."
        successMessage="We’ve received your request and will follow up soon."
        successButtonLabel="Done"
      />
    </div>
  );
}

function App() {
  return <MarketingSite />;
}

export default App;
