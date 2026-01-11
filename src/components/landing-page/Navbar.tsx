"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sparkles } from "lucide-react";
import { Authenticated, Unauthenticated } from "convex/react";
import Link from "next/link";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#how-it-works", label: "How it Works" },
  ];

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? "py-3"
            : "py-5"
        }`}
      >
        <div className="container mx-auto px-4">
          <motion.nav
            className={`relative flex items-center justify-between px-6 py-3 rounded-2xl transition-all duration-500 ${
              isScrolled
                ? "bg-white/80 backdrop-blur-xl shadow-lg shadow-quiz-primary/5 border border-white/50"
                : "bg-transparent"
            }`}
          >
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.5 }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-quiz-primary to-quiz-secondary flex items-center justify-center"
              >
                <Sparkles className="w-5 h-5 text-white" />
              </motion.div>
              <span className="text-xl font-display font-bold">
                <span className="text-quiz-primary">Vidha</span>
                <span className="text-quiz-secondary">Rith</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  className="relative text-gray-600 hover:text-quiz-primary font-medium transition-colors"
                  whileHover="hover"
                >
                  {link.label}
                  <motion.div
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-quiz-primary to-quiz-secondary rounded-full"
                    initial={{ scaleX: 0 }}
                    variants={{ hover: { scaleX: 1 } }}
                    transition={{ duration: 0.2 }}
                  />
                </motion.a>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Unauthenticated>
                <Link href="/sign-in">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-5 py-2.5 text-gray-600 font-medium hover:text-quiz-primary transition-colors"
                  >
                    Sign In
                  </motion.button>
                </Link>
                <Link href="/sign-up">
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 10px 40px rgba(110, 89, 165, 0.3)" }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-2.5 bg-gradient-to-r from-quiz-primary to-quiz-secondary text-white font-semibold rounded-xl shadow-lg shadow-quiz-primary/25 transition-shadow"
                  >
                    Get Started
                  </motion.button>
                </Link>
              </Unauthenticated>
              <Authenticated>
                <Link href="/dashboard/forms">
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 10px 40px rgba(110, 89, 165, 0.3)" }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-2.5 bg-gradient-to-r from-quiz-primary to-quiz-secondary text-white font-semibold rounded-xl shadow-lg shadow-quiz-primary/25 transition-shadow"
                  >
                    Dashboard
                  </motion.button>
                </Link>
              </Authenticated>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <AnimatePresence mode="wait">
                {mobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                  >
                    <X className="w-6 h-6 text-gray-700" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                  >
                    <Menu className="w-6 h-6 text-gray-700" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </motion.nav>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-24 left-4 right-4 bg-white rounded-2xl shadow-2xl z-50 md:hidden overflow-hidden"
            >
              <div className="p-6 space-y-4">
                {navLinks.map((link, i) => (
                  <motion.a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="block py-3 px-4 text-gray-700 font-medium rounded-xl hover:bg-quiz-light transition-colors"
                  >
                    {link.label}
                  </motion.a>
                ))}

                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <Unauthenticated>
                    <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)}>
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="w-full py-3 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        Sign In
                      </motion.button>
                    </Link>
                    <Link href="/sign-up" onClick={() => setMobileMenuOpen(false)}>
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="w-full py-3 bg-gradient-to-r from-quiz-primary to-quiz-secondary text-white font-semibold rounded-xl"
                      >
                        Get Started
                      </motion.button>
                    </Link>
                  </Unauthenticated>
                  <Authenticated>
                    <Link href="/dashboard/forms" onClick={() => setMobileMenuOpen(false)}>
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="w-full py-3 bg-gradient-to-r from-quiz-primary to-quiz-secondary text-white font-semibold rounded-xl"
                      >
                        Go to Dashboard
                      </motion.button>
                    </Link>
                  </Authenticated>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
