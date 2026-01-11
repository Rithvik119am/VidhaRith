"use client";

import { useEffect, useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useCopyToClipboard } from "react-use";
import {
  Copy,
  ExternalLink,
  Play,
  Square,
  CalendarIcon,
  Link2,
  Settings2,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Save,
  AlertCircle,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

const formSchema = z
  .object({
    name: z.string().min(1, { message: "Form name cannot be empty." }),
    description: z.string().optional().or(z.literal("")),
    slug: z
      .string()
      .min(5, { message: "Slug must be at least 5 characters long." })
      .regex(/^[a-zA-Z0-9_-]+$/, {
        message: "Slug can only contain letters, numbers, hyphens, and underscores.",
      })
      .transform((s) => s.toLowerCase()),
    startTime: z.date().optional(),
    endTime: z.date().optional(),
    timeLimitMinutes: z.coerce
      .number({ invalid_type_error: "Must be a number" })
      .int({ message: "Must be a whole number" })
      .positive({ message: "Must be a positive number" })
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return data.endTime > data.startTime;
      }
      return true;
    },
    {
      message: "End time must be after start time.",
      path: ["endTime"],
    }
  );

type FormSchemaValues = z.infer<typeof formSchema>;

// Generate a random suffix for slug suggestions
const generateSlugSuffix = () => {
  return Math.random().toString(36).substring(2, 6);
};

