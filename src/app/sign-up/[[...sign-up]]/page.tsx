"use client";

import { SignUp } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Sparkles, ArrowLeft, FileText, Brain, BarChart3, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function SignUpPage() {
  const steps = [
    { icon: FileText, text: "Upload your study materials" },
    { icon: Brain, text: "AI generates quiz questions" },
    { icon: BarChart3, text: "See where students struggle" },
  ];

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-quiz-light via-white to-quiz-accent/20 relative overflow-hidden">
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-quiz-secondary/20 to-quiz-primary/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -40, 0],
            y: [0, 40, 0],
            scale: [1.1, 1, 1.1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-gradient-to-br from-quiz-accent/30 to-quiz-secondary/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/3 left-1/4 w-64 h-64 bg-quiz-mint/10 rounded-full blur-3xl"
        />
      </div>

      {/* Left side - Sign Up Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10 order-2 lg:order-1">
        {/* Mobile back button */}
        <Link href="/" className="absolute top-6 left-6 lg:hidden">
          <motion.div
            whileHover={{ x: -4 }}
            className="flex items-center gap-2 text-gray-600 hover:text-quiz-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </motion.div>
        </Link>

        {/* Mobile logo */}
        <div className="absolute top-6 right-6 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-quiz-primary to-quiz-secondary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-md"
        >
          <SignUp
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-white/80 backdrop-blur-xl shadow-2xl shadow-quiz-primary/10 border border-white/50 rounded-2xl",
                headerTitle: "text-gray-900 font-display",
                headerSubtitle: "text-gray-600",
                formButtonPrimary: "bg-gradient-to-r from-quiz-primary to-quiz-secondary hover:opacity-90 shadow-lg shadow-quiz-primary/25 rounded-xl",
                formFieldInput: "rounded-xl border-gray-200 focus:border-quiz-primary focus:ring-quiz-primary/20",
                footerActionLink: "text-quiz-primary hover:text-quiz-secondary",
                identityPreviewEditButton: "text-quiz-primary hover:text-quiz-secondary",
                formFieldLabel: "text-gray-700",
                dividerLine: "bg-gray-200",
                dividerText: "text-gray-500",
                socialButtonsBlockButton: "border-gray-200 hover:border-quiz-primary/30 rounded-xl",
                socialButtonsBlockButtonText: "text-gray-700",
              },
              layout: {
                socialButtonsPlacement: "bottom",
              },
            }}
            signInUrl="/sign-in"
          />
        </motion.div>
      </div>

      {/* Right side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-center px-12 xl:px-20 order-1 lg:order-2">
        {/* Back to home */}
        <Link href="/" className="absolute top-8 right-8">
          <motion.div
            whileHover={{ x: -4 }}
            className="flex items-center gap-2 text-gray-600 hover:text-quiz-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to home</span>
          </motion.div>
        </Link>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.5 }}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-quiz-primary to-quiz-secondary flex items-center justify-center shadow-lg shadow-quiz-primary/25"
            >
              <Sparkles className="w-7 h-7 text-white" />
            </motion.div>
            <span className="text-3xl font-display font-bold">
              <span className="text-quiz-primary">Vidha</span>
              <span className="text-quiz-secondary">Rith</span>
            </span>
          </Link>
        </motion.div>

        {/* Welcome text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-4xl xl:text-5xl font-display font-bold text-gray-900 mb-4">
            Start understanding
            <br />
            <span className="bg-gradient-to-r from-quiz-primary to-quiz-secondary bg-clip-text text-transparent">
              your students
            </span>
          </h1>
          <p className="text-lg text-gray-600 mb-10 max-w-md">
            Create your account and start creating AI-powered quizzes with anonymous responses in minutes.
          </p>
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-10"
        >
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            How it works
          </p>
          <div className="space-y-4">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-4"
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-quiz-primary/10 to-quiz-secondary/10 flex items-center justify-center">
                    <step.icon className="w-5 h-5 text-quiz-primary" />
                  </div>
                  {i < steps.length - 1 && (
                    <div className="absolute top-10 left-1/2 w-0.5 h-4 bg-gradient-to-b from-quiz-primary/20 to-transparent -translate-x-1/2" />
                  )}
                </div>
                <span className="text-gray-700 font-medium">{step.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap gap-3"
        >
          {["No credit card required", "Unlimited quizzes", "AI-powered analytics"].map((benefit, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gray-100"
            >
              <CheckCircle className="w-4 h-4 text-quiz-mint" />
              <span className="text-sm text-gray-600">{benefit}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
