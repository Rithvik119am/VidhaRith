
import { cn } from "@/lib/utils";

interface CTAButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

const CTAButton = ({
  children,
  className,
  variant = "primary",
  size = "md",
  onClick,
}: CTAButtonProps) => {
  const variants = {
    primary: "bg-quiz-primary text-white hover:bg-quiz-primary/90",
    secondary: "bg-quiz-secondary text-white hover:bg-quiz-secondary/90",
    outline: "bg-transparent border-2 border-quiz-primary text-quiz-primary hover:bg-quiz-primary/10"
  };

  const sizes = {
    sm: "py-2 px-4 text-sm",
    md: "py-3 px-6 text-base",
    lg: "py-4 px-8 text-lg"
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "font-medium rounded-md transition-all duration-200 shadow-sm hover:shadow-md",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </button>
  );
};

export default CTAButton;
