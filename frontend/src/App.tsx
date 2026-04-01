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
      {/* Bridge gradient sits outside overflow-hidden — covers the section seam completely */}
      <div className="relative -mt-48 h-48 pointer-events-none z-10 bg-gradient-to-b from-transparent to-[hsl(187,21%,10%)]" aria-hidden="true" />
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
