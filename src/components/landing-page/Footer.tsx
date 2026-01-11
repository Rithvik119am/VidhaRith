"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Twitter, Linkedin, Github, Heart, Sparkles, ArrowRight, Mail, Target, TrendingUp, Shield } from "lucide-react";

const Footer = () => {
  const footerLinks = {
    product: [
      { label: "Features", href: "#features" },
      { label: "How It Works", href: "#how-it-works" },
    ],
    resources: [
      { label: "Documentation", href: "#" },
      { label: "Help Center", href: "#" },
    ],
    company: [
      { label: "About", href: "https://github.com/Rithvik119am/VidhaRith" },
      { label: "Contact", href: "https://github.com/Rithvik119am/VidhaRith" },
      { label: "Privacy", href: "https://github.com/Rithvik119am/VidhaRith" },
    ],
  };

  const socialLinks = [
    { icon: Twitter, href: "https://x.com/DSToday1", label: "Twitter" },
    { icon: Linkedin, href: "https://www.linkedin.com/in/sai-rithvik-reddy-kanyagari-62252b23b/", label: "LinkedIn" },
    { icon: Github, href: "https://github.com/Rithvik119am/VidhaRith", label: "GitHub" },
  ];

  const benefits = [
    { icon: Target, text: "Identify knowledge gaps instantly" },
    { icon: Shield, text: "Anonymous responses = honest answers" },
    { icon: TrendingUp, text: "Improve learning outcomes" },
  ];

  return (
    <footer className="relative overflow-hidden">
      {/* CTA Section */}
      <div className="relative bg-gradient-to-br from-quiz-primary via-quiz-secondary to-quiz-coral">
        {/* Animated background shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              x: [0, 50, 0],
              y: [0, -30, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, -40, 0],
              y: [0, 40, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-0 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl"
          />
        </div>

        <div className="container mx-auto px-4 py-20 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-6"
            >
              Stop Flying Blind
              <br />
              In Your Classroom
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-white/90 text-lg md:text-xl mb-8 max-w-xl mx-auto"
            >
              Every lesson, students hide what they don&apos;t understand. VidhaRith gives you the visibility you need to help them succeed.
            </motion.p>

            {/* Benefits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.35 }}
              className="flex flex-wrap justify-center gap-6 mb-10"
            >
              {benefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-2 text-white/90 text-sm">
                  <benefit.icon className="w-4 h-4" />
                  <span>{benefit.text}</span>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link href="/sign-up">
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)" }}
                  whileTap={{ scale: 0.98 }}
                  className="group flex items-center justify-center gap-2 px-8 py-4 bg-white text-quiz-primary font-semibold rounded-2xl shadow-xl transition-all"
                >
                  Start Understanding Your Students
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
              <motion.a
                href="mailto:contact@vidharith.com"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-2xl border border-white/20 hover:bg-white/20 transition-all"
              >
                <Mail className="w-5 h-5" />
                Contact Us
              </motion.a>
            </motion.div>
          </motion.div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#1A1F2C"/>
          </svg>
        </div>
      </div>

      {/* Main Footer */}
      <div className="bg-quiz-dark text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
            {/* Brand section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-2"
            >
              <Link href="/" className="flex items-center gap-2 mb-6">
                <motion.div
                  whileHover={{ rotate: 180 }}
                  transition={{ duration: 0.5 }}
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-quiz-primary to-quiz-secondary flex items-center justify-center"
                >
                  <Sparkles className="w-5 h-5 text-white" />
                </motion.div>
                <span className="text-xl font-display font-bold">
                  <span className="text-white">Vidha</span>
                  <span className="text-quiz-secondary">Rith</span>
                </span>
              </Link>

              <p className="text-white/60 leading-relaxed mb-6 max-w-sm">
                The AI-powered quiz platform that reveals what students truly understand through anonymous responses. Built for educators who want to teach smarter, not harder.
              </p>

              {/* Social links */}
              <div className="flex gap-3">
                {socialLinks.map((social) => (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-quiz-primary/20 hover:border-quiz-primary/30 transition-all"
                    aria-label={social.label}
                  >
                    <social.icon size={18} className="text-white/70" />
                  </motion.a>
                ))}
              </div>
            </motion.div>

            {/* Product links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <h4 className="font-semibold text-white mb-5">Product</h4>
              <ul className="space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link.label}>
                    <motion.a
                      href={link.href}
                      whileHover={{ x: 4 }}
                      className="text-white/60 hover:text-quiz-secondary transition-colors inline-flex items-center gap-1"
                    >
                      {link.label}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Resources links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <h4 className="font-semibold text-white mb-5">Resources</h4>
              <ul className="space-y-3">
                {footerLinks.resources.map((link) => (
                  <li key={link.label}>
                    <motion.a
                      href={link.href}
                      whileHover={{ x: 4 }}
                      className="text-white/60 hover:text-quiz-secondary transition-colors inline-flex items-center gap-1"
                    >
                      {link.label}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Company links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <h4 className="font-semibold text-white mb-5">Company</h4>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.label}>
                    <motion.a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ x: 4 }}
                      className="text-white/60 hover:text-quiz-secondary transition-colors inline-flex items-center gap-1"
                    >
                      {link.label}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Bottom bar */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="border-t border-white/10 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4"
          >
            <div className="text-white/50 text-sm flex items-center gap-1 flex-wrap justify-center">
              <span>&copy; {new Date().getFullYear()} VidhaRith.</span>
              <span className="flex items-center">
                Made with
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Heart size={14} className="text-quiz-coral fill-quiz-coral mx-1" />
                </motion.span>
                by K. Sai Rithvik Reddy
              </span>
            </div>
            <div className="flex gap-6 text-sm">
              <a href="#" className="text-white/50 hover:text-white transition-colors">
                Terms
              </a>
              <a href="#" className="text-white/50 hover:text-white transition-colors">
                Privacy
              </a>
              <a href="#" className="text-white/50 hover:text-white transition-colors">
                Cookies
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