export default function FormDetails({ id }: { id: string }) {
  const formId = id as Id<"forms">;
  const formDetails = useQuery(api.forms.get, { formId });
  const updateForm = useMutation(api.forms.update);
  const toggleFormStatus = useMutation(api.forms.toggleStatus);
  const [, copyToClipboard] = useCopyToClipboard();

  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  // Slug availability states
  const [slugToCheck, setSlugToCheck] = useState<string>("");
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugAvailability, setSlugAvailability] = useState<{
    available: boolean;
    suggestion?: string;
  } | null>(null);

  // Query for slug availability (only runs when slugToCheck changes)
  const slugAvailabilityResult = useQuery(
    api.forms.checkSlugAvailability,
    slugToCheck.length >= 5 ? { slug: slugToCheck.toLowerCase(), excludeFormId: formId } : "skip"
  );

  const form = useForm<FormSchemaValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      slug: "",
      startTime: undefined,
      endTime: undefined,
      timeLimitMinutes: "",
    },
    mode: "onChange",
  });

  const watchSlug = form.watch("slug");
  const watchStartTime = form.watch("startTime");

  // Debounced slug checking
  useEffect(() => {
    const timer = setTimeout(() => {
      if (watchSlug && watchSlug.length >= 5) {
        setIsCheckingSlug(true);
        setSlugToCheck(watchSlug);
      } else {
        setSlugAvailability(null);
        setSlugToCheck("");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [watchSlug]);

  // Update availability when query result changes
  useEffect(() => {
    if (slugAvailabilityResult !== undefined) {
      setIsCheckingSlug(false);
      if (slugAvailabilityResult.available) {
        setSlugAvailability({ available: true });
      } else {
        // Generate a suggestion
        const basePart = slugToCheck.replace(/-[a-z0-9]{4}$/, "");
        const suggestion = `${basePart}-${generateSlugSuffix()}`;
        setSlugAvailability({ available: false, suggestion });
      }
    }
  }, [slugAvailabilityResult, slugToCheck]);

  // Apply slug suggestion
  const applySuggestion = useCallback(() => {
    if (slugAvailability?.suggestion) {
      form.setValue("slug", slugAvailability.suggestion, { shouldValidate: true, shouldDirty: true });
    }
  }, [slugAvailability?.suggestion, form]);

  useEffect(() => {
    if (formDetails) {
      form.reset({
        name: formDetails.name || "",
        description: formDetails.description || "",
        slug: formDetails.slug || "",
        startTime: formDetails.startTime ? new Date(Number(formDetails.startTime)) : undefined,
        endTime: formDetails.endTime ? new Date(Number(formDetails.endTime)) : undefined,
        timeLimitMinutes: formDetails.timeLimitMinutes ? Number(formDetails.timeLimitMinutes) : "",
      });
    }
  }, [formDetails, form]);

  const handleSubmit = async (values: FormSchemaValues) => {
    const { name, description, slug, startTime, endTime, timeLimitMinutes } = values;

    try {
      await updateForm({
        formId: formId,
        name,
        description: description || "",
        slug,
        startTime: startTime ? BigInt(startTime.getTime()) : undefined,
        endTime: endTime ? BigInt(endTime.getTime()) : undefined,
        timeLimitMinutes: timeLimitMinutes ? BigInt(Number(timeLimitMinutes)) : undefined,
      });
      toast.success("Form details updated successfully!");
      form.reset({}, { keepValues: true });
    } catch (e: any) {
      console.error("Failed to update form:", e);
      toast.error(`Failed to update form: ${e.data?.message || e.message || e.toString()}`);
    }
  };

  const handleToggleStatus = async () => {
    if (!formDetails) return;
    setIsTogglingStatus(true);
    try {
      const result = await toggleFormStatus({ formId });
      toast.success(`Form is now ${result.newStatus ? "accepting" : "not accepting"} responses.`);
    } catch (e: any) {
      console.error("Failed to toggle form status:", e);
      toast.error(`Failed to toggle status: ${e.data?.message || e.message || e.toString()}`);
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const formUrl = watchSlug ? `${process.env.NEXT_PUBLIC_WEBSITE_URL}/f/${watchSlug}` : "";

  const handleCopy = () => {
    if (!formUrl) return;
    copyToClipboard("http://" + formUrl);
    toast.info("Form URL copied to clipboard.");
  };

  const handleOpenForm = () => {
    if (formUrl) {
      window.open("http://" + formUrl, "_blank");
    }
  };

  const isLoading = formDetails === undefined;
  const currentStatus = formDetails?.acceptingResponses ?? false;

  return (
    <div className="space-y-6">
      {/* Share Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-quiz-primary/10 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-quiz-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Share Your Quiz</h3>
              <p className="text-sm text-gray-500">Publish this URL to collect responses</p>
            </div>
          </div>

          {/* Status Badge */}
          {!isLoading && (
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
                  currentStatus
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                )}
              >
                {currentStatus ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                {currentStatus ? "Accepting" : "Not Accepting"}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleToggleStatus}
                disabled={isTogglingStatus}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all",
                  currentStatus
                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                    : "bg-green-50 text-green-600 hover:bg-green-100"
                )}
              >
                {isTogglingStatus ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : currentStatus ? (
                  <Square className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                {currentStatus ? "Stop" : "Start"}
              </motion.button>
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                readOnly
                value={isLoading ? "Loading..." : formUrl || "Set a valid slug..."}
                className="h-12 bg-gray-50 border-gray-200 rounded-xl font-mono text-sm"
                placeholder="Form URL will appear here"
              />
            </div>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCopy}
                disabled={!formUrl || isLoading}
                className="flex items-center gap-2 px-5 h-12 bg-quiz-primary text-white font-medium rounded-xl disabled:opacity-50 transition-all hover:bg-quiz-primary/90"
              >
                <Copy className="w-4 h-4" />
                Copy
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleOpenForm}
                disabled={!formUrl || isLoading}
                className="flex items-center gap-2 px-5 h-12 bg-gray-100 text-gray-700 font-medium rounded-xl disabled:opacity-50 transition-all hover:bg-gray-200"
              >
                <ExternalLink className="w-4 h-4" />
                Open
              </motion.button>
            </div>
          </div>
          {!watchSlug && !isLoading && (
            <p className="text-sm text-red-500 mt-2">
              Please set a valid slug (min 5 chars) to generate the URL.
            </p>
          )}
        </div>
      </motion.div>

      {/* Settings Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-quiz-secondary/10 flex items-center justify-center">
            <Settings2 className="w-5 h-5 text-quiz-secondary" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Basic Info & Timing</h3>
            <p className="text-sm text-gray-500">Configure your quiz settings</p>
          </div>
        </div>

        <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Slug</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="e.g. feedback-survey-2023"
                            {...field}
                            className={cn(
                              "h-11 rounded-xl pr-10",
                              slugAvailability?.available === false && "border-red-300 focus-visible:ring-red-300",
                              slugAvailability?.available === true && "border-green-300 focus-visible:ring-green-300"
                            )}
                          />
                          {/* Availability indicator */}
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {isCheckingSlug && (
                              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                            )}
                            {!isCheckingSlug && slugAvailability?.available === true && (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            )}
                            {!isCheckingSlug && slugAvailability?.available === false && (
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                        </div>
                      </FormControl>
                      {/* Slug taken message with suggestion */}
                      {slugAvailability?.available === false && slugAvailability.suggestion && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-red-500">This slug is taken.</span>
                          <button
                            type="button"
                            onClick={applySuggestion}
                            className="text-sm text-quiz-primary hover:underline font-medium"
                          >
                            Try: {slugAvailability.suggestion}
                          </button>
                        </div>
                      )}
                      {slugAvailability?.available === true && (
                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          This slug is available
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="My Awesome Quiz"
                          {...field}
                          className="h-11 rounded-xl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">
                      Description{" "}
                      <span className="text-gray-400 font-normal">(Optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="A brief description of the quiz"
                        {...field}
                        className="h-11 rounded-xl"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-quiz-coral/10 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-quiz-coral" />
                  </div>
                  <h4 className="font-medium text-gray-900">Timing Rules</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-gray-700">Start Time</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "h-11 justify-start text-left font-normal rounded-xl",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? (
                                  format(field.value, "PPP p")
                                ) : (
                                  <span>Pick start date & time</span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date(new Date().setDate(new Date().getDate() - 1))
                              }
                              initialFocus
                            />
                            <div className="p-3 border-t border-border">
                              <Label className="text-sm mb-1 block">Time</Label>
                              <Input
                                type="time"
                                step="60"
                                className="rounded-lg"
                                value={field.value ? format(field.value, "HH:mm") : ""}
                                onChange={(e) => {
                                  const time = e.target.value;
                                  if (!time) return;
                                  const [hours, minutes] = time.split(":").map(Number);
                                  const currentDatePart = field.value
                                    ? new Date(field.value)
                                    : new Date();
                                  currentDatePart.setHours(hours, minutes, 0, 0);
                                  field.onChange(currentDatePart);
                                }}
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                        <FormDescription className="text-xs">
                          Form won&apos;t accept responses before this time.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-gray-700">End Time</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "h-11 justify-start text-left font-normal rounded-xl",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? (
                                  format(field.value, "PPP p")
                                ) : (
                                  <span>Pick end date & time</span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => {
                                const yesterday = new Date(
                                  new Date().setDate(new Date().getDate() - 1)
                                );
                                const startDate = watchStartTime
                                  ? new Date(watchStartTime)
                                  : null;
                                date.setHours(0, 0, 0, 0);
                                yesterday.setHours(0, 0, 0, 0);
                                if (startDate) startDate.setHours(0, 0, 0, 0);
                                return date < yesterday || (!!startDate && date < startDate);
                              }}
                              initialFocus
                            />
                            <div className="p-3 border-t border-border">
                              <Label className="text-sm mb-1 block">Time</Label>
                              <Input
                                type="time"
                                step="60"
                                className="rounded-lg"
                                value={field.value ? format(field.value, "HH:mm") : ""}
                                onChange={(e) => {
                                  const time = e.target.value;
                                  if (!time) return;
                                  const [hours, minutes] = time.split(":").map(Number);
                                  const currentDatePart = field.value
                                    ? new Date(field.value)
                                    : new Date();
                                  currentDatePart.setHours(hours, minutes, 0, 0);
                                  field.onChange(currentDatePart);
                                }}
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                        <FormDescription className="text-xs">
                          Form automatically stops after this time.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="timeLimitMinutes"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormLabel className="text-gray-700">
                            Time Limit{" "}
                            <span className="text-gray-400 font-normal">(Minutes)</span>
                          </FormLabel>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button type="button" className="text-gray-400 hover:text-gray-600">
                                  <Info className="w-4 h-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>Sets how long each student has to complete the quiz after they start. The timer begins when they open the quiz page.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            placeholder="e.g., 30"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => {
                              field.onChange(e.target.value === "" ? "" : e.target.value);
                            }}
                            className="h-11 rounded-xl"
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Limit how long users have to complete the quiz.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="pt-4">
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  disabled={!form.formState.isDirty || !form.formState.isValid}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-quiz-primary to-quiz-secondary text-white font-semibold rounded-xl shadow-lg shadow-quiz-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </motion.button>
              </div>
            </form>
          </Form>
        </div>
      </motion.div>
    </div>
  );
}
