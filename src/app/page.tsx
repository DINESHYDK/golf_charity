// ─── LANDING PAGE ────────────────────────────
// Homepage: Navbar → Hero → How It Works → Charities → Pricing → CTA → Footer
// PRD: "Clearly communicates: what the user does, how they win, charity impact, and CTA"

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import FeaturedCharities from "@/components/landing/FeaturedCharities";
import PricingPlans from "@/components/landing/PricingPlans";
import CTASection from "@/components/landing/CTASection";
import CharityLamp from "@/components/landing/CharityLamp";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <FeaturedCharities />
        <PricingPlans />
        <CTASection />
        {/* Lamp section — amber warmth above the footer charity pledge */}
        <CharityLamp />
      </main>
      <Footer />
    </>
  );
}
