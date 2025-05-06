
import { BookOpen, FileText, CheckCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}

const FeatureCard = ({ icon, title, description, className }: FeatureCardProps) => (
  <div className={cn(
    "bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-border",
    className
  )}>
    <div className="w-12 h-12 flex items-center justify-center rounded-full bg-quiz-primary/10 mb-5">
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-3">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

const Features = () => {
  const features = [
    {
      icon: <FileText className="text-quiz-primary" size={24} />,
      title: "AI-Generated Questions",
      description: "Upload your teaching materials and our AI will automatically create relevant multiple-choice questions."
    },
    {
      icon: <BookOpen className="text-quiz-primary" size={24} />,
      title: "Configurable Quizzes",
      description: "Set start/end times, response windows, and control when to stop accepting responses."
    },
    {
      icon: <CheckCircle className="text-quiz-primary" size={24} />,
      title: "Automatic Grading",
      description: "Responses are instantly collected and analyzed, saving you hours of manual grading time."
    },
    {
      icon: <ChevronRight className="text-quiz-primary" size={24} />,
      title: "Targeted Insights",
      description: "Receive detailed reports showing which topics students understand and which need reinforcement."
    },
  ];

  return (
    <section id="features" className="section bg-secondary/50">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold mb-4">
            Powerful Features for <span className="gradient-text">Effective Teaching</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Our platform helps educators identify knowledge gaps and improve teaching effectiveness through intelligent quiz generation and analysis.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
