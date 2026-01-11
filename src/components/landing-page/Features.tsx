"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { FileText, Brain, Shield, BarChart3, Zap, Clock, Sparkles, AlertTriangle, CheckCircle, Users } from "lucide-react";
import { useRef } from "react";

interface BentoCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  benefit: string;
  className?: string;
  gradient?: string;
  delay?: number;
}

const BentoCard = ({ icon, title, description, benefit, className = "", gradient = "from-quiz-primary/10 to-quiz-secondary/10", delay = 0 }: BentoCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), { stiffness: 300, damping: 30 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`group relative bg-white rounded-3xl p-8 shadow-lg border border-gray-100 overflow-hidden cursor-pointer ${className}`}
    >
      {/* Animated gradient background */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
      />

      {/* Shine effect on hover */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.8) 45%, transparent 50%)",
          transform: "translateX(-100%)",
        }}
        whileHover={{
          transform: "translateX(100%)",
          transition: { duration: 0.6 },
        }}
      />

      <div className="relative z-10">
        {/* Icon */}
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 400 }}
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-quiz-primary to-quiz-secondary flex items-center justify-center mb-6 shadow-lg shadow-quiz-primary/20"
        >
          {icon}
        </motion.div>

        {/* Content */}
        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-quiz-primary transition-colors">
          {title}
        </h3>
        <p className="text-gray-600 leading-relaxed mb-4">
          {description}
        </p>

        {/* Benefit highlight */}
        <div className="flex items-center gap-2 text-sm text-quiz-primary font-medium">
          <CheckCircle className="w-4 h-4" />
          <span>{benefit}</span>
        </div>
      </div>
    </motion.div>
  );
};

const Features = () => {
  const features = [
    {
      icon: <Brain className="w-7 h-7 text-white" />,
      title: "AI-Powered Question Generation",
      description: "Upload your lecture notes, slides, or any PDF. Our AI understands the content and creates thoughtful questions that test real comprehension—not just memorization.",
      benefit: "Save hours of quiz creation time",
      gradient: "from-quiz-primary/10 to-purple-100",
    },
    {
      icon: <Shield className="w-7 h-7 text-white" />,
      title: "True Anonymous Responses",
      description: "When students fear judgment, they hide confusion. Anonymous responses remove that fear, giving you honest insights into what students actually understand.",
      benefit: "Get honest feedback, not filtered answers",
      gradient: "from-quiz-mint/20 to-emerald-100",
    },
    {
      icon: <BarChart3 className="w-7 h-7 text-white" />,
      title: "Actionable Analytics",
      description: "Don't just see scores—understand patterns. Visual breakdowns show exactly which topics confuse students, so you know where to focus your teaching.",
      benefit: "Identify knowledge gaps at a glance",
      gradient: "from-quiz-coral/20 to-orange-100",
    },
    {
      icon: <Zap className="w-7 h-7 text-white" />,
      title: "Instant Results & Grading",
      description: "Responses flow in real-time. See how your class performs as they take the quiz. No waiting, no manual grading—just immediate insights.",
      benefit: "Know results before class ends",
      gradient: "from-quiz-sunny/30 to-yellow-100",
    },
    {
      icon: <Clock className="w-7 h-7 text-white" />,
      title: "Flexible Time Controls",
      description: "Set precise start times, end times, and duration limits. Control exactly when students can access quizzes—perfect for scheduled assessments or homework.",
      benefit: "Full control over quiz availability",
      gradient: "from-quiz-sky/30 to-blue-100",
    },
    {
      icon: <Users className="w-7 h-7 text-white" />,
      title: "No Student Sign-up Required",
      description: "Share a simple link. Students click and answer—no accounts, no downloads, no friction. Works on any device with a browser.",
      benefit: "Zero barriers for students to participate",
      gradient: "from-quiz-secondary/20 to-indigo-100",
    },
  ];

  return (
    <section id="features" className="py-24 md:py-32 bg-gradient-to-b from-white via-quiz-light/20 to-white relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-quiz-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-quiz-secondary/5 rounded-full blur-3xl" />

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
            className="inline-flex items-center gap-2 bg-gradient-to-r from-quiz-primary/10 to-quiz-secondary/10 backdrop-blur-sm rounded-full px-5 py-2 mb-6"
          >
            <Sparkles className="w-4 h-4 text-quiz-primary" />
            <span className="text-sm font-semibold text-quiz-primary">
              Why Educators Choose VidhaRith
            </span>
          </motion.div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-6">
            <span className="text-gray-900">The Tools You Need to</span>
            <br />
            <span className="bg-gradient-to-r from-quiz-primary via-quiz-secondary to-quiz-coral bg-clip-text text-transparent">
              Teach More Effectively
            </span>
          </h2>

          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Built by educators who understand your challenges. Every feature solves a real problem you face in understanding what your students know.
          </p>
        </motion.div>

        {/* Problem → Solution Intro */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto mb-16"
        >
          <div className="bg-gradient-to-r from-quiz-coral/10 to-orange-50 rounded-2xl p-6 border border-quiz-coral/20">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-quiz-coral/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-quiz-coral" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">The Hidden Problem in Every Classroom</h3>
                <p className="text-gray-600">
                  Students who don&apos;t understand often stay silent. They&apos;re afraid to look stupid in front of peers.
                  By the time you discover the gaps—at the exam—it&apos;s too late to help. VidhaRith solves this by making it safe for students to show what they don&apos;t know.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <BentoCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              benefit={feature.benefit}
              gradient={feature.gradient}
              delay={index * 0.1}
              className={index === 0 ? "md:col-span-2 lg:col-span-1" : ""}
            />
          ))}
        </div>

        {/* Bottom highlight */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-quiz-mint/20 to-quiz-sky/20 rounded-2xl px-6 py-4">
            <div className="flex -space-x-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-quiz-primary to-quiz-secondary border-2 border-white flex items-center justify-center text-xs font-bold text-white"
                  style={{ zIndex: 4 - i }}
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <p className="text-gray-700">
              <span className="font-semibold">Educators worldwide</span> are discovering what their students truly know
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
