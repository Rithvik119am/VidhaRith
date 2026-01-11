"use client";

import { motion } from "framer-motion";
import { ArrowRight, Play, CheckCircle, Users, FileText, BarChart3, AlertTriangle, Eye, Target, TrendingUp } from "lucide-react";
import { Authenticated, Unauthenticated } from "convex/react";
import Link from "next/link";
import Image from "next/image";

const Hero = () => {
  const stats = [
    { icon: Eye, label: "Anonymous Responses", value: "Honest Feedback", desc: "Students share what they truly don't understand" },
    { icon: Target, label: "Knowledge Gaps", value: "Instantly Identified", desc: "See exactly which topics need attention" },
    { icon: TrendingUp, label: "Better Outcomes", value: "Data-Driven Teaching", desc: "Make informed decisions about your lessons" },
  ];

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-white via-quiz-light/30 to-quiz-accent/20">
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-quiz-primary/20 to-quiz-secondary/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, 80, 0],
            scale: [1.2, 1, 1.2],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-20 -right-20 w-[500px] h-[500px] bg-gradient-to-br from-quiz-secondary/20 to-quiz-accent/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, 100, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/3 w-72 h-72 bg-quiz-coral/10 rounded-full blur-3xl"
        />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236E59A5' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="container mx-auto px-4 pt-32 pb-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center lg:text-left"
          >
            {/* Problem Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-quiz-coral/10 backdrop-blur-sm border border-quiz-coral/20 rounded-full px-4 py-2 mb-8 shadow-lg shadow-quiz-coral/5"
            >
              <AlertTriangle className="w-4 h-4 text-quiz-coral" />
              <span className="text-sm font-medium text-gray-700">
                Students hide what they don&apos;t understand
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-display font-bold leading-[1.1] mb-6"
            >
              <span className="text-gray-900">Stop Guessing</span>
              <br />
              <span className="text-gray-900">What Students </span>
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-quiz-primary via-quiz-secondary to-quiz-coral bg-clip-text text-transparent">
                  Don&apos;t Know
                </span>
                <motion.svg
                  viewBox="0 0 200 20"
                  className="absolute -bottom-2 left-0 w-full h-3"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                >
                  <motion.path
                    d="M0,10 Q50,0 100,10 T200,10"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#6E59A5" />
                      <stop offset="50%" stopColor="#9b87f5" />
                      <stop offset="100%" stopColor="#FF6B6B" />
                    </linearGradient>
                  </defs>
                </motion.svg>
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg sm:text-xl text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              When students are afraid to admit confusion, you lose the chance to help them.{" "}
              <span className="text-quiz-primary font-semibold">VidhaRith</span> creates AI-powered quizzes with{" "}
              <span className="text-quiz-primary font-semibold">anonymous responses</span>—so students are honest,
              and you finally see where they struggle.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12"
            >
              <Unauthenticated>
                <Link href="/sign-up">
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(110, 89, 165, 0.3)" }}
                    whileTap={{ scale: 0.98 }}
                    className="group flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-quiz-primary to-quiz-secondary text-white font-semibold rounded-2xl shadow-xl shadow-quiz-primary/25 transition-all"
                  >
                    Start Understanding Your Students
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </Link>
              </Unauthenticated>
              <Authenticated>
                <Link href="/dashboard/forms">
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(110, 89, 165, 0.3)" }}
                    whileTap={{ scale: 0.98 }}
                    className="group flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-quiz-primary to-quiz-secondary text-white font-semibold rounded-2xl shadow-xl shadow-quiz-primary/25 transition-all"
                  >
                    Go to Dashboard
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </Link>
              </Authenticated>

              <motion.a
                href="#how-it-works"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group flex items-center justify-center gap-2 px-8 py-4 bg-white/80 backdrop-blur-sm text-gray-700 font-semibold rounded-2xl border border-gray-200 hover:border-quiz-primary/30 transition-all"
              >
                <Play className="w-5 h-5 text-quiz-primary" />
                See How It Works
              </motion.a>
            </motion.div>

            {/* Value Props */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex flex-wrap items-center gap-6 justify-center lg:justify-start"
            >
              {[
                "AI generates questions in seconds",
                "Anonymous = honest responses",
                "Identify gaps before exams",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-quiz-mint" />
                  {item}
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right content - Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            {/* Main dashboard image */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-quiz-primary/20 border border-white/50">
                <div className="absolute inset-0 bg-gradient-to-tr from-quiz-primary/5 to-transparent z-10 pointer-events-none" />
                <Image
                  src="/1.png"
                  alt="VidhaRith Dashboard Preview"
                  width={800}
                  height={600}
                  className="w-full h-auto"
                  priority
                />
              </div>
            </motion.div>

            {/* Floating cards */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="absolute -left-8 top-1/4 z-20"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="bg-white rounded-2xl shadow-xl p-4 border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-quiz-mint/20 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-quiz-mint" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Quiz Created</p>
                    <p className="text-xs text-gray-500">10 AI questions</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ delay: 1 }}
              className="absolute -right-4 bottom-1/4 z-20"
            >
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="bg-white rounded-2xl shadow-xl p-4 border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-quiz-coral/20 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-quiz-coral" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Gap Found</p>
                    <p className="text-xs text-gray-500">Chapter 3 needs review</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-quiz-primary/20 to-quiz-secondary/20 rounded-3xl blur-3xl -z-10 scale-110" />
          </motion.div>
        </div>

        {/* Bottom value props */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(110, 89, 165, 0.1)" }}
              className="flex items-start gap-4 p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg transition-all"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-quiz-primary/10 to-quiz-secondary/10 flex items-center justify-center flex-shrink-0">
                <stat.icon className="w-7 h-7 text-quiz-primary" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                <p className="text-xs text-gray-400">{stat.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
