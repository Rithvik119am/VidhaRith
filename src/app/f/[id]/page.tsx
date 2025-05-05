// src/app/f/[id]/page.tsx  (Assuming your slug param is named 'id' in the folder structure)

"use client";

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api'; // Adjust path as needed
import { Id } from '../../../../convex/_generated/dataModel'; // Adjust path as needed
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField, // Import FormField for proper structure (though not explicitly used here, good practice)
  FormItem,  // Import FormItem
  FormLabel, // Import FormLabel
  FormMessage, // Import FormMessage
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label'; // Keep Label for RadioGroup options
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle, Clock, Info, Loader2, Ban } from 'lucide-react'; // Import icons

// Interface for form values (mapping question ID to selected option value)
interface QuizFormValues {
  [questionId: string]: string; // e.g., { "q1_id": "option_a", "q2_id": "option_c" }
}

// --- Helper Function to Format Time ---
function formatTime(totalSeconds: number): string {
  if (totalSeconds < 0) totalSeconds = 0;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// --- Main Page Component ---
export default function Page({ params }: { params: { id: string } }) {
  const slug = params.id; // Use slug consistently

  // --- State Variables ---
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timeExpired, setTimeExpired] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<{
    available: boolean;
    message: string | null;
    icon: React.ElementType | null;
  }>({ available: false, message: "Checking form availability...", icon: Loader2 });

  // --- Convex Queries & Mutations ---
  const formDetails = useQuery(api.forms.getBySlug, { slug });
  const formId = formDetails?._id;
  const addResponse = useMutation(api.form_responses.addResponse);

  // Skip questions query if formId isn't available yet
  const questions = useQuery(
    api.form_questions.getFormQuestions,
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
    form.reset(defaultVals);
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
    // Only start timer if the form is available, has a time limit, questions are loaded, and timer isn't already running/expired
    if (
        availabilityStatus.available &&
        formDetails &&
        formDetails.timeLimitMinutes &&
        questions && // Ensure questions are loaded
        sessionStartTime === null && // Only set start time once
        !timeExpired
      ) {
      const startTime = Date.now();
      setSessionStartTime(startTime);
      const limitSeconds = Number(formDetails.timeLimitMinutes) * 60;
      setTimeLeft(limitSeconds);

      const intervalId = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        const remaining = limitSeconds - elapsedSeconds;

        if (remaining <= 0) {
          setTimeLeft(0);
          setTimeExpired(true);
          clearInterval(intervalId);
          toast.warning("Time's up! Your responses cannot be submitted.", { duration: 10000 });
        } else {
          setTimeLeft(remaining);
        }
      }, 1000); // Update every second

      // Cleanup function to clear interval when component unmounts or dependencies change
      return () => clearInterval(intervalId);
    }

    // If form becomes unavailable or time limit is removed, clear timer state
     if (!availabilityStatus.available || (formDetails && !formDetails.timeLimitMinutes)) {
         setSessionStartTime(null);
         setTimeLeft(null);
         setTimeExpired(false);
     }

  }, [availabilityStatus.available, formDetails, questions, sessionStartTime, timeExpired]); // Dependencies for timer logic


  // --- Form Submission Handler ---
  const handleSubmit = async (values: QuizFormValues) => {
    // Double-check conditions before submitting
    if (!formId || !questions || !availabilityStatus.available || timeExpired) {
      toast.error('Cannot submit the form. It might be closed, not yet open, or the time limit expired.');
      return;
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
      // Send slug, response values, and sessionStartTime (if applicable)
      await addResponse({
        slug: slug,
        values: responseValues,
        sessionStartTime: sessionStartTime ? BigInt(sessionStartTime) : undefined, // Convert number to BigInt for timestamp
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

  // 2. Form Not Found or Not Available
  if (!availabilityStatus.available) {
    return (
      <FormClosedMessage
        message={availabilityStatus.message ?? "This form is currently unavailable."}
        icon={availabilityStatus.icon ?? Ban}
      />
    );
  }

  // 3. Loading Questions (Form details loaded, form is available)
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

  // 4. No Questions Available
  if (questions && questions.length === 0) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-2xl bg-white rounded-lg shadow-sm">
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

   // 5. Form Schema Not Ready (Should be brief, handled by useMemo/useEffect)
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


  // 6. Render Submitted View
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

  // 7. Render the Active Form
  return (
    <div className="container mx-auto p-4 md:p-8 max-w-2xl bg-white rounded-lg shadow-md">
      {/* Form Header */}
      <div className="mb-6 border-b pb-4">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">{formDetails.name || slug}</h1>
        {formDetails.description && (
          <p className="text-gray-600 text-sm md:text-base">{formDetails.description}</p>
        )}
      </div>

      {/* Timer Display (if applicable) */}
      {timeLeft !== null && (
          <div className={`sticky top-0 z-10 mb-6 p-3 rounded-md border flex items-center justify-center space-x-2 text-sm sm:text-base font-medium shadow-sm ${timeExpired ? 'bg-red-100 border-red-300 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
              <Clock className="h-5 w-5" />
              <span>Time Remaining: {formatTime(timeLeft)}</span>
          </div>
      )}
      {timeExpired && (
          <div className="mb-6 p-3 rounded-md border bg-red-100 border-red-300 text-red-700 text-center text-sm font-medium">
              Time's up! You can no longer submit this form.
          </div>
      )}


      {/* Form Rendering */}
      <Form {...form}>
        <form
          // Using formId in key forces re-render if form changes, might not be necessary here
          // key={formId}
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-8"
        >
          {questions && questions.map((question, index) => (
            <FormField // Use FormField for structure and accessibility linking
                control={form.control}
                name={question._id} // Name corresponds to the key in form values/schema
                key={question._id}
                render={({ field }) => ( // Use render prop pattern
                <FormItem className="bg-gray-50 p-4 sm:p-6 rounded-lg border border-gray-200 space-y-3">
                  {/* Question Text */}
                  <FormLabel className="text-base sm:text-lg font-semibold !mb-3 block text-gray-800">
                    {`${index + 1}. ${question.question}`}
                  </FormLabel>

                  {/* Radio Group for Options */}
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange} // Use field.onChange from RHF
                      value={field.value} // Controlled component using field.value
                      className="space-y-2"
                    >
                      {question.selectOptions?.map((option, optIndex) => (
                        <FormItem // Nest FormItem for each radio option
                            key={`${question._id}-${optIndex}`}
                            className="flex items-center space-x-3 p-2 rounded hover:bg-gray-100 transition-colors"
                        >
                            <FormControl>
                                <RadioGroupItem
                                    value={option}
                                    id={`${question._id}-${optIndex}`} // Unique ID for label association
                                />
                            </FormControl>
                            <Label
                                htmlFor={`${question._id}-${optIndex}`} // Associate label with radio item
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
              className="min-w-[120px] text-base" // Ensure minimum width
              aria-live="polite" // Announce changes for screen readers
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : timeExpired ? (
                 "Time Expired"
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
    <div className="container mx-auto p-4 md:p-8 max-w-2xl bg-white rounded-lg shadow-md animate-pulse">
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
                  Form Unavailable
                </h2>
                <p className="text-yellow-600 text-sm sm:text-base">
                    {message}
                </p>
            </div>
        </div>
    );
}