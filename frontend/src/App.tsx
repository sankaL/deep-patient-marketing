import { HeroSection } from "@/components/ui/hero-section";
import { FeaturesSection } from "@/sections/features-section";
import { PersonasSection } from "@/sections/personas-section";
import { TestimonialSection } from "@/sections/testimonial-section";
import { FooterCtaSection } from "@/sections/footer-cta-section";
import { NewsletterSection } from "@/sections/newsletter-section";
import { Footer } from "@/sections/footer";

function App() {
  return (
    <div className="min-h-screen bg-black">
      <HeroSection />
      <FeaturesSection />
      <PersonasSection />
      <TestimonialSection />
      <FooterCtaSection />
      <NewsletterSection />
      <Footer />
    </div>
  );
}

export default App;
