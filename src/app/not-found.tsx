"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Sparkles, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-quiz-light/30 to-quiz-accent/20 relative overflow-hidden">
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -top-20 -left-20 w-72 h-72 bg-gradient-to-br from-quiz-primary/10 to-quiz-secondary/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-20 -right-20 w-96 h-96 bg-gradient-to-br from-quiz-coral/10 to-quiz-secondary/10 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 text-center px-4">
        {/* Animated 404 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="inline-block"
          >
            <div className="relative">
              <h1 className="text-[150px] md:text-[200px] font-display font-bold leading-none bg-gradient-to-r from-quiz-primary via-quiz-secondary to-quiz-coral bg-clip-text text-transparent">
                404
              </h1>
              {/* Floating sparkles */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute -top-4 -right-4"
              >
                <Sparkles className="w-8 h-8 text-quiz-sunny" />
              </motion.div>
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                className="absolute -bottom-2 -left-2"
              >
                <Sparkles className="w-6 h-6 text-quiz-mint" />
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-8"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Oops! Page not found
          </h2>
          <p className="text-gray-600 text-lg max-w-md mx-auto">
            The page you&apos;re looking for seems to have wandered off. Let&apos;s get you back on track!
          </p>
        </motion.div>

        {/* Illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mb-10"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white shadow-xl shadow-quiz-primary/10 border border-gray-100">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Search className="w-12 h-12 text-quiz-primary" />
            </motion.div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(110, 89, 165, 0.2)" }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-quiz-primary to-quiz-secondary text-white font-semibold rounded-2xl shadow-xl shadow-quiz-primary/20 transition-all"
            >
              <Home className="w-5 h-5" />
              Go to Homepage
            </motion.button>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-700 font-semibold rounded-2xl border border-gray-200 hover:bg-gray-50 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </motion.div>

        {/* Fun message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-sm text-gray-400"
        >
          Lost? Don&apos;t worry, even the best quizzes have unexpected answers!
        </motion.p>
      </div>
    </div>
  );
}
