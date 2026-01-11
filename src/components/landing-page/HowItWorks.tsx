"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";
import { Upload, Wand2, Share2, TrendingUp, ArrowRight } from "lucide-react";

interface StepProps {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  delay: number;
}

const Step = ({ number, icon, title, description, color, delay }: StepProps) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    className="relative group"
  >
    {/* Step number - floating */}
    <motion.div
      initial={{ scale: 0 }}
      whileInView={{ scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: delay + 0.2, type: "spring", stiffness: 200 }}
      className={`absolute -top-4 -left-4 w-10 h-10 rounded-full ${color} flex items-center justify-center text-white font-bold text-lg shadow-lg z-10`}
    >
      {number}
    </motion.div>

    {/* Card */}
    <motion.div
      whileHover={{ y: -8, boxShadow: "0 25px 50px rgba(110, 89, 165, 0.15)" }}
      className="bg-white rounded-3xl p-8 pt-10 shadow-lg border border-gray-100 h-full transition-all duration-300"
    >
      {/* Icon */}
      <motion.div
        whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
        transition={{ duration: 0.4 }}
        className={`w-16 h-16 rounded-2xl ${color} flex items-center justify-center mb-6 shadow-lg`}
      >
        {icon}
      </motion.div>

      <h3 className="text-xl font-bold text-gray-900 mb-3">
        {title}
      </h3>
      <p className="text-gray-600 leading-relaxed">
        {description}
      </p>
    </motion.div>
  </motion.div>
);

const HowItWorks = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const imageY = useTransform(scrollYProgress, [0, 1], [100, -100]);

  const steps = [
    {
      icon: <Upload className="w-8 h-8 text-white" />,
      title: "Upload Materials",
      description: "Drop your lecture notes, slides, or any PDF. Our secure platform handles files of any size.",
      color: "bg-gradient-to-br from-quiz-primary to-quiz-secondary",
    },
    {
      icon: <Wand2 className="w-8 h-8 text-white" />,
      title: "AI Generates Quiz",
      description: "Watch as AI analyzes your content and creates relevant, challenging questions automatically.",
      color: "bg-gradient-to-br from-quiz-coral to-orange-400",
    },
    {
      icon: <Share2 className="w-8 h-8 text-white" />,
      title: "Share & Collect",
      description: "Send the quiz link to your students. They respond anonymously - no sign-up required.",
      color: "bg-gradient-to-br from-quiz-mint to-emerald-400",
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-white" />,
      title: "Get Insights",
      description: "View comprehensive analytics showing exactly where your class needs more focus.",
      color: "bg-gradient-to-br from-quiz-sky to-blue-500",
    },
  ];

  return (
    <section id="how-it-works" ref={containerRef} className="py-24 md:py-32 bg-gradient-to-b from-quiz-light/30 via-white to-white relative overflow-hidden">
      {/* Animated background elements */}
      <motion.div
        animate={{
          rotate: [0, 360],
        }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/4 -right-32 w-64 h-64 border border-quiz-primary/10 rounded-full"
      />
      <motion.div
        animate={{
          rotate: [360, 0],
        }}
        transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-1/4 -left-32 w-48 h-48 border border-quiz-secondary/10 rounded-full"
      />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-white border border-quiz-primary/20 shadow-lg rounded-full px-5 py-2 mb-6"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <Wand2 className="w-4 h-4 text-quiz-primary" />
            </motion.div>
            <span className="text-sm font-semibold text-gray-700">
              Simple 4-Step Process
            </span>
          </motion.div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-6">
            <span className="text-gray-900">From Upload to</span>
            <br />
            <span className="bg-gradient-to-r from-quiz-primary via-quiz-secondary to-quiz-coral bg-clip-text text-transparent">
              Actionable Insights
            </span>
          </h2>

          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Set up your first quiz in under 5 minutes. No complex configurations, no learning curve—just results.
          </p>
        </motion.div>

        {/* Main content grid */}
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Steps */}
          <div className="grid sm:grid-cols-2 gap-6">
            {steps.map((step, index) => (
              <Step
                key={index}
                number={index + 1}
                icon={step.icon}
                title={step.title}
                description={step.description}
                color={step.color}
                delay={index * 0.15}
              />
            ))}
          </div>

          {/* Image section */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative hidden lg:block"
          >
            <motion.div style={{ y: imageY }} className="relative">
              {/* Main image */}
              <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl shadow-quiz-primary/20 border border-white/50">
                <div className="absolute inset-0 bg-gradient-to-tr from-quiz-primary/10 to-transparent z-10 pointer-events-none" />
                <Image
                  src="/2.png"
                  alt="VidhaRith Analytics Dashboard"
                  width={800}
                  height={600}
                  className="w-full h-auto"
                />
              </div>

              {/* Floating stats card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                animate={{ y: [0, -8, 0] }}
                className="absolute -bottom-8 -left-8 bg-white rounded-2xl shadow-xl p-5 border border-gray-100"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-quiz-mint to-emerald-400 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">85%</p>
                    <p className="text-sm text-gray-500">Average Score</p>
                  </div>
                </div>
              </motion.div>

              {/* Setup time badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.7 }}
                className="absolute -top-4 -right-4 bg-gradient-to-r from-quiz-primary to-quiz-secondary text-white rounded-full px-4 py-2 shadow-lg"
              >
                <p className="text-sm font-semibold">Setup in &lt;5 min</p>
              </motion.div>
            </motion.div>

            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-quiz-primary/20 to-quiz-secondary/20 rounded-3xl blur-3xl -z-10 scale-110" />
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-20 text-center"
        >
          <motion.a
            href="/sign-up"
            whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(110, 89, 165, 0.3)" }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-quiz-primary to-quiz-secondary text-white font-semibold rounded-2xl shadow-xl shadow-quiz-primary/25 transition-all"
          >
            Start Creating Quizzes
            <ArrowRight className="w-5 h-5" />
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
