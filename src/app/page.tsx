"use client";
import Navbar from "@/components/landing-page/Navbar";
import Hero from "@/components/landing-page/Hero";
import Features from "@/components/landing-page/Features";
import HowItWorks from "@/components/landing-page/HowItWorks";
import Testimonials from "@/components/landing-page/Testimonials";
import Pricing from "@/components/landing-page/Pricing";
import Footer from "@/components/landing-page/Footer";
export default function Home() {

  return ( <>
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-16">
        <Hero />
        <Features />
        <HowItWorks />
        {/*<Testimonials />*/}
        {/*<Pricing />*/}
      </main>
      <Footer />
    </div>
  </>);
}