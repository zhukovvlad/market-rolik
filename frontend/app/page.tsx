import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <HeroSection />
      <Features />
      <HowItWorks />
      <Footer />
    </main>
  );
}