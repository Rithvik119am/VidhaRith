
import { cn } from "@/lib/utils";

interface StepProps {
  number: number;
  title: string;
  description: string;
  isLast?: boolean;
}

const Step = ({ number, title, description, isLast = false }: StepProps) => (
  <div className="flex">
    <div className="flex flex-col items-center mr-6">
      <div className="w-10 h-10 rounded-full bg-quiz-primary flex items-center justify-center text-white font-bold">
        {number}
      </div>
      {!isLast && <div className="h-full w-0.5 bg-quiz-primary/30 mt-2"></div>}
    </div>
    <div className="pb-8">
      <h3 className="font-semibold text-xl mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  </div>
);

const HowItWorks = () => {
  const steps = [
    {
      title: "Upload Teaching Materials",
      description: "Upload your lecture notes, slides, or teaching materials in PDF format to our secure platform."
    },
    {
      title: "Configure Your Quiz",
      description: "Set quiz parameters including start/end times, response windows, and other customizable options."
    },
    {
      title: "Share with Students",
      description: "Share the automatically generated quiz link with your students via email, SMS, or your LMS."
    },
    {
      title: "Review Comprehensive Reports",
      description: "After students complete the quiz, access detailed analytics showing performance across topics and concepts."
    }
  ];

  return (
    <section id="how-it-works" className="section">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold mb-4">
              How <span className="gradient-text">VidhaRith</span> Works
            </h2>
            <p className="text-lg text-muted-foreground mb-10">
              Our straightforward process helps you gain valuable insights about your students' understanding in just a few easy steps.
            </p>
            
            <div className="space-y-2">
              {steps.map((step, index) => (
                <Step
                  key={index}
                  number={index + 1}
                  title={step.title}
                  description={step.description}
                  isLast={index === steps.length - 1}
                />
              ))}
            </div>
          </div>
          
          <div className="relative">
            <div className="bg-quiz-light rounded-2xl p-6 relative z-10">
              <img
                src="https://source.unsplash.com/photo-1486312338219-ce68d2c6f44d"
                alt="Teacher using Quiz Genie"
                className="rounded-lg shadow-lg w-full"
              />
            </div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-quiz-primary rounded-full blur-3xl opacity-10 -z-10"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
