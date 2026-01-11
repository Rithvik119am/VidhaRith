"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Ban,
  Sparkles,
  Send,
  PartyPopper,
} from "lucide-react";

interface FormQuestion {
  _id: string;
  question: string;
  selectOptions?: string[];
}

interface QuizFormValues {
  [questionId: string]: string;
}

function formatTime(totalSeconds: number | null): string {
  if (totalSeconds === null || totalSeconds < 0) totalSeconds = 0;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export default function Page({ params }: { params: { id: string } }) {
  const slug = params.id;

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timeExpired, setTimeExpired] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<{
    available: boolean;
    message: string | null;
    icon: React.ElementType | null;
  }>({ available: false, message: "Checking form availability...", icon: Loader2 });

  const startTimeRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const formDetails = useQuery(api.forms.getBySlug, { slug });
  const formId = formDetails?._id;
  const addResponse = useMutation(api.form_responses.addResponse);

  const questions = useQuery(
    api.form_questions.getFormQuestionsForQuiz,
    formId ? { formId } : "skip"
  ) as FormQuestion[] | undefined;

  const randomizedQuestions = useMemo(() => {
    if (!questions) return [];

    const questionsCopy = questions.map((q) => ({
      ...q,
      _id: q._id.toString(),
      selectOptions: q.selectOptions ? [...q.selectOptions] : [],
    }));

    const shuffledQuestions = questionsCopy.sort(() => Math.random() - 0.5);

    return shuffledQuestions.map((question) => ({
      ...question,
      selectOptions: question.selectOptions
        ? [...question.selectOptions].sort(() => Math.random() - 0.5)
        : [],
    }));
  }, [questions]);

  const { formSchema, defaultVals } = useMemo(() => {
    if (randomizedQuestions && randomizedQuestions.length > 0) {
      const schemaShape: { [key: string]: z.ZodString } = {};
      const defaults: QuizFormValues = {};
      randomizedQuestions.forEach((q) => {
        schemaShape[q._id] = z
          .string({ required_error: "Please select an answer." })
          .min(1, { message: "Please select an answer." });
        defaults[q._id] = "";
      });
      return { formSchema: z.object(schemaShape), defaultVals: defaults };
    }
    return { formSchema: z.object({}), defaultVals: {} };
  }, [randomizedQuestions]);

  const form = useForm<QuizFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultVals,
    mode: "onChange",
  });

  useEffect(() => {
    if (Object.keys(defaultVals).length > 0 || Object.keys(form.formState.defaultValues || {}).length > 0) {
      form.reset(defaultVals);
    }
  }, [formSchema, defaultVals, form.reset]);

  useEffect(() => {
    if (formDetails === undefined) {
      setAvailabilityStatus({ available: false, message: "Loading form details...", icon: Loader2 });
      return;
    }
    if (formDetails === null) {
      setAvailabilityStatus({ available: false, message: `Form not found for slug: ${slug}`, icon: AlertCircle });
      return;
    }

    const now = Date.now();
    let isAvailable = true;
    let message: string | null = null;
    let icon: React.ElementType | null = null;

    if (!formDetails.acceptingResponses) {
      isAvailable = false;
      message = "This form is currently not accepting responses.";
      icon = Ban;
    } else if (formDetails.startTime && now < formDetails.startTime) {
      isAvailable = false;
      message = `This form is not open yet. It opens on ${new Date(Number(formDetails.startTime)).toLocaleString()}.`;
      icon = Clock;
    } else if (formDetails.endTime && now > formDetails.endTime) {
      isAvailable = false;
      message = `This form is closed. It stopped accepting responses on ${new Date(Number(formDetails.endTime)).toLocaleString()}.`;
      icon = Clock;
    }

    setAvailabilityStatus({ available: isAvailable, message, icon });
  }, [formDetails, slug]);

  useEffect(() => {
    const timerShouldBeActive =
      availabilityStatus.available &&
      formDetails?.timeLimitMinutes !== undefined &&
      formDetails.timeLimitMinutes !== null &&
      randomizedQuestions &&
      !timeExpired;

    if (timerShouldBeActive && startTimeRef.current === null) {
      const startTime = Date.now();
      startTimeRef.current = startTime;
      const limitSeconds = Number(formDetails.timeLimitMinutes) * 60;
      setTimeLeft(limitSeconds);

      const intervalId = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current!) / 1000);
        const remaining = limitSeconds - elapsedSeconds;

        if (remaining <= 0) {
          setTimeLeft(0);
          setTimeExpired(true);
          clearInterval(intervalId);
          timerIntervalRef.current = null;
          toast.warning("Time's up! Your responses cannot be submitted.", { duration: 10000 });
        } else {
          setTimeLeft(remaining);
        }
      }, 1000);

      timerIntervalRef.current = intervalId;
    } else if (!timerShouldBeActive && timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
      startTimeRef.current = null;
      setTimeLeft(null);
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      startTimeRef.current = null;
      setTimeLeft(null);
      setTimeExpired(false);
    };
  }, [availabilityStatus.available, formDetails?.timeLimitMinutes, randomizedQuestions]);

  const handleSubmit = async (values: QuizFormValues) => {
    if (!formId || !randomizedQuestions || !availabilityStatus.available || timeExpired) {
      const reason = timeExpired ? "time limit expired" : (availabilityStatus.message || "form is unavailable");
      toast.error(`Cannot submit the form: ${reason}.`);
      if (timeExpired) setTimeExpired(true);
      return;
    }

    setIsSubmitting(true);

    const responseValues = randomizedQuestions.map((question) => ({
      questionId: question._id as Id<"form_questions">,
      question: question.question,
      userSelectedOption: values[question._id] || "",
    }));

    try {
      await addResponse({
        slug: slug,
        values: responseValues,
        sessionStartTime: startTimeRef.current ? BigInt(startTimeRef.current) : undefined,
      });
      setIsSubmitted(true);
      toast.success("Your submission was recorded. Thank you!");
    } catch (error: any) {
      console.error("Submission failed:", error);
      toast.error(`Submission failed: ${error.data?.message || error.message || "An unknown error occurred."}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const answeredCount = Object.values(form.watch()).filter((v) => v).length;
  const totalQuestions = randomizedQuestions?.length || 0;
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  // Loading state
  if (formDetails === undefined) {
    return <QuizSkeleton message="Loading quiz..." />;
  }

  // Form not found
  if (formDetails === null) {
    return (
      <StatusMessage
        type="error"
        title="Quiz Not Found"
        message={`We couldn't find a quiz with the URL "${slug}"`}
        icon={AlertCircle}
      />
    );
  }

  // Form unavailable
  if (!availabilityStatus.available) {
    return (
      <StatusMessage
        type="warning"
        title="Quiz Unavailable"
        message={availabilityStatus.message ?? "This quiz is currently unavailable."}
        icon={availabilityStatus.icon ?? Ban}
      />
    );
  }

  // Loading questions
  if (randomizedQuestions === undefined && formId) {
    return <QuizSkeleton title={formDetails.name} message="Loading questions..." />;
  }

  // No questions
  if (randomizedQuestions && randomizedQuestions.length === 0) {
    return (
      <StatusMessage
        type="info"
        title={formDetails.name || "Quiz"}
        message="This quiz currently has no questions to display."
        icon={AlertCircle}
      />
    );
  }

  // Form schema not ready
  if (Object.keys(formSchema.shape).length === 0 && randomizedQuestions && randomizedQuestions.length > 0) {
    return <QuizSkeleton title={formDetails.name} message="Preparing quiz..." />;
  }

  // Success state
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-quiz-light/30 to-quiz-mint/20 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-quiz-mint to-emerald-400 flex items-center justify-center shadow-2xl shadow-quiz-mint/30"
          >
            <PartyPopper className="w-12 h-12 text-white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-gray-900 mb-4"
          >
            Thank You!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 text-lg"
          >
            Your answers have been submitted successfully.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-quiz-mint/20"
          >
            <p className="text-sm text-gray-500">
              Your responses are anonymous and will help improve learning outcomes.
            </p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Time expired
  if (timeExpired) {
    return (
      <StatusMessage
        type="error"
        title="Time's Up!"
        message="The time limit for this quiz has expired. You can no longer submit your answers."
        icon={Clock}
      />
    );
  }

  // Main quiz view
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-quiz-light/20">
      {/* Sticky Header with Progress */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100"
      >
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-quiz-primary to-quiz-secondary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 line-clamp-1">{formDetails.name || "Quiz"}</h1>
                <p className="text-xs text-gray-500">
                  {answeredCount} of {totalQuestions} answered
                </p>
              </div>
            </div>

            {timeLeft !== null && (
              <motion.div
                animate={{ scale: timeLeft <= 60 ? [1, 1.05, 1] : 1 }}
                transition={{ duration: 0.5, repeat: timeLeft <= 60 ? Infinity : 0 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-sm font-semibold ${
                  timeLeft <= 60
                    ? "bg-red-50 text-red-600 border border-red-200"
                    : "bg-quiz-primary/10 text-quiz-primary"
                }`}
              >
                <Clock className="w-4 h-4" />
                {formatTime(timeLeft)}
              </motion.div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
              className="h-full bg-gradient-to-r from-quiz-primary to-quiz-secondary rounded-full"
            />
          </div>
        </div>
      </motion.header>

      {/* Quiz Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {formDetails.description && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-gray-600 mb-8 text-center"
          >
            {formDetails.description}
          </motion.p>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <AnimatePresence>
              {randomizedQuestions &&
                randomizedQuestions.map((question: FormQuestion, index: number) => (
                  <motion.div
                    key={question._id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <FormField
                      control={form.control}
                      name={question._id}
                      render={({ field }) => (
                        <FormItem className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                          {/* Question Header */}
                          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                            <FormLabel className="text-base font-semibold text-gray-900 flex items-start gap-3">
                              <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-quiz-primary/10 text-quiz-primary flex items-center justify-center text-sm font-bold">
                                {index + 1}
                              </span>
                              <span className="pt-1">{question.question}</span>
                            </FormLabel>
                          </div>

                          {/* Options */}
                          <div className="p-4">
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                className="space-y-2"
                                disabled={timeExpired || isSubmitting}
                              >
                                {question.selectOptions?.map((option: string, optIndex: number) => {
                                  const isSelected = field.value === option;
                                  return (
                                    <FormItem key={`${question._id}-${optIndex}`} className="flex items-center space-x-0">
                                      <FormControl>
                                        <RadioGroupItem
                                          value={option}
                                          id={`${question._id}-${optIndex}`}
                                          className="sr-only"
                                        />
                                      </FormControl>
                                      <Label
                                        htmlFor={`${question._id}-${optIndex}`}
                                        className={`flex-1 p-4 rounded-xl cursor-pointer transition-all border-2 ${
                                          isSelected
                                            ? "border-quiz-primary bg-quiz-primary/5 text-quiz-primary"
                                            : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                                        }`}
                                      >
                                        <div className="flex items-center gap-3">
                                          <div
                                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                              isSelected
                                                ? "border-quiz-primary bg-quiz-primary"
                                                : "border-gray-300"
                                            }`}
                                          >
                                            {isSelected && (
                                              <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="w-2 h-2 bg-white rounded-full"
                                              />
                                            )}
                                          </div>
                                          <span className={`text-sm ${isSelected ? "font-medium" : "text-gray-700"}`}>
                                            {option}
                                          </span>
                                        </div>
                                      </Label>
                                    </FormItem>
                                  );
                                })}
                              </RadioGroup>
                            </FormControl>
                            <FormMessage className="text-red-500 text-xs mt-2 px-2" />
                          </div>
                        </FormItem>
                      )}
                    />
                  </motion.div>
                ))}
            </AnimatePresence>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="pt-6"
            >
              <motion.button
                type="submit"
                disabled={isSubmitting || timeExpired || !form.formState.isValid}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-quiz-primary to-quiz-secondary text-white font-semibold rounded-2xl shadow-xl shadow-quiz-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : timeExpired ? (
                  "Time Expired"
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Answers
                  </>
                )}
              </motion.button>

              {!form.formState.isValid && answeredCount < totalQuestions && (
                <p className="text-center text-sm text-gray-500 mt-3">
                  Please answer all questions to submit
                </p>
              )}
            </motion.div>
          </form>
        </Form>
      </main>
    </div>
  );
}

