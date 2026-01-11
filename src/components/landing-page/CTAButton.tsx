"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CTAButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  disabled?: boolean;
}

const CTAButton = ({
  children,
  className,
  variant = "primary",
  size = "md",
  onClick,
  disabled = false,
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
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{
        scale: 1.03,
        boxShadow: variant === "primary"
          ? "0 10px 30px rgba(110, 89, 165, 0.35)"
          : "0 10px 25px rgba(0, 0, 0, 0.1)"
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={cn(
        "font-medium rounded-lg transition-colors duration-200 shadow-sm relative overflow-hidden",
        variants[variant],
        sizes[size],
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
};

export default CTAButton;
