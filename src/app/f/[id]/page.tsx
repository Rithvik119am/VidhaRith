// src/app/f/[id]/page.tsx

"use client";

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api'; // Adjust path as needed
import { Id } from '../../../../convex/_generated/dataModel'; // Adjust path as needed
import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle, Clock, Info, Loader2, Ban } from 'lucide-react'; // Import icons

// Interface for form values (mapping question ID to selected option value)
interface QuizFormValues {
  [questionId: string]: string;
}

// --- Helper Function to Format Time ---
function formatTime(totalSeconds: number | null): string {
  if (totalSeconds === null || totalSeconds < 0) totalSeconds = 0;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// --- Main Page Component ---
export default function Page({ params }: { params: { id: string } }) {
  const slug = params.id;

  // --- State Variables ---
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timeExpired, setTimeExpired] = useState(false); // State to track expiration
  const [availabilityStatus, setAvailabilityStatus] = useState<{
    available: boolean;
    message: string | null;
    icon: React.ElementType | null;
  }>({ available: false, message: "Checking form availability...", icon: Loader2 });

  // --- Refs for Timer ---
  // Use refs to hold values that shouldn't trigger re-renders when they change inside effects
  const startTimeRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // --- Convex Queries & Mutations ---
  const formDetails = useQuery(api.forms.getBySlug, { slug });
  const formId = formDetails?._id;
  const addResponse = useMutation(api.form_responses.addResponse);

  // Skip questions query if formId isn't available yet
  const questions = useQuery(
    api.form_questions.getFormQuestionsForQuiz,
    formId ? { formId } : 'skip'
  );

  // --- Dynamic Form Schema Generation ---
  // Memoize schema and defaults to avoid unnecessary recalculations
  const { formSchema, defaultVals } = useMemo(() => {
    if (questions && questions.length > 0) {
      const schemaShape: { [key: string]: z.ZodString } = {};
      const defaults: QuizFormValues = {};
      questions.forEach((q) => {
        // Ensure each question requires an answer
        schemaShape[q._id] = z.string({ required_error: "Please select an answer." })
                                .min(1, { message: 'Please select an answer.' });
        defaults[q._id] = ''; // Default to empty string
      });
      return { formSchema: z.object(schemaShape), defaultVals: defaults };
    }
    // Return empty schema/defaults if no questions
    return { formSchema: z.object({}), defaultVals: {} };
  }, [questions]); // Dependency: questions

  // --- React Hook Form Initialization ---
  const form = useForm<QuizFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultVals,
    mode: 'onChange', // Validate on change for better UX
  });

  // Effect to reset the form when schema/defaults change (e.g., questions load)
  useEffect(() => {
     if (Object.keys(defaultVals).length > 0 || Object.keys(form.formState.defaultValues || {}).length > 0) {
         form.reset(defaultVals);
     }
  }, [formSchema, defaultVals, form.reset]); // Dependencies: schema, defaults, reset function

  // --- Availability Check Effect ---
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

    // 1. Check manual override first
    if (!formDetails.acceptingResponses) {
      isAvailable = false;
      message = "This form is currently not accepting responses.";
      icon = Ban;
    }
    // 2. Check Start Time
    else if (formDetails.startTime && now < formDetails.startTime) {
      isAvailable = false;
      message = `This form is not open yet. It opens on ${new Date(Number(formDetails.startTime)).toLocaleString()}.`;
      icon = Clock;
    }
    // 3. Check End Time
    else if (formDetails.endTime && now > formDetails.endTime) {
      isAvailable = false;
      message = `This form is closed. It stopped accepting responses on ${new Date(Number(formDetails.endTime)).toLocaleString()}.`;
       icon = Clock;
    }

    setAvailabilityStatus({ available: isAvailable, message, icon });

  }, [formDetails, slug]); // Dependencies: formDetails, slug

  // --- Timer Initialization & Management Effect ---
  useEffect(() => {
    // Check if timer should be active:
    // 1. Form is available (not closed by availability check)
    // 2. Form has a time limit set
    // 3. Questions are loaded (implies schema/form are ready)
    // 4. Time has not *already* expired in this session
    const timerShouldBeActive =
      availabilityStatus.available &&
      formDetails?.timeLimitMinutes !== undefined &&
      formDetails.timeLimitMinutes !== null &&
      questions &&
      !timeExpired;

    // If timer should be active AND hasn't started yet in this session
    if (timerShouldBeActive && startTimeRef.current === null) {
      const startTime = Date.now();
      startTimeRef.current = startTime; // Record start time using ref
      const limitSeconds = Number(formDetails.timeLimitMinutes) * 60;
      setTimeLeft(limitSeconds); // Set initial time

      // Start the interval
      const intervalId = setInterval(() => {
        // Calculate remaining time based on current time and stored start time
        const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current!) / 1000);
        const remaining = limitSeconds - elapsedSeconds;

        if (remaining <= 0) {
          setTimeLeft(0);
          setTimeExpired(true); // Set expiration state
          clearInterval(intervalId); // Clear this interval
          timerIntervalRef.current = null; // Clear interval ref
          // Display a toast notification when time runs out
          toast.warning("Time's up! Your responses cannot be submitted.", { duration: 10000 });
        } else {
          setTimeLeft(remaining); // Update state, this triggers re-render and countdown display
        }
      }, 1000); // Update every second

      timerIntervalRef.current = intervalId; // Store interval ID in ref

    } else if (!timerShouldBeActive && timerIntervalRef.current) {
       // If conditions for timer are no longer met (e.g., form becomes unavailable, time limit removed)
       // AND there's a running timer, clear it.
       clearInterval(timerIntervalRef.current);
       timerIntervalRef.current = null;
       startTimeRef.current = null; // Reset start time ref
       setTimeLeft(null); // Clear time left state
       // Important: Don't reset timeExpired here if the reason !timerShouldBeActive is true
       // is because timeExpired was set to true by the interval itself.
       // The state timeExpired being true is what we rely on to switch views.
       // We only reset timeExpired if it was due to external factors changing,
       // but the current logic handles this correctly by just stopping the timer.

    }
     // Note: If timerShouldBeActive becomes true but startTimeRef.current is *already* set
     // (e.g., component re-rendered for unrelated reason while timer was active),
     // the timer is NOT reset, it continues running based on the existing startTimeRef.current.
     // This is the desired behavior for session continuity.

    // Cleanup function: Clear interval on unmount or when dependencies change such that
    // the effect might re-run and set up a *new* interval (handled by the else if).
    // It also serves as a final cleanup on component unmount.
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      // Reset refs and state on cleanup to ensure a clean slate if the component re-mounts
      // or if the effect dependency changes stop the timer.
      startTimeRef.current = null;
      setTimeLeft(null);
      setTimeExpired(false); // Reset time expired state on cleanup/unmount
    };

  }, [availabilityStatus.available, formDetails?.timeLimitMinutes, questions]); // Dependencies for timer logic. Removed `timeExpired` from dependencies!


  // --- Form Submission Handler ---
  const handleSubmit = async (values: QuizFormValues) => {
    // Double-check conditions before submitting
    // Crucially, check if timeExpired is true
    if (!formId || !questions || !availabilityStatus.available || timeExpired) {
       const reason = timeExpired ? "time limit expired" : (availabilityStatus.message || "form is unavailable");
       toast.error(`Cannot submit the form: ${reason}.`);
       // If time expired, setting state again doesn't hurt but isn't strictly needed here
       if (timeExpired) setTimeExpired(true); // Reinforce timeExpired state if called somehow
       return; // PREVENT SUBMISSION
    }

    setIsSubmitting(true);

    // Map form values to the structure expected by the backend mutation
    const responseValues = Object.entries(values).map(([questionId, selectedValue]) => {
      const questionData = questions.find(q => q._id === questionId);
      return {
        questionId: questionId as Id<'form_questions'>,
        question: questionData?.question ?? 'Unknown Question', // Include question text
        userSelectedOption: selectedValue,
      };
    });

    try {
      // Send slug, response values, and sessionStartTime (if applicable, from ref)
      await addResponse({
        slug: slug,
        values: responseValues,
        sessionStartTime: startTimeRef.current ? BigInt(startTimeRef.current) : undefined, // Convert number from ref to BigInt
      });
      setIsSubmitted(true); // Update state to show success message
      toast.success('Your submission was recorded. Thank you ❤️');
    } catch (error: any) {
      console.error('Submission failed:', error);
      // Display more specific error from Convex if available
      toast.error(`Submission failed: ${error.data?.message || error.message || 'An unknown error occurred.'}`);
    } finally {
      setIsSubmitting(false); // Reset submitting state
    }
  };

  // --- Render Logic ---

  // 1. Loading Form Details
  if (formDetails === undefined) {
    return <FormSkeleton message="Loading form details..." />;
  }

  // 2. Form Not Found
  if (formDetails === null) {
     return (
       <FormClosedMessage
         message={availabilityStatus.message ?? `Form not found for slug: ${slug}`}
         icon={availabilityStatus.icon ?? AlertCircle}
       />
     );
   }

  // 3. Form Available Check (Manual override, start/end times)
  // Check this AFTER formDetails is loaded (not null/undefined)
  if (!availabilityStatus.available) {
    return (
      <FormClosedMessage
        message={availabilityStatus.message ?? "This form is currently unavailable."}
        icon={availabilityStatus.icon ?? Ban}
      />
    );
  }

  // 4. Loading Questions (Form details loaded, form is available)
  if (questions === undefined && formId) {
    return (
      <FormSkeleton
        title={formDetails.name}
        description={formDetails.description}
        message="Loading questions..."
        count={3} // Show a few skeleton questions
      />
    );
  }

  // 5. No Questions Available
  if (questions && questions.length === 0) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-2xl rounded-lg shadow-sm">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3">
          {formDetails.name || slug}
        </h1>
        {formDetails.description && (
          <p className="text-muted-foreground mb-6 text-sm sm:text-base">
            {formDetails.description}
          </p>
        )}
        <div className="text-center text-muted-foreground mt-10 p-6 border border-dashed rounded-md">
          This form currently has no questions to display.
        </div>
      </div>
    );
  }

   // 6. Form Schema Not Ready (Should be brief, handled by useMemo/useEffect)
   // This check prevents rendering the form structure before RHF is ready
   if (Object.keys(formSchema.shape).length === 0 && questions && questions.length > 0) {
     return (
       <FormSkeleton
         title={formDetails.name}
         description={formDetails.description}
         message="Initializing form..."
         count={questions.length}
       />
     );
   }


  // 7. Render Submitted View
  if (isSubmitted) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-2xl">
          <div className="text-center p-8 rounded-lg shadow-md border border-green-200 bg-green-50">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h2 className="text-green-700 text-xl sm:text-2xl font-semibold mb-3">
              Thank You!
            </h2>
            <p className="text-green-600 text-sm sm:text-base">
              Your submission has been successfully recorded.
            </p>
          </div>
      </div>
    );
  }

  // 8. Render Time Expired View (NEW CHECK)
  // Check this AFTER availability and loading, BUT BEFORE rendering the form
  if (timeExpired) {
     return (
        <FormClosedMessage // Reuse the component for displaying messages
           message="Time's Up! You can no longer submit this form."
           icon={Clock} // Use the clock icon
        />
     );
  }


  // 9. Render the Active Form (Only if none of the above conditions are met)
  return (
    <div className="container mx-auto p-4 md:p-8 max-w-2xl rounded-lg shadow-md">
      {/* Form Header */}
      <div className="mb-6 border-b pb-4">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">{formDetails.name || slug}</h1>
        {formDetails.description && (
          <p className="text-gray-600 text-sm md:text-base">{formDetails.description}</p>
        )}
      </div>

      {/* Timer Display (if applicable) */}
      {/* Only show timer area if timeLimitMinutes is set on the form */}
      {formDetails.timeLimitMinutes !== undefined && formDetails.timeLimitMinutes !== null && (
         <>
          {/* Show counting down timer OR the final 00:00 */}
          {(timeLeft !== null) && ( // Show timer if timeLeft is initialized
              <div className={`sticky top-0 z-10 mb-6 p-3 rounded-md border flex items-center justify-center space-x-2 text-sm sm:text-base font-medium shadow-sm ${timeExpired ? 'bg-red-100 border-red-300 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                  <Clock className="h-5 w-5" />
                  {/* Display the formatted time, will be 00:00 if timeExpired is true */}
                  <span>Time Remaining: {formatTime(timeLeft)}</span>
              </div>
          )}
          {/* This block is now mostly redundant because the main render logic handles showing a separate "Time Expired" view,
              but keeping it here provides a fallback message directly *within* the form context if somehow
              the main render logic didn't switch views correctly. However, removing it simplifies things.
              Let's rely on the main render logic switch. */}
         </>
      )}


      {/* Form Rendering */}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-8"
        >
          {questions && questions.map((question, index) => (
            <FormField
                control={form.control}
                name={question._id}
                key={question._id}
                render={({ field }) => (
                <FormItem className="bg-gray-50 p-4 sm:p-6 rounded-lg border border-gray-200 space-y-3">
                  {/* Question Text */}
                  <FormLabel className="text-base sm:text-lg font-semibold !mb-3 block text-gray-800">
                    {`${index + 1}. ${question.question}`}
                  </FormLabel>

                  {/* Radio Group for Options */}
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="space-y-2"
                      // Disable radio group if time expired or form is submitting
                      disabled={timeExpired || isSubmitting}
                    >
                      {question.selectOptions?.map((option, optIndex) => (
                        <FormItem
                            key={`${question._id}-${optIndex}`}
                            className="flex items-center space-x-3 p-2 rounded hover:bg-gray-100 transition-colors"
                        >
                            <FormControl>
                                <RadioGroupItem
                                    value={option}
                                    id={`${question._id}-${optIndex}`}
                                />
                            </FormControl>
                            <Label
                                htmlFor={`${question._id}-${optIndex}`}
                                className="font-normal text-sm sm:text-base text-gray-700 cursor-pointer flex-1"
                            >
                                {option}
                            </Label>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  {/* Display validation error for this specific question */}
                  <FormMessage className="text-red-600 text-xs pt-1" />
                </FormItem>
              )}
            />
          ))}

          {/* Submission Button Area */}
          <div className="pt-4 flex justify-end">
            <Button
              type="submit"
              // Disable if submitting, time expired, or form is invalid
              disabled={isSubmitting || timeExpired || !form.formState.isValid}
              className="min-w-[120px] text-base"
              aria-live="polite"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : timeExpired ? (
                 "Time Expired" // Button text changes when time is up
              ) : (
                "Submit Answers"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

// --- Reusable Loading Skeleton Component ---
function FormSkeleton({
  title,
  description,
  message = 'Loading...',
  count = 3,
}: {
  title?: string | null;
  description?: string | null;
  message?: string;
  count?: number;
}) {
  return (
    <div className="container mx-auto p-4 md:p-8 max-w-2xl  rounded-lg shadow-md animate-pulse">
      {/* Header Skeleton */}
      <div className="mb-6 border-b pb-4">
        {title ? <h1 className="text-2xl md:text-3xl font-bold mb-2">{title}</h1> : <Skeleton className="h-8 w-3/4 mb-2" />}
        {description ? <p className="text-gray-600 text-sm md:text-base">{description}</p> : <Skeleton className="h-5 w-full" />}
      </div>

      {/* Loading Message */}
      <div className="text-center my-6 font-medium text-muted-foreground flex items-center justify-center space-x-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>{message}</span>
      </div>

      {/* Question Skeletons */}
      <div className="space-y-8">
        {[...Array(count)].map((_, i) => (
          <div key={i} className="space-y-4 p-4 sm:p-6 border rounded-lg bg-gray-50">
            <Skeleton className="h-6 w-5/6 mb-3" /> {/* Question text */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-3"><Skeleton className="h-5 w-5 rounded-full" /><Skeleton className="h-5 w-2/3" /></div>
              <div className="flex items-center space-x-3"><Skeleton className="h-5 w-5 rounded-full" /><Skeleton className="h-5 w-1/2" /></div>
              <div className="flex items-center space-x-3"><Skeleton className="h-5 w-5 rounded-full" /><Skeleton className="h-5 w-3/4" /></div>
            </div>
          </div>
        ))}
      </div>

      {/* Button Skeleton */}
      <div className="pt-8 flex justify-end">
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}

// --- Reusable Message Component for Closed/Unavailable Forms ---
function FormClosedMessage({ message, icon: Icon = Info }: { message: string, icon?: React.ElementType }) {
    return (
        <div className="container mx-auto p-4 md:p-8 max-w-2xl">
             <div className="text-center p-8 rounded-lg shadow-md border border-yellow-200 bg-yellow-50">
                 <Icon className="mx-auto h-10 w-10 text-yellow-500 mb-4" />
                <h2 className="text-yellow-700 text-lg sm:text-xl font-semibold mb-2">
                  {/* Use a generic title or pass one if needed, but "Form Unavailable" works for time expired too */}
                   Status Update
                </h2>
                <p className="text-yellow-600 text-sm sm:text-base">
                    {message}
                </p>
            </div>
        </div>
    );
}