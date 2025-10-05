import { CTASection } from "./CTASection";
import { FAQSection } from "./FAQSection";
import { FeaturesSection } from "./FeaturesSection";
import { HeroSection } from "./HeroSection";
import { HowItWorksSection } from "./HowItWorksSection";
import { LogosSection } from "./LogosSection";
import { PricingSection } from "./PricingSection";
import { TestimonialsSection } from "./TestimonialsSection";


export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <LogosSection  />
      <FeaturesSection />
      <HowItWorksSection  />
      <TestimonialsSection />
      <PricingSection  />
      <FAQSection />
      <CTASection />
    </>
  )
}