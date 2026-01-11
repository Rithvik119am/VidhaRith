"use client";

import { useState, useEffect } from "react";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, MessageSquare, BarChart3, FileText, HelpCircle } from "lucide-react";

import FormDetails from "./FormDetails";
import FormQuestions from "./FormQuestions";
import FormResponses from "./FormResponses";
import FormAnalysis from "./FormAnalysis";

type TabValue = "details" | "questions" | "responses" | "analysis";

interface TabItem {
  value: TabValue;
  label: string;
  icon: React.ReactNode;
  description: string;
  badge?: number;
}

export default function Page({ params }: { params: { id: Id<"forms"> } }) {
  const formId = params.id;
  const [activeTab, setActiveTab] = useState<TabValue>("details");

  const form = useQuery(api.forms.get, { formId });
  const questions = useQuery(api.form_questions.getFormQuestions, { formId });
  const responses = useQuery(api.form_responses.getFormResponses, { formId });

  const questionCount = questions?.length ?? 0;
  const responseCount = responses?.length ?? 0;

  // Default to questions tab for new forms with no questions
  useEffect(() => {
    if (questions !== undefined && questions.length === 0) {
      setActiveTab("questions");
    }
  }, [questions]);

  const tabs: TabItem[] = [
    {
      value: "details",
      label: "Details",
      icon: <Settings className="w-4 h-4" />,
      description: "Name, timing & sharing",
    },
    {
      value: "questions",
      label: "Questions",
      icon: <HelpCircle className="w-4 h-4" />,
      description: "Manage quiz questions",
      badge: questionCount,
    },
    {
      value: "responses",
      label: "Responses",
      icon: <MessageSquare className="w-4 h-4" />,
      description: "View submissions",
      badge: responseCount,
    },
    {
      value: "analysis",
      label: "Analysis",
      icon: <BarChart3 className="w-4 h-4" />,
      description: "View insights",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <Unauthenticated>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-quiz-primary to-quiz-secondary flex items-center justify-center">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in required</h2>
          <p className="text-gray-500">Please sign in to manage forms.</p>
        </motion.div>
      </Unauthenticated>

      <Authenticated>
        {/* Form Title Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          {form === undefined ? (
            <div className="flex items-center gap-3">
              <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse" />
            </div>
          ) : form === null ? (
            <div className="text-red-500">Form not found</div>
          ) : (
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {form.name || "Untitled Form"}
              </h1>
              {form.description && (
                <p className="text-gray-500 mt-1">{form.description}</p>
              )}
            </div>
          )}
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex flex-wrap gap-2 p-1.5 bg-gray-100 rounded-2xl max-w-fit">
            {tabs.map((tab) => (
              <motion.button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
                  activeTab === tab.value
                    ? "text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {activeTab === tab.value && (
                  <motion.div
                    layoutId="activeTabBg"
                    className="absolute inset-0 bg-gradient-to-r from-quiz-primary to-quiz-secondary rounded-xl shadow-lg shadow-quiz-primary/20"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.5 text-xs font-semibold rounded-full ${
                        activeTab === tab.value
                          ? "bg-white/20 text-white"
                          : tab.badge === 0
                          ? "bg-quiz-coral/10 text-quiz-coral"
                          : "bg-quiz-mint/10 text-quiz-mint"
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === "details" && <FormDetails id={formId} />}

            {activeTab === "questions" && <FormQuestions formId={formId} />}

            {activeTab === "responses" && <FormResponses formId={formId} />}

            {activeTab === "analysis" && <FormAnalysis formId={formId} />}
          </motion.div>
        </AnimatePresence>
      </Authenticated>
    </div>
  );
}