function QuizSkeleton({ title, message = "Loading..." }: { title?: string | null; message?: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-quiz-light/20 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-quiz-primary to-quiz-secondary flex items-center justify-center"
        >
          <Sparkles className="w-8 h-8 text-white" />
        </motion.div>
        {title && <h1 className="text-xl font-bold text-gray-900 mb-2">{title}</h1>}
        <p className="text-gray-500">{message}</p>
      </div>
    </div>
  );
}

function StatusMessage({
  type,
  title,
  message,
  icon: Icon,
}: {
  type: "error" | "warning" | "info";
  title: string;
  message: string;
  icon: React.ElementType;
}) {
  const colors = {
    error: {
      bg: "from-red-50 to-orange-50",
      icon: "from-red-400 to-orange-400",
      text: "text-red-600",
      border: "border-red-100",
    },
    warning: {
      bg: "from-yellow-50 to-amber-50",
      icon: "from-yellow-400 to-amber-400",
      text: "text-yellow-700",
      border: "border-yellow-100",
    },
    info: {
      bg: "from-blue-50 to-sky-50",
      icon: "from-blue-400 to-sky-400",
      text: "text-blue-600",
      border: "border-blue-100",
    },
  };

  const c = colors[type];

  return (
    <div className={`min-h-screen bg-gradient-to-br ${c.bg} flex items-center justify-center p-4`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border ${c.border}`}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${c.icon} flex items-center justify-center`}
        >
          <Icon className="w-10 h-10 text-white" />
        </motion.div>
        <h1 className={`text-2xl font-bold mb-3 ${c.text}`}>{title}</h1>
        <p className="text-gray-600">{message}</p>
      </motion.div>
    </div>
  );
}
