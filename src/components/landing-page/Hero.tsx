
import CTAButton from "./CTAButton";
import Image from "next/image"
import { Authenticated, Unauthenticated } from "convex/react";
const Hero = () => {
  return (
    <section className="pt-28 pb-20 md:pt-40 md:pb-32 bg-gradient-to-b from-white to-quiz-light">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight mb-6">
              Identify Knowledge Gaps with 
              <span className="gradient-text block mt-2">
                Intelligent Quiz Analytics
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0">
              Upload your teaching materials and let our AI create targeted quizzes. 
              Get detailed reports to discover what students struggle with and optimize your teaching focus.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Unauthenticated>
              <CTAButton variant="primary" size="lg" onClick={() => window.location.href = "/sign-in"}>Get Started For Free</CTAButton>
              </Unauthenticated>
              <Authenticated>
              <CTAButton variant="primary" size="lg" onClick={() => window.location.href = "/dashboard/forms"}>Dashboard</CTAButton>
              </Authenticated>
              <CTAButton variant="outline" size="lg" onClick={() => window.location.href = "#how-it-works"}>See How It Works</CTAButton>
            </div>
          </div>
          <div className="flex-1 relative">
            <div className="relative z-10  p-5 rounded-xl shadow-xl">
              <Image
                src="/1.png"
                alt="Quiz Genie Analytics Dashboard"
                className="rounded-lg w-full object-cover h-auto"
                width={1200}
                height={900}
              />
            </div>
            <div className="absolute top-10 -right-10 bg-quiz-accent rounded-full w-32 h-32 blur-3xl opacity-70 z-0"></div>
            <div className="absolute -bottom-10 -left-10 bg-quiz-primary rounded-full w-24 h-24 blur-3xl opacity-40 z-0"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
