"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FileIcon, FormInputIcon, Menu, X, Sparkles, Home, ChevronRight } from "lucide-react";
import { UserButton } from "@clerk/clerk-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const navItems = [
    {
      label: "Forms",
      href: "/dashboard/forms",
      icon: FormInputIcon,
      description: "Manage your quizzes",
    },
    {
      label: "Files",
      href: "/dashboard/files",
      icon: FileIcon,
      description: "Upload materials",
    },
  ];

  const currentPage = navItems.find(item => pathname === item.href || pathname.startsWith(item.href.replace('/dashboard', '/dashboard/edit')));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-quiz-light/20">
      {/* Top Navigation Bar */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100"
      >
        <div className="flex items-center justify-between h-16 px-4 lg:px-6">
          {/* Left side - Logo & Breadcrumb */}
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <Menu className="h-5 w-5 text-gray-600" />
            </motion.button>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.5 }}
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-quiz-primary to-quiz-secondary flex items-center justify-center shadow-lg shadow-quiz-primary/20"
              >
                <Sparkles className="w-4 h-4 text-white" />
              </motion.div>
              <span className="hidden sm:block text-lg font-display font-bold">
                <span className="text-quiz-primary">Vidha</span>
                <span className="text-quiz-secondary">Rith</span>
              </span>
            </Link>

            {/* Breadcrumb */}
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
              <ChevronRight className="w-4 h-4" />
              <Link href="/dashboard/forms" className="hover:text-quiz-primary transition-colors">
                Dashboard
              </Link>
              {currentPage && (
                <>
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-gray-900 font-medium">{currentPage.label}</span>
                </>
              )}
            </div>
          </div>

          {/* Right side - User */}
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9 rounded-xl",
                  },
                }}
              />
            </motion.div>
          </div>
        </div>
      </motion.header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <motion.aside
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="hidden lg:flex flex-col w-64 min-h-[calc(100vh-4rem)] bg-white/50 backdrop-blur-sm border-r border-gray-100 p-4"
        >
          <nav className="space-y-2">
            <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Navigation
            </p>
            {navItems.map((item, index) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href.replace('/dashboard', '/dashboard/edit'));

              return (
                <motion.div
                  key={item.href}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <Link href={item.href}>
                    <motion.div
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-quiz-primary to-quiz-secondary text-white shadow-lg shadow-quiz-primary/20"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <item.icon className={`h-5 w-5 ${isActive ? "text-white" : "text-gray-400"}`} />
                      <div className="flex-1">
                        <span className="font-medium">{item.label}</span>
                        <p className={`text-xs ${isActive ? "text-white/70" : "text-gray-400"}`}>
                          {item.description}
                        </p>
                      </div>
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white"
                        />
                      )}
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          {/* Bottom section */}
          <div className="mt-auto pt-4 border-t border-gray-100">
            <Link href="/">
              <motion.div
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-600 hover:bg-gray-100 transition-all"
              >
                <Home className="h-5 w-5 text-gray-400" />
                <span className="font-medium">Back to Home</span>
              </motion.div>
            </Link>
          </div>
        </motion.aside>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
              />
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed top-0 left-0 bottom-0 w-72 bg-white shadow-2xl z-50 lg:hidden"
              >
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <Link href="/" className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-quiz-primary to-quiz-secondary flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-lg font-display font-bold">
                      <span className="text-quiz-primary">Vidha</span>
                      <span className="text-quiz-secondary">Rith</span>
                    </span>
                  </Link>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-600" />
                  </motion.button>
                </div>

                <nav className="p-4 space-y-2">
                  <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Navigation
                  </p>
                  {navItems.map((item, index) => {
                    const isActive = pathname === item.href;

                    return (
                      <motion.div
                        key={item.href}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Link href={item.href} onClick={() => setIsSidebarOpen(false)}>
                          <div
                            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                              isActive
                                ? "bg-gradient-to-r from-quiz-primary to-quiz-secondary text-white"
                                : "text-gray-600 hover:bg-gray-100"
                            }`}
                          >
                            <item.icon className={`h-5 w-5 ${isActive ? "text-white" : "text-gray-400"}`} />
                            <div>
                              <span className="font-medium">{item.label}</span>
                              <p className={`text-xs ${isActive ? "text-white/70" : "text-gray-400"}`}>
                                {item.description}
                              </p>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
                  <Link href="/" onClick={() => setIsSidebarOpen(false)}>
                    <div className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-600 hover:bg-gray-100 transition-all">
                      <Home className="h-5 w-5 text-gray-400" />
                      <span className="font-medium">Back to Home</span>
                    </div>
                  </Link>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-4rem)]">
          {isMounted && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="p-4 lg:p-8"
            >
              {children}
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
