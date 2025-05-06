
import { Check } from "lucide-react";
import CTAButton from "./CTAButton";
import { cn } from "@/lib/utils";

interface PricingCardProps {
  title: string;
  price: string;
  description: string;
  features: string[];
  popular?: boolean;
  buttonText: string;
}

const PricingCard = ({
  title,
  price,
  description,
  features,
  popular = false,
  buttonText,
}: PricingCardProps) => (
  <div
    className={cn(
      "rounded-xl p-6 md:p-8 shadow-lg transition-transform duration-300 hover:-translate-y-1",
      popular
        ? "bg-gradient-to-b from-quiz-primary/90 to-quiz-secondary border border-quiz-primary text-white relative z-10 scale-105"
        : "bg-white border border-border"
    )}
  >
    {popular && (
      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-quiz-dark text-white text-sm px-4 py-1 rounded-full">
        Most Popular
      </div>
    )}
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <div className="mb-4">
      <span className="text-3xl font-bold">{price}</span>
      {price !== "Free" && <span className="text-sm opacity-80">/month</span>}
    </div>
    <p className={cn("mb-6 text-sm", popular ? "text-white/80" : "text-muted-foreground")}>{description}</p>
    
    <ul className="space-y-3 mb-8">
      {features.map((feature, index) => (
        <li key={index} className="flex items-start">
          <Check size={18} className={popular ? "text-white mr-2 mt-0.5" : "text-quiz-primary mr-2 mt-0.5"} />
          <span className={popular ? "text-white/90" : ""}>{feature}</span>
        </li>
      ))}
    </ul>
    
    <CTAButton
      variant={popular ? "secondary" : "primary"}
      size="md"
      className="w-full"
    >
      {buttonText}
    </CTAButton>
  </div>
);

const Pricing = () => {
  return (
    <section id="pricing" className="section">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold mb-4">
            Simple, Transparent <span className="gradient-text">Pricing</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Choose the plan that works best for you and your teaching needs. No hidden fees or complicated tiers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <PricingCard
            title="Free"
            price="Free"
            description="Perfect for trying out the platform."
            buttonText="Get Started"
            features={[
              "5 quizzes per month",
              "Up to 30 students per quiz",
              "Basic analytics",
              "Email support"
            ]}
          />
          
          <PricingCard
            title="Pro"
            price="$19"
            description="Great for individual educators."
            buttonText="Start 14-Day Trial"
            popular={true}
            features={[
              "Unlimited quizzes",
              "Up to 100 students per quiz",
              "Advanced analytics & reporting",
              "Priority email support",
              "Quiz templates"
            ]}
          />
          
          <PricingCard
            title="School"
            price="$99"
            description="Ideal for schools and departments."
            buttonText="Contact Sales"
            features={[
              "Everything in Pro",
              "Unlimited students",
              "Admin dashboard",
              "Custom integration",
              "Dedicated support",
              "Training sessions"
            ]}
          />
        </div>
      </div>
    </section>
  );
};

export default Pricing;
