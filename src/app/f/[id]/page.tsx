"use client";

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api'; 
import { Id } from '../../../../convex/_generated/dataModel'; 
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
import { AlertCircle, CheckCircle, Clock, Info, Loader2, Ban } from 'lucide-react'; 

interface QuizFormValues {
  [questionId: string]: string;
}

function formatTime(totalSeconds: number | null): string {
  if (totalSeconds === null || totalSeconds < 0) totalSeconds = 0;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
    formId ? { formId } : 'skip'
  );

  const { formSchema, defaultVals } = useMemo(() => {
    if (questions && questions.length > 0) {
      const schemaShape: { [key: string]: z.ZodString } = {};
      const defaults: QuizFormValues = {};
      questions.forEach((q) => {
        schemaShape[q._id] = z.string({ required_error: "Please select an answer." })
                                .min(1, { message: 'Please select an answer.' });
        defaults[q._id] = ''; 
      });
      return { formSchema: z.object(schemaShape), defaultVals: defaults };
    }
    return { formSchema: z.object({}), defaultVals: {} };
  }, [questions]); 

  const form = useForm<QuizFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultVals,
    mode: 'onChange', 
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
    }
    else if (formDetails.startTime && now < formDetails.startTime) {
      isAvailable = false;
      message = `This form is not open yet. It opens on ${new Date(Number(formDetails.startTime)).toLocaleString()}.`;
      icon = Clock;
    }
    else if (formDetails.endTime && now > formDetails.endTime) {
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
      questions &&
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

  }, [availabilityStatus.available, formDetails?.timeLimitMinutes, questions]); 


  const handleSubmit = async (values: QuizFormValues) => {
    if (!formId || !questions || !availabilityStatus.available || timeExpired) {
       const reason = timeExpired ? "time limit expired" : (availabilityStatus.message || "form is unavailable");
       toast.error(`Cannot submit the form: ${reason}.`);
       if (timeExpired) setTimeExpired(true); 
       return; 
    }

    setIsSubmitting(true);

    const responseValues = Object.entries(values).map(([questionId, selectedValue]) => {
      const questionData = questions.find(q => q._id === questionId);
      return {
        questionId: questionId as Id<'form_questions'>,
        question: questionData?.question ?? 'Unknown Question', 
        userSelectedOption: selectedValue,
      };
    });

    try {
      await addResponse({
        slug: slug,
        values: responseValues,
        sessionStartTime: startTimeRef.current ? BigInt(startTimeRef.current) : undefined, 
      });
      setIsSubmitted(true); 
      toast.success('Your submission was recorded. Thank you ❤️');
    } catch (error: any) {
      console.error('Submission failed:', error);
      toast.error(`Submission failed: ${error.data?.message || error.message || 'An unknown error occurred.'}`);
    } finally {
      setIsSubmitting(false); 
    }
  };

  if (formDetails === undefined) {
    return <FormSkeleton message="Loading form details..." />;
  }
  if (formDetails === null) {
     return (
       <FormClosedMessage
         message={availabilityStatus.message ?? `Form not found for slug: ${slug}`}
         icon={availabilityStatus.icon ?? AlertCircle}
       />
     );
   }

  if (!availabilityStatus.available) {
    return (
      <FormClosedMessage
        message={availabilityStatus.message ?? "This form is currently unavailable."}
        icon={availabilityStatus.icon ?? Ban}
      />
    );
  }

  if (questions === undefined && formId) {
    return (
      <FormSkeleton
        title={formDetails.name}
        description={formDetails.description}
        message="Loading questions..."
        count={3} 
      />
    );
  }

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

  if (timeExpired) {
     return (
        <FormClosedMessage 
           message="Time's Up! You can no longer submit this form."
           icon={Clock} // Use the clock icon
        />
     );
  }


  return (
    <div className="container mx-auto p-4 md:p-8 max-w-2xl rounded-lg shadow-md">
      <div className="mb-6 border-b pb-4">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">{formDetails.name || slug}</h1>
        {formDetails.description && (
          <p className="text-gray-600 text-sm md:text-base">{formDetails.description}</p>
        )}
      </div>

      {formDetails.timeLimitMinutes !== undefined && formDetails.timeLimitMinutes !== null && (
         <>
          {(timeLeft !== null) && (
              <div className={`sticky top-0 z-10 mb-6 p-3 rounded-md border flex items-center justify-center space-x-2 text-sm sm:text-base font-medium shadow-sm ${timeExpired ? 'bg-red-100 border-red-300 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                  <Clock className="h-5 w-5" />
                  <span>Time Remaining: {formatTime(timeLeft)}</span>
              </div>
          )}
         </>
      )}


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
                  <FormLabel className="text-base sm:text-lg font-semibold !mb-3 block text-gray-800">
                    {`${index + 1}. ${question.question}`}
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="space-y-2"
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
                  <FormMessage className="text-red-600 text-xs pt-1" />
                </FormItem>
              )}
            />
          ))}

          <div className="pt-4 flex justify-end">
            <Button
              type="submit"
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
      <div className="mb-6 border-b pb-4">
        {title ? <h1 className="text-2xl md:text-3xl font-bold mb-2">{title}</h1> : <Skeleton className="h-8 w-3/4 mb-2" />}
        {description ? <p className="text-gray-600 text-sm md:text-base">{description}</p> : <Skeleton className="h-5 w-full" />}
      </div>

      <div className="text-center my-6 font-medium text-muted-foreground flex items-center justify-center space-x-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>{message}</span>
      </div>

      <div className="space-y-8">
        {[...Array(count)].map((_, i) => (
          <div key={i} className="space-y-4 p-4 sm:p-6 border rounded-lg bg-gray-50">
            <Skeleton className="h-6 w-5/6 mb-3" />
            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-3"><Skeleton className="h-5 w-5 rounded-full" /><Skeleton className="h-5 w-2/3" /></div>
              <div className="flex items-center space-x-3"><Skeleton className="h-5 w-5 rounded-full" /><Skeleton className="h-5 w-1/2" /></div>
              <div className="flex items-center space-x-3"><Skeleton className="h-5 w-5 rounded-full" /><Skeleton className="h-5 w-3/4" /></div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-8 flex justify-end">
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}

function FormClosedMessage({ message, icon: Icon = Info }: { message: string, icon?: React.ElementType }) {
    return (
        <div className="container mx-auto p-4 md:p-8 max-w-2xl">
             <div className="text-center p-8 rounded-lg shadow-md border border-yellow-200 bg-yellow-50">
                 <Icon className="mx-auto h-10 w-10 text-yellow-500 mb-4" />
                <h2 className="text-yellow-700 text-lg sm:text-xl font-semibold mb-2">
                   Status Update
                </h2>
                <p className="text-yellow-600 text-sm sm:text-base">
                    {message}
                </p>
            </div>
        </div>
    );
}