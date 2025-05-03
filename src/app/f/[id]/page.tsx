"use client";
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { useState, useEffect } from 'react';
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

interface QuizFormValues {
  [questionId: string]: string;
}

export default function Page({ params }: { params: { id: string } }) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formDetails = useQuery(api.forms.getBySlug, { slug: params.id });
  const formId = formDetails?._id;

  const questions = useQuery(
    api.form_questions.getFormQuestions,
    formId ? { formId } : 'skip'
  );

  const addResponse = useMutation(api.form_responses.addResponse);

  const [formSchema, setFormSchema] = useState<z.ZodObject<any>>(z.object({}));
  const [defaultVals, setDefaultVals] = useState<QuizFormValues>({});

  useEffect(() => {
    if (questions && questions.length > 0) {
      const schemaShape: { [key: string]: z.ZodString } = {};
      const defaults: QuizFormValues = {};
      questions.forEach((q) => {
        schemaShape[q._id] = z.string().min(1, {
          message: 'Please select an answer.',
        });
        defaults[q._id] = '';
      });
      setFormSchema(z.object(schemaShape));
      setDefaultVals(defaults);
    } else {
      setFormSchema(z.object({}));
      setDefaultVals({});
    }
  }, [questions]);

  const form = useForm<QuizFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultVals,
  });

  useEffect(() => {
    form.reset(defaultVals);
  }, [formSchema, defaultVals, form.reset]);

  const handleSubmit = async (values: QuizFormValues) => {
    if (!formId || !questions) {
      toast.error('Form data is not fully loaded. Please wait and try again.');
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
        values: responseValues,
        slug: params.id,
      });
      setIsSubmitted(true);
      toast.success('Your submission was recorded. Thank you ❤️');
    } catch (error: any) {
      console.error('Submission failed:', error);
      toast.error(`Submission failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading / Error States
  if (formDetails === undefined) {
    return <FormSkeleton message="Loading form details..." />;
  }
  if (formDetails === null) {
    return (
      <div className="text-center text-destructive mt-10 px-4">
        Form not found for slug: {params.id}
      </div>
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
      <div className="container mx-auto p-4 md:p-8 max-w-2xl bg-white rounded-lg shadow-sm">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3">
          {formDetails.name || params.id}
        </h1>
        {formDetails.description && (
          <p className="text-muted-foreground mb-6 text-sm sm:text-base">
            {formDetails.description}
          </p>
        )}
        <div className="text-center text-muted-foreground mt-10 p-6 border border-dashed rounded-md">
          This form currently has no questions.
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

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-2xl bg-white rounded-lg shadow-sm">
      {isSubmitted ? (
        <div className="text-center p-8 rounded-lg shadow-sm border border-green-200 bg-green-50">
          <div className="text-green-600 text-xl sm:text-2xl font-medium mb-3">
            Thank You!
          </div>
          <p className="text-green-700 text-sm sm:text-base">
            Your submission has been successfully recorded.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-3">{formDetails.name || params.id}</h1>
            {formDetails.description && (
              <p className="text-gray-600 md:text-lg">{formDetails.description}</p>
            )}
          </div>
  
          <Form {...form}>
            <form 
              key={formId} 
              onSubmit={form.handleSubmit(handleSubmit)} 
              className="space-y-8"
            >
              {questions && questions.map((question, index) => (
                <div 
                  key={question._id}
                  className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-semibold">
                        {`${index + 1}. ${question.question}`}
                      </span>
                    </div>
                  </div>
  
                  <RadioGroup
                    defaultValue=""
                    onValueChange={(value) => {
                      form.setValue(question._id, value);
                    }}
                    className="mt-4 space-y-2"
                  >
                    {question.selectOptions?.map((option) => (
                      <div 
                        key={`${question._id}-${option}`}
                        className="flex items-start space-x-2"
                      >
                        <RadioGroupItem 
                          value={option}
                          id={`${question._id}-${option}`}
                          className="h-4 w-4"
                        />
                        <Label 
                          htmlFor={`${question._id}-${option}`}
                           className="text-sm text-gray-700 cursor-pointer flex-1 break-words"
                        >
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ))}
  
              <div className="pt-4 pb-8">
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !form.formState.isValid}
                  className="w-full md:w-auto px-8 py-2 text-base font-medium rounded-md bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {isSubmitting ? "Submitting..." : "Submit Answers"}
                </Button>
              </div>
            </form>
          </Form>
        </>
      )}
    </div>
  );
}

// --- Loading Skeleton Component ---
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
    <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-full sm:max-w-2xl bg-white rounded-lg shadow-sm animate-pulse overflow-x-hidden">
      {title ? (
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3">{title}</h1>
      ) : (
        <Skeleton className="h-8 w-3/4 mb-3" />
      )}
      {description ? (
        <p className="text-muted-foreground mb-6 text-sm sm:text-base">{description}</p>
      ) : (
        <Skeleton className="h-5 w-full mb-6" />
      )}
      <div className="text-center my-6 font-medium text-muted-foreground">{message}</div>
      <div className="space-y-6">
        {[...Array(count)].map((_, i) => (
          <div key={i} className="space-y-4 p-3 sm:p-4 border rounded-lg bg-gray-50">
            <Skeleton className="h-6 w-5/6" />
            <div className="flex flex-col space-y-3 pt-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-5 w-2/3" />
            </div>
          </div>
        ))}
        <div className="pt-4 pb-8">
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}