"use client";

import { SignIn } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Sparkles, ArrowLeft, Users, FileQuestion, BarChart3, Shield } from "lucide-react";
import Link from "next/link";

export default function SignInPage() {
  const stats = [
    { value: "100%", label: "Anonymous", icon: Shield },
    { value: "AI", label: "Powered", icon: Sparkles },
    { value: "Real-time", label: "Analytics", icon: BarChart3 },
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
          className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-quiz-primary/20 to-quiz-secondary/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -40, 0],
            y: [0, 40, 0],
            scale: [1.1, 1, 1.1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-20 -right-20 w-[400px] h-[400px] bg-gradient-to-br from-quiz-secondary/20 to-quiz-accent/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -30, 0],
            y: [0, 20, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 right-1/3 w-64 h-64 bg-quiz-coral/10 rounded-full blur-3xl"
        />
      </div>

      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-center px-12 xl:px-20">
        {/* Back to home */}
        <Link href="/" className="absolute top-8 left-8">
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
            Welcome back,
            <br />
            <span className="bg-gradient-to-r from-quiz-primary to-quiz-secondary bg-clip-text text-transparent">
              educator!
            </span>
          </h1>
          <p className="text-lg text-gray-600 mb-10 max-w-md">
            Your quizzes and student insights are waiting. Sign in to continue understanding what your students truly know.
          </p>
        </motion.div>

        {/* Stats cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-4 mb-10"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(110, 89, 165, 0.15)" }}
              className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-lg text-center transition-all"
            >
              <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br from-quiz-primary/10 to-quiz-secondary/10 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-quiz-primary" />
              </div>
              <p className="text-xl font-bold bg-gradient-to-r from-quiz-primary to-quiz-secondary bg-clip-text text-transparent">
                {stat.value}
              </p>
              <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Feature highlight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-quiz-primary/5 to-quiz-secondary/5 rounded-2xl p-5 border border-quiz-primary/10"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-quiz-primary to-quiz-secondary flex items-center justify-center flex-shrink-0 shadow-lg shadow-quiz-primary/25">
              <FileQuestion className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-1">Your dashboard awaits</p>
              <p className="text-sm text-gray-600">
                View responses, analyze results, and generate new AI-powered quizzes for your students.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right side - Sign In Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
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
          <SignIn
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
            signUpUrl="/sign-up"
          />
        </motion.div>
      </div>
    </div>
  );
}
